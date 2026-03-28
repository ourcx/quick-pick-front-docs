#### 双 token

在小程序实现双token增强安全性和优化用户的体验

#### 思路

后端在登录的时候传过来的accessToken和refreshToken，我在uni.login的回调调用登录api

```javascript
let accessToken = result.data.data.accessToken;
let refreshToken = result.data.data.refreshToken;
let accessTime = result.data.data.accessExpiresIn;
let refreshTime = result.data.data.refreshExpiresIn;
let id = result.data.data.userId;

// 设置全局数据
getApp().globalData.token = accessToken;
getApp().globalData.login = true;

// 同步存储
uni.setStorageSync("token", accessToken);
uni.setStorageSync("id", id);
console.log(accessTime, accessToken, "access");
console.log(refreshTime, refreshToken, "refresh");

// 设置带过期时间的存储
setAdImagesWithExpiry(accessToken, accessTime, "accessToken");
setAdImagesWithExpiry(refreshToken, refreshTime, "refreshToken");
```

这里使用了一个工具函数,设置带时间的本地储存
在utils/timeStorage.js

```javascript
export function setAdImagesWithExpiry(list, expiresInMilliseconds, AD_IMAGES) {
 const now = new Date();
 const item = {
  value: list,
  expiry: now.getTime() + expiresInMilliseconds,
 };
 uni.setStorageSync(AD_IMAGES, JSON.stringify(item));
}

export function getAdImagesWithExpiry(AD_IMAGES, fn = () => {}) {
 const itemStr = uni.getStorageSync(AD_IMAGES);
 if (!itemStr) {
  return null;
 }
 const item = JSON.parse(itemStr);
 const now = new Date();
 if (now.getTime() > item.expiry) {
  // uni.removeStorage({
  //  key: AD_IMAGES,
  //  success: function() {
  //   console.log('删除成功');
  //  },
  //  fail: function() {
  //   console.log('删除失败');
  //  }
  // });
  fn();
  return null;
 }
 return item.value;
}
```

因为测试的原因,把清除过期数据的代码注释了  
这样就实现了定时储存和定时判断是否过期的方法  
把接收到的access和refresh的token都这样进行一个储存  

#### 在封装的请求里面进行拦截401

401是我们需要做处理的状态码

整个封装的请求代码如下

