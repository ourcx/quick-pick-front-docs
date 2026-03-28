# gallery-app 项目总结

## 一、项目概述

| 项目名 | `@quick-pick/gallery-app` |
|---|---|
| 技术框架 | UniApp（Vue 3 + Composition-兼容 Options API）→ 编译为**微信小程序** |
| 状态管理 | Vuex 4（命名空间模块化） |
| UI 组件库 | Vant Weapp（`van-*`，以 `wxcomponents` 本地引入） |
| 后端接口 | REST API，`https://bluefox-quick.online:8080` |
| 代码规范 | ESLint + Prettier + Husky + commitlint |

---

## 二、目录结构

```
gallery-app/
├── App.vue                    # 小程序入口（生命周期日志）
├── main.js                    # 创建 SSR App，挂载 store / $api / uni.$showModal
├── pages.json                 # 页面路由注册 & 全局 usingComponents
├── manifest.json              # 小程序配置（AppID 等）
├── uni.scss                   # 全局 SCSS 变量
│
├── modules/pages/             # 主业务页面（subPackage 逻辑分组）
│   ├── Paint/Paint.vue        # 首页：作品瀑布流 + Tab 分类浏览
│   ├── pointContent/          # 帖子/作品详情页
│   ├── DraftBox/DraftBox.vue  # 草稿箱：提交审核 / 删除草稿
│   └── RecycleBin/RecycleBin.vue # 回收站：还原 / 彻底删除
│
├── pagesLog/                  # 登录相关页面（非分包）
│   ├── index/index.vue        # 微信授权登录页
│   └── loading/loading.vue    # 启动加载 / 登录态校验跳转页
│
├── components/                # 公共组件
│   ├── Empty.vue              # 空状态占位组件
│   ├── Modal/Modal.vue        # 全局弹窗（对接 store/modal）
│   ├── navigation/navigation.vue # 自定义导航栏
│   ├── BinItem/BinItem.vue    # 回收站列表项（待整合）
│   ├── comment/               # 评论组件
│   ├── FeiComment/            # 飞评论组件
│   └── tip/tip.vue            # 提示条组件
│
├── service/artwork/           # API 服务层（每个接口独立文件）
│   ├── addDraft.js            # 新增草稿
│   ├── commitArtwork.js       # 提交审核
│   ├── deleteDraft.js         # 删除草稿（移至回收站）
│   ├── getMyArtworks.js       # 获取个人全部作品
│   ├── getArtworksByCategoryCursor.js  # 按分类游标分页
│   ├── getArtworksByAuthorCursor.js    # 按作者游标分页
│   ├── getArtworksByTagsCursor.js      # 按标签游标分页
│   ├── searchArtworksByTitleCursor.js  # 标题搜索游标分页
│   ├── restoreArtworkFromRecycle.js    # 从回收站还原
│   ├── permanentDeleteArtwork.js       # 彻底删除
│   ├── uploadGalleryArtworkImage.js    # 上传图片
│   └── ...（其余 CRUD 接口）
│
├── store/
│   ├── index.js               # createStore，注册所有模块
│   └── modules/
│       ├── gallery.js         # 页面级状态（Paint/Rank/Rating/PointContent）
│       └── modal.js           # 全局弹窗队列管理
│
├── utils/
│   ├── request.js             # HTTP 封装（带重试、Token、401跳转）
│   ├── timeStorage.js         # 带过期时间的本地存储工具
│   └── commo.js               # 通用工具函数
│
├── const/
│   └── workStatus.js          # auditStatus 枚举常量 & 展示映射
│
├── styles/
│   └── artwork-list.css       # 作品列表类页面公共样式
│
└── wxcomponents/vant-weapp/   # Vant Weapp 本地源码（勿动）
```

---

## 三、路由系统

所有页面在 [`pages.json`](pages.json) 中统一注册，**无 tabBar**（`Paint` 是入口首页）：

| 路径 | 页面 | 说明 |
|---|---|---|
| `modules/pages/Paint/Paint` | 首页 | 自定义导航栏，入口页面 |
| `modules/pages/pointContent/pointContent` | 详情页 | 开启下拉刷新 |
| `modules/pages/RecycleBin/RecycleBin` | 回收站 | 系统导航栏 |
| `modules/pages/DraftBox/DraftBox` | 草稿箱 | 系统导航栏 |
| `pagesLog/index/index` | 登录页 | 微信授权 |
| `pagesLog/loading/loading` | 启动页 | 校验 token，分发跳转 |

> **注意**：启动路径由 `manifest.json` 配置，通常是 `pagesLog/loading/loading`，在 `loading.vue` 中检查登录态后 `reLaunch` 到首页。

---

