## 使用 uniapp 提供的云函数开发

小程序计划开通自定义头像功能，经过团队讨论，决定使用微信免费内容审核服务对用户自定义头像进行鉴黄和鉴政审核。

## 技术实现

### 技术选型

由于小程序采用 uniapp 开发，优先考虑 uniapp 云平台。参考以下资料：

-   咸虾米的技术文章：[uni-sec-check内容安全unicloud公共模块](https://blog.csdn.net/qq_18798149/article/details/133350733)
-   官方文档：[uni-sec-check 公共模块](https://doc.dcloud.net.cn/uniCloud/uni-sec-check.html)

### 实施步骤

#### 1. 创建云函数文件

在 HBuilderX 中创建新的云函数文件。

#### 2. 关联服务空间

右键点击云函数目录，选择「关联服务空间」，完成服务空间配置。

#### 3. 安装公共库

从插件市场安装所需公共库：

-   [uni-sec-check 插件](https://ext.dcloud.net.cn/plugin?name=uni-sec-check)

`uni-sec-check` 依赖 `uni-open-bridge` 配置，需同时安装 [uni-open-bridge](https://uniapp.dcloud.net.cn/uniCloud/uni-open-bridge.html#uni-open-bridge%25E7%259A%2584%25E4%25BD%25BF%25E7%2594%25A8%25E6%25B5%2581%25E7%25A8%258B)。

#### 4. 配置小程序信息

在 `uni-open-bridge` 配置文件中设置小程序 ID 和密钥：

json

```
{
  "dcloudAppid": "__UNI_6E118A6",
  "mp-weixin": {
    "oauth": {
      "weixin": {
        "appid": "你的小程序ID",
        "appsecret": "你的小程序密钥"
      }
    }
  }
}
```

#### 5. 创建云函数

每个云函数需要包含以下文件：

-   `index.js` - 主逻辑文件
-   `package.json` - 依赖配置文件

**文本内容审核云函数**

javascript

```
const UniSecCheck = require('uni-sec-check');

exports.main = async (event, context) => {
  try {
    const { content, openid = "", scene = 2, version = 2 } = event;
    
    // 参数校验
    if (!content) {
      return {
        code: 400,
        success: false,
        errMsg: '检测内容不能为空'
      };
    }

    const uniSecCheck = new UniSecCheck({
      provider: 'mp-weixin',
      requestId: context.requestId,
    });

    const checkRes = await uniSecCheck.textSecCheck({
      content,
      openid,
      scene,
      version
    });

    // 处理检测结果
    if (checkRes.errCode === 'uni-sec-check-risk-content') {
      return {
        code: 400,
        success: false,
        errMsg: '内容不合规',
        result: checkRes.result
      };
    } else if (checkRes.errCode) {
      return {
        code: 500,
        success: false,
        errMsg: `检测服务异常: ${checkRes.errMsg}`
      };
    }

    // 检测通过
    return {
      code: 200,
      success: true,
      errMsg: '内容合规'
    };

  } catch (error) {
    console.error('文本检测异常:', error);
    return {
      code: 500,
      success: false,
      errMsg: `服务器内部错误: ${error.message}`
    };
  }
};
```

**头像审核云函数**

javascript

```
const UniSecCheck = require('uni-sec-check')

exports.main = async function(event, context) {
    // 参数校验
    const { url, openid = "", scene = 2, version = 2 } = event
    if (!url) {
      return {
        code: 400,
        success: false,
        errMsg: '缺少图片URL参数'
      }
    }

    // 创建内容安全检测实例
    const uniSecCheck = new UniSecCheck({
      provider: 'mp-weixin',
      requestId: context.requestId
    })

    // 进行图片安全检测
    console.log('开始图片安全检测:', url)
    const imgSecCheckRes = await uniSecCheck.imgSecCheck({
      image: url,
      openid: openid,
      scene: scene,
      version: version
    })

    console.log('图片检测结果:', imgSecCheckRes)

    // 处理检测结果
    if (imgSecCheckRes.errCode) {
      // 图片违规
      return {
        code: 400,
        success: false,
        errMsg: '图片内容违规',
        result: {
          label: imgSecCheckRes.result?.label,
          suggest: imgSecCheckRes.result?.suggest
        }
      }
    }
    
    // 检测通过
    return {
      code: 200,
      success: true,
      errMsg: '图片检测通过',
      data: imgSecCheckRes
    }
}
```

#### 6. 客户端调用

javascript

```
const openid = uni.getStorageSync('user_openid');
if (!openid) {
  uni.hideLoading();
  uni.showToast({
    title: '用户信息获取失败',
    icon: 'none'
  });
  return false;
}

const result = await uniCloud.callFunction({
  name: 'avatarCheck',
  data: {
    url: imageUrl,
    openid: openid,
    scene: 1, // 资料场景（用户头像）
    version: 2
  }
});
```

## 注意事项

1.  用户 openid 需要在用户登录时获取并存储
1.  v2 异步头像审核模式在不配置异步通知的情况下仍可正常使用
1.  根据返回结果进行相应的业务逻辑处理

如有问题或建议，欢迎在评论区讨论交流