import { VdoingThemeConfig } from 'vuepress-theme-vdoing/types'
import { defineConfig4CustomTheme } from "vuepress/config";

export default defineConfig4CustomTheme<VdoingThemeConfig>({
  title: '九两白菜粥',
  description: 'sukt.cloud.native.blog.vuepress',
  theme:"vdoing",
  /**
   * Type is `DefaultThemeConfig`
   */
  themeConfig: {
    // 文章默认的作者信息，(可在md文件中单独配置此信息) string | {name: string, link?: string}
    author: {
      name: '九两白菜粥', // 必需
      link: 'https://github.com/GeorGeWzw', // 可选的
    },
    contentBgStyle:2,
    repo: 'GeorGeWzw', // 导航栏右侧生成Github链接
    editLinks: false,
    docsDir: "packages/docs/docs",
    sidebar: 'structuring',
    // 博主信息 (显示在首页侧边栏)
    blogger: {
      avatar: 'https://wangzewei.oss-cn-beijing.aliyuncs.com/images/20220211175723.png',
      name: '九两白菜粥',
      slogan: '一个不会写CRUD的程序猿',
    },
    // 页脚信息
    footer: {
      createYear: 2022, // 博客创建年份
      copyrightInfo:
        '<a href="https://beian.miit.gov.cn/" target="_blank">豫ICP备19040084号-2</a>', // 博客版权信息，支持a标签或换行标签</br>
    },
  }
});