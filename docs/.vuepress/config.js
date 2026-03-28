import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'zh-CN',

  title: '庆快校园前端文档',
  description: '校园小程序前端开发文档',

  theme: defaultTheme({
    logo: 'https://vuejs.press/images/hero.png',

    navbar: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/get-started' },
      { text: '开发指南', link: '/dev/guide' },
      { text: '通信方案', link: '/communication/' },
      { text: '安全性', link: '/safe/token' },
      { text: '工具/云服务', link: '/util/cloud' },
    ],

    sidebar: {
      '/dev/': [
        {
          text: '开发指南',
          children: [
            '/dev/guide.md',
            '/dev/Front-end.md',
          ],
        },
      ],
      '/communication/': [
        {
          text: '通信方案',
          children: [
            '/communication/README.md',
            '/communication/sse-implementation.md',
          ],
        },
      ],
      '/safe/': [
        {
          text: '安全与认证',
          children: [
            '/safe/token.md',
          ],
        },
      ],
      '/util/': [
        {
          text: '通用工具',
          children: [
            '/util/cloud.md',
          ],
        },
      ],
    },
  }),

  bundler: viteBundler(),
})