## 四、网络请求层

核心封装在 [`utils/request.js`](utils/request.js)，对外暴露 `http` 对象：

```js
import { http } from '../utils/request'

http.get(url, data, config)
http.post(url, data, config)
http.put(url, data, config)
http.delete(url, data, config)
http.upload(url, filePath, formData, config)  // 文件上传
```

**关键机制：**

| 机制 | 说明 |
|---|---|
| 环境 BASE_URL | 通过 `wx.getAccountInfoSync().miniProgram.envVersion` 自动切换 dev/trial/release 域名 |
| Token | 存在 `uni.Storage` + `getApp().globalData.token`，请求头 `authentication` 字段携带 |
| 免 Token 白名单 | `NO_TOKEN_URLS`，目前只有 `/user/user/login` |
| 401 处理 | 自动 `reLaunch` 到登录页 |
| 自动重试 | 失败最多重试 2 次，间隔 300ms |
| 响应规范 | 后端统一返回 `{ code, msg, data }`，业务判断 `res.data.code === 1` 为成功 |

---

## 五、状态管理（Vuex）

```
store/
├── gallery（namespaced）     # 各页面临时 UI 状态
│   ├── paintData             # Paint 页 Tab / 标题 / 图片等
│   ├── rankData              # 排行榜列表状态
│   ├── ratingData            # 评分列表
│   └── pointContentData      # 详情页评论/点赞状态
│
└── modal（namespaced）       # 全局弹窗队列
    ├── isShow                # 当前是否展示弹窗
    ├── currentConfig         # 当前弹窗配置
    └── queue[]               # 等待展示的弹窗队列
```

**全局弹窗使用方式：**

```js
// 在任意页面/组件中
uni.$showModal({
  type: 'Dialog',          // Dialog | Toast | Snackbar | Reply | Notification
  title: '提示',
  message: '内容',
  onConfirm: () => { ... },
  onCancel:  () => { ... },
})
```

---

## 六、作品状态机

所有作品的生命周期由 `auditStatus` 字段驱动，常量定义在 [`const/workStatus.js`](const/workStatus.js)：

```
新建 → 0 草稿 ──────────────────────────── 删除 → 5 回收站
         │                                            │
       提交审核                                     还原(→草稿)
         ↓                                      彻底删除(不可逆)
       1 审核中
      ┌──┴──┐
      ↓     ↓
  2 通过  3 拒绝
            ↓
        4 待人工复审
```

| 值 | 含义 | 可进行的操作 |
|---|---|---|
| 0 | 草稿 | 提交审核、删除（→回收站） |
| 1 | 审核中 | 等待 |
| 2 | 已通过 | 公开展示 |
| 3 | 已拒绝 | 查看原因 |
| 4 | 待人工复审 | 等待 |
| 5 | 回收站 | 还原（→草稿）、彻底删除 |

---

## 七、公共组件注意事项

微信小程序中，**Vant Weapp 组件**（`van-*`）通过 `pages.json → globalStyle → usingComponents` 全局注册，使用时必须保持 **kebab-case** 标签名：

```html
<!-- ✅ 正确 -->
<van-tabs> <van-tab> <scroll-view>

<!-- ❌ 错误（ESLint PascalCase 规则会破坏小程序渲染！）-->
<VanTabs> <ScrollView>
```

ESLint 已配置 `vue/component-name-in-template-casing: kebab-case` 来规避此问题。

---

## 八、代码规范工具链

| 工具 | 配置文件 | 作用 |
|---|---|---|
| ESLint | [`eslint.config.mjs`](eslint.config.mjs) | JS/Vue 语法检查 |
| Prettier | [`.prettierrc`](.prettierrc) | 统一代码格式 |
| Husky | [`.husky/`](.husky/) | Git hooks 管理 |
| lint-staged | `package.json` | commit 前只检查暂存文件 |
| commitlint | [`commitlint.config.js`](commitlint.config.js) | commit 信息格式校验 |

**提交信息规范：**
```
feat: 新增功能
fix: 修复 bug
docs: 文档变更
style: 样式/格式调整（不影响逻辑）
refactor: 重构
chore: 构建/工具变更
```

---

## 九、后续待开发事项

1. **`Paint.vue` 游标分页接入**：当前仍使用页码分页（`getArtworksByCategoryId`），需改为游标分页 API（`getArtworksByCategoryCursor`），相关 service 文件已备好
2. **`DraftBox` 编辑功能**：目前只能提交/删除草稿，尚不支持编辑草稿内容（需要配合上传图片 + 表单页面）
3. **`BinItem/BinItem.vue`**：这个组件与 `RecycleBin.vue` 功能重叠，可考虑整合或删除