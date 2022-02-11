module.exports = {
  title: 'sukt.cloud.native.blog.vuepress',
  description: 'sukt.cloud.native.blog.vuepress',
  // theme: 'vuepress-theme-vdoing',// theme: 'vuepress-theme-reco'
  themeConfig: {
    // 导航配置
    nav: [
      { text: '首页', link: '/aaa' },
    ],
    // 博主信息 (显示在首页侧边栏)
    blogger: {
      avatar: 'https://cdn.jsdelivr.net/gh/xugaoyi/image_store/blog/20200103123203.jpg',
      name: '九两白菜粥',
      slogan: '一个不会CRUD的程序猿',
    },
    // 页脚信息
    footer: {
      createYear: 2019, // 博客创建年份
      copyrightInfo:
        'asdasdasdadasdasdas', // 博客版权信息，支持a标签或换行标签</br>
    },
  }
}