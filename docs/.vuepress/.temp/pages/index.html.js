import comp from "/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/index.html.vue"
const data = JSON.parse("{\"path\":\"/\",\"title\":\"庆快校园前端文档站\",\"lang\":\"zh-CN\",\"frontmatter\":{\"home\":true,\"title\":\"庆快校园前端文档站\",\"heroImage\":\"https://vuejs.press/images/hero.png\",\"actions\":[{\"text\":\"开始\",\"link\":\"/get-started.html\",\"type\":\"primary\"}],\"features\":[{\"title\":\"校园小程序\",\"details\":\"小程序开发\"},{\"title\":\"广州大学\",\"details\":\"广州大学商业中心小程序\"},{\"title\":\"前端\",\"details\":\"uniapp 和一些实现\"}],\"footer\":\"MIT Licensed | Copyright © 2026-present VuePress Community\"},\"headers\":[],\"git\":{},\"filePathRelative\":\"README.md\"}")
export { comp, data }

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
  if (__VUE_HMR_RUNTIME__.updatePageData) {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  }
}

if (import.meta.hot) {
  import.meta.hot.accept(({ data }) => {
    __VUE_HMR_RUNTIME__.updatePageData(data)
  })
}
