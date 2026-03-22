import comp from "/Users/zhuxinhao/quick-pick-front-docs/vuepress-starter/docs/.vuepress/.temp/pages/communication/index.html.vue"
const data = JSON.parse("{\"path\":\"/communication/\",\"title\":\"通信方案\",\"lang\":\"zh-CN\",\"frontmatter\":{},\"headers\":[{\"level\":2,\"title\":\"包含内容\",\"slug\":\"包含内容\",\"link\":\"#包含内容\",\"children\":[]},{\"level\":2,\"title\":\"选择指南\",\"slug\":\"选择指南\",\"link\":\"#选择指南\",\"children\":[]},{\"level\":2,\"title\":\"快速开始\",\"slug\":\"快速开始\",\"link\":\"#快速开始\",\"children\":[]}],\"git\":{\"updatedTime\":1773495944000,\"contributors\":[{\"name\":\"朱鑫浩\",\"username\":\"\",\"email\":\"zhuxinhao@xiaohongshu.com\",\"commits\":1}],\"changelog\":[{\"hash\":\"01fe6dcdb318e9b1a3959209b1db4bca7f07d608\",\"time\":1773495944000,\"email\":\"zhuxinhao@xiaohongshu.com\",\"author\":\"朱鑫浩\",\"message\":\"feat: 添加基本文章\"}]},\"filePathRelative\":\"communication/README.md\"}")
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
