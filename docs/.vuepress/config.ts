import { viteBundler } from '@vuepress/bundler-vite'
import { defineUserConfig } from 'vuepress'
import { plumeTheme } from 'vuepress-theme-plume'

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: 'WOOOW - Rainy\'s Blog',
  description: 'Find something awesome here!',

  bundler: viteBundler(),

  theme: plumeTheme({
    hostname: 'https://wooow.top',

    codeHighlighter: {
      themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
      notationDiff: true,
      notationErrorLevel: true,
      notationFocus: true,
      notationHighlight: true,
      notationWordHighlight: true,
      highlightLines: true,
      collapsedLines: false,
      lineNumbers: true,
    },


    markdown: {
      demo: true,
      //   include: true,
      //   chart: true,
      //   echarts: true,
      //   mermaid: true,
      //   flowchart: true,
    },    
    
    contributors: false,
    
    /**
     * 评论 comments
     * @see https://theme-plume.vuejs.press/guide/features/comments/
     */
    comment: {
      provider: "Waline", // "Artalk" | "Giscus" | "Twikoo" | "Waline"
      comment: true,
      serverURL: "https://comment-at.wooow.top",
      requiredMeta: ['nick','mail'],
      recaptchaV3Key: '',
      pageview: true
      //   repo: '',
      //   repoId: '',
      //   categoryId: '',
      //   mapping: 'pathname',
      //   reactionsEnabled: true,
      //   inputPosition: 'top',
    },
  }),
})
