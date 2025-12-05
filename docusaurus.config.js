// @ts-check
// 注意：Docusaurus 2.x 使用 CommonJS 规范

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Algo Learn',
  tagline: '数据结构与算法可视化学习',
  url: 'https://your-site.com', // 你的网站域名，本地开发不影响
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // 国际化设置
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  // -------------------------------------------------------
  // 插件与主题配置
  // -------------------------------------------------------

  // 1. 启用 Mermaid 画图主题
  themes: ['@docusaurus/theme-mermaid'],

  // 2. 开启 Markdown 对 Mermaid 的支持
  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // 这里的 id 决定了点击“开始学习”时默认跳到哪一篇
          // 建议保留，或者改成你第一篇文章的 id (如 'intro')
          // routeBasePath: '/', // 如果想把文档设为首页，取消注释这行
        },
        blog: false, // 关闭博客
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // -------------------------------------------------------
      // 侧边栏功能配置 (你刚刚要求的)
      // -------------------------------------------------------
      docs: {
        sidebar: {
          hideable: true,            // 允许用户收起左侧侧边栏 (页面左下角会出现箭头)
          autoCollapseCategories: true, // 自动折叠其他章节，保持菜单清爽
        },
      },

      // -------------------------------------------------------
      // 导航栏配置
      // -------------------------------------------------------
      navbar: {
        title: 'Algo Learn',
        logo: {
          alt: 'Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'tree/intro', // 点击导航栏“开始学习”跳转到的文档ID
            position: 'left',
            label: '开始学习',
          },
          {
            href: 'https://github.com/facebook/docusaurus', // 替换你的 GitHub
            label: 'GitHub',
            position: 'right',
          },
        ],
      },

      // -------------------------------------------------------
      // 页脚配置
      // -------------------------------------------------------
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} Algo Learn. Built with Docusaurus.`,
      },

      // -------------------------------------------------------
      // 代码高亮配置
      // -------------------------------------------------------
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        // 添加 C++, C, Java, Python 等语言高亮支持
        additionalLanguages: ['cpp', 'c', 'java', 'python', 'bash'],
      },

      // -------------------------------------------------------
      // 颜色模式 (强制深色模式适配星空主题)
      // -------------------------------------------------------
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },

      // -------------------------------------------------------
      // Mermaid 图表样式微调
      // -------------------------------------------------------
      mermaid: {
        theme: {light: 'neutral', dark: 'dark'},
      },
    }),
};

module.exports = config;