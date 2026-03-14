export const redirects = JSON.parse("{}")

export const routes = Object.fromEntries([
  ["/", { loader: () => import(/* webpackChunkName: "index.html" */"/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/index.html.js"), meta: {"title":"庆快校园前端文档站"} }],
  ["/communication/", { loader: () => import(/* webpackChunkName: "communication_index.html" */"/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/communication/index.html.js"), meta: {"title":"通信方案"} }],
  ["/communication/sse-implementation.html", { loader: () => import(/* webpackChunkName: "communication_sse-implementation.html" */"/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/communication/sse-implementation.html.js"), meta: {"title":"小程序中的SSE实现方案"} }],
  ["/404.html", { loader: () => import(/* webpackChunkName: "404.html" */"/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/404.html.js"), meta: {"title":""} }],
  ["/get-started.html", { loader: () => import(/* webpackChunkName: "get-started.html" */"/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/get-started.html.js"), meta: {"title":"快速开始"} }],
  ["/safe/token.html", { loader: () => import(/* webpackChunkName: "safe_token.html" */"/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/safe/token.html.js"), meta: {"title":""} }],
  ["/util/cloud.html", { loader: () => import(/* webpackChunkName: "util_cloud.html" */"/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/util/cloud.html.js"), meta: {"title":""} }],
]);

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updateRoutes) {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
  }
  if (__VUE_HMR_RUNTIME__.updateRedirects) {
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ routes, redirects }) => {
    __VUE_HMR_RUNTIME__.updateRoutes(routes)
    __VUE_HMR_RUNTIME__.updateRedirects(redirects)
  })
}