```javascript
import {
 getAdImagesWithExpiry,
 setAdImagesWithExpiry
} from "./timeStorage";

const BASE_URL = "https://localhost:8080"
const ACCESS_TOKEN_EXPIRED = "ACCESS_TOKEN_EXPIRED" // 需要执行短token刷新
const AUTH_INVALID = "AUTH_INVALID" // 需要跳转登录
const TOKEN_INVALID = "TOKEN_INVALID" // 需要清除本地的所有用户信息

// 不需要Token检查的URL列表
const NO_TOKEN_URLS = [
 '/user/user/login',
];

// 判断是否是不需要检查token的url
const isNoTokenUrl = (url) => {
 return NO_TOKEN_URLS.some(pattern => {
  if (typeof pattern === 'string') {
   return url.includes(pattern);
  }
  return false;
 });
};

// 刷新状态管理
let isRefreshing = false; // 是否正在刷新Token
let refreshSubscribers = []; // 等待Token刷新的请求队列

// 添加请求到等待队列
const addRefreshSubscriber = (callback) => {
 refreshSubscribers.push(callback);
};

// 执行等待队列中的请求
const onRefreshed = (token) => {
 refreshSubscribers.forEach(callback => callback(token));
 refreshSubscribers = [];
};

// 刷新Token的函数
const refreshToken = async () => {
 console.log('正在调用刷新Token的方法...');
 const refreshTokenValue = getAdImagesWithExpiry("refreshToken");
 console.log(refreshTokenValue, "token");

 const response = await uni.request({
  url: BASE_URL + '/user/user/refresh-token?refreshToken=' + encodeURIComponent(refreshTokenValue),
  method: 'POST',
 });

 console.log(response, "刷新的token的返回值");

 if (response.data.code === 1) {
  let accessToken = response.data.data.accessToken;
  let accessTime = response.data.data.accessExpiresIn;
  let id = response.data.data.userId;

  getApp().globalData.token = accessToken;
  setAdImagesWithExpiry(accessToken, accessTime, "accessToken");
  uni.setStorageSync("token", accessToken);
  uni.setStorageSync("id", id);
  getApp().globalData.login = true;

  console.log('Token刷新成功，新的Token已保存。');
  return true;
 } else {
  console.log('刷新Token失败', response);
  return false;
 }
};

// 处理Token刷新流程
const handleTokenRefresh = async () => {
 // 如果已经在刷新，直接返回Promise等待刷新完成
 if (isRefreshing) {
  return new Promise((resolve) => {
   addRefreshSubscriber((token) => {
    resolve(token);
   });
  });
 }

 isRefreshing = true;

 const refreshSuccess = await refreshToken();

 if (refreshSuccess) {
  // 刷新成功，通知所有等待的请求
  onRefreshed(getApp().globalData.token);
  return true;
 } else {
  // 刷新失败，清空队列并跳转登录
  refreshSubscribers = [];
  redirectToLogin();
  return false;
 }

 isRefreshing = false;
};

// 跳转到登录页
const redirectToLogin = () => {
 try {
  getApp().globalData.token = '';
  getApp().globalData.login = false;
 } catch (e) {
  console.error('清除缓存失败', e);
 }
 uni.reLaunch({
  url: '/pages/index/index'
 });
};

// 重试原始请求
const retryOriginalRequest = async (originalRequest) => {
 return new Promise((resolve, reject) => {
  uni.request({
   url: originalRequest.url,
   method: originalRequest.method,
   header: {
    ...originalRequest.header,
    'authentication': getApp().globalData.token || '',
   },
   data: originalRequest.data,
   timeout: originalRequest.timeout || 10000,
   complete: (res) => {
    if (res.statusCode === 200) {
     resolve(res);
    } else {
     reject(new Error(`重试请求失败: ${res.statusCode}`));
    }
   }
  });
 });
};

const request = async (method, url, data = {}, config = {}) => {
 try {
  // 如果是免Token URL，直接请求
  if (isNoTokenUrl(url)) {
   return await new Promise((resolve, reject) => {
    uni.request({
     url: BASE_URL + url,
     method: method.toUpperCase(),
     header: {
      'content-Type': config.contentType || 'application/json',
     },
     data: data,
     timeout: config.timeout || 10000,
     complete: (res) => {
      console.log(res, "登录过程的参数")
      if (res.statusCode === 200) {
       resolve(res);
      } else {
       reject(new Error(`请求失败: ${res.statusCode}`));
      }
     }
    });
   });
  }


                //用promise进行管理,特别是success的回调要用async...await这个,把所有错误统一起来进行处理
  return await new Promise((resolve, reject) => {
   uni.request({
    url: BASE_URL + url,
    method: method.toUpperCase(),
    header: {
     'content-Type': config.contentType || 'application/json',
     'authentication': getApp().globalData.token || '',
    },
    data: data,
    timeout: config.timeout || 10000,
    success: async (res) => {
     try {
      if (res.statusCode === 200) {
       resolve(res);
       return;
      }

      if (res.statusCode === 401 || (res?.data && res?.data?.code === 401)) {
       const errorType = res.data?.error;
       console.log(res.data, "401错误详情");

       switch (errorType) {
        case ACCESS_TOKEN_EXPIRED:
         // 保存原始请求信息
         const originalRequest = {
          url: BASE_URL + url,
          method: method.toUpperCase(),
          header: {
           'content-Type': config.contentType || 'application/json',
           'authentication': getApp().globalData.token || '',
          },
          data: data,
          timeout: config.timeout || 10000
         };

         // 如果正在刷新，加入等待队列
         if (isRefreshing) {
          console.log('Token正在刷新中，加入等待队列');
          addRefreshSubscriber(async (newToken) => {
           try {
            const retryResponse = await retryOriginalRequest(originalRequest);
            resolve(retryResponse);
           } catch (error) {
            reject(error);
           }
          });
          return;
         }

         // 执行Token刷新
         const refreshSuccess = await handleTokenRefresh();

         if (refreshSuccess) {
          console.log('Token刷新成功，重新发起原请求');
          try {
           const retryResponse = await retryOriginalRequest(originalRequest);
           resolve(retryResponse);
          } catch (error) {
           reject(error);
          }
         } else {
          reject(new Error('Token刷新失败'));
         }
         break;

        case AUTH_INVALID:
         console.log(errorType)
         redirectToLogin();
         break;
        case TOKEN_INVALID:
         getApp().globalData.token = '';
         getApp().globalData.login = false;
         uni.clearStorage()
         // 清除全部和用户有关的数据
         break

        default:
         reject(new Error(`认证错误: ${errorType}`));
       }
      } else {
       reject(new Error(`请求失败: ${res.statusCode}`));
      }
     } catch (error) {
      reject(error);
     }
    }
   });
  });

 } catch (err) {
  console.error('请求失败:', err);
  uni.showToast({
   title: '网络请求失败',
   icon: 'none'
  });
  throw err;
 }
};

export const http = {
 get: (url, data = {}, config) => request('GET', url, data, config),
 post: (url, data, config) => request('POST', url, data, config),
 put: (url, data, config) => request('PUT', url, data, config),
 delete: (url, data, config) => request('DELETE', url, data, config)
};
//把这个导出,挂载到全局上面去,方便使用

// 导出刷新状态，方便调试
export const getRefreshStatus = () => ({
 isRefreshing,
 queueLength: refreshSubscribers.length
});
```

以上便是在uniapp完成双token的代码了.谢谢观看
