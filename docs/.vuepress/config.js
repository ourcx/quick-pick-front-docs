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
      '/',
      '/get-started',
      {
        text: '通信方案',
        link: '/communication/',
      },
    ],

    sidebar: {
      '/communication/': [
        {
          text: '通信方案',
          children: [
            '/communication/',
            '/communication/sse-implementation.md',
          ],
        },
      ],
    },
  }),

  bundler: viteBundler(),
})
