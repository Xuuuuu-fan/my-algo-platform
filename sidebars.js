/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    // 首页引导
    {
      type: 'doc',
      id: 'intro', // 这里的 id 对应 docs/intro.md (如果存在)
      label: '🚀 首页',
    },

    // --- 树与二叉树 (拆分后的文件夹) ---
    {
      type: 'category',
      label: '🌲 树与二叉树', // 这是一个大章节标题
      link: {
        type: 'generated-index', // 点击标题时显示目录索引页
        description: '这里包含了树的所有核心考点与算法实现。',
      },
      collapsible: true,
      collapsed: false, // 默认展开
      items: [
        // 这里填刚才拆分出来的文件的 id
        'tree/intro',       // 对应 docs/tree/01-intro.md
        'tree/properties',  // 对应 docs/tree/02-properties.md
        'tree/binary-tree', // 对应 docs/tree/03-binary-tree.md
        'tree/nature',
        'tree/order',
        'tree/chain',
        'tree/traversal',
        'tree/clue',
        'tree/cueing',
        'tree/finding',
        'tree/storage',
        'tree/change',// 对应 docs/tree/04-traversal.md
      ],
    },

    // --- 其他原有章节 ---
    {
      type: 'category',
      label: '📚 线性表与串',
      items: [
          'string/intro',
      ], // 假设这些还是单文件
    },
    {
      type: 'category',
      label: '🕸️ 图论',
      items: [
          'graph/intro',
      ],
    },
  ],
};

module.exports = sidebars;