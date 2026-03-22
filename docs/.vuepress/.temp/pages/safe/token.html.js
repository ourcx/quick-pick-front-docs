import comp from "/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/safe/token.html.vue"
const data = JSON.parse("{\"path\":\"/safe/token.html\",\"title\":\"\",\"lang\":\"zh-CN\",\"frontmatter\":{},\"headers\":[],\"git\":{\"updatedTime\":1773495944000,\"contributors\":[{\"name\":\"朱鑫浩\",\"username\":\"\",\"email\":\"zhuxinhao@xiaohongshu.com\",\"commits\":1}],\"changelog\":[{\"hash\":\"01fe6dcdb318e9b1a3959209b1db4bca7f07d608\",\"time\":1773495944000,\"email\":\"zhuxinhao@xiaohongshu.com\",\"author\":\"朱鑫浩\",\"message\":\"feat: 添加基本文章\"}]},\"filePathRelative\":\"safe/token.md\"}")
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
