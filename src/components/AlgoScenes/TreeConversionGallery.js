import React, { useState } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import TreeTransVisualizer from './TreeTransVisualizer';

// ================== 数据定义区 ==================

// 基础节点位置 (树状)
const TREE_POS = {
  A: { x: 300, y: 50 },
  B: { x: 150, y: 150 }, C: { x: 300, y: 150 }, D: { x: 450, y: 150 }, // A的孩子
  E: { x: 100, y: 250 }, F: { x: 200, y: 250 }, // B的孩子
  G: { x: 450, y: 250 } // D的孩子
};

// 基础节点位置 (二叉树状 - 左孩右兄)
const BT_POS = {
  A: { x: 300, y: 50 },
  B: { x: 200, y: 120 }, // A的左孩
  C: { x: 300, y: 180 }, // B的右兄
  D: { x: 400, y: 240 }, // C的右兄
  E: { x: 120, y: 200 }, // B的左孩
  F: { x: 200, y: 280 }, // E的右兄
  G: { x: 320, y: 320 }  // D的左孩
};

// ---------------------------------------------
// 场景 1: 树 -> 二叉树
// 口诀：加线(兄弟)、抹线(长子外)、旋转
// ---------------------------------------------
const SCENE_TREE_TO_BT = [
  {
    line: 1,
    desc: "初始状态：普通树。每个节点可能有多个孩子。",
    data: {
      nodes: [
        { id: 'A', val: 'A', ...TREE_POS.A },
        { id: 'B', val: 'B', ...TREE_POS.B }, { id: 'C', val: 'C', ...TREE_POS.C }, { id: 'D', val: 'D', ...TREE_POS.D },
        { id: 'E', val: 'E', ...TREE_POS.E }, { id: 'F', val: 'F', ...TREE_POS.F },
        { id: 'G', val: 'G', ...TREE_POS.G }
      ],
      links: [
        { source: 'A', target: 'B' }, { source: 'A', target: 'C' }, { source: 'A', target: 'D' },
        { source: 'B', target: 'E' }, { source: 'B', target: 'F' },
        { source: 'D', target: 'G' }
      ]
    }
  },
  {
    line: 2,
    desc: "步骤一：兄弟相连。所有兄弟节点之间加一条连线。",
    data: {
      nodes: [
        { id: 'A', val: 'A', ...TREE_POS.A },
        { id: 'B', val: 'B', ...TREE_POS.B }, { id: 'C', val: 'C', ...TREE_POS.C }, { id: 'D', val: 'D', ...TREE_POS.D },
        { id: 'E', val: 'E', ...TREE_POS.E }, { id: 'F', val: 'F', ...TREE_POS.F },
        { id: 'G', val: 'G', ...TREE_POS.G }
      ],
      links: [
        { source: 'A', target: 'B' }, { source: 'A', target: 'C' }, { source: 'A', target: 'D' },
        { source: 'B', target: 'E' }, { source: 'B', target: 'F' },
        { source: 'D', target: 'G' },
        // 新增兄弟连线
        { source: 'B', target: 'C', type: 'dashed', color: '#2ea043' },
        { source: 'C', target: 'D', type: 'dashed', color: '#2ea043' },
        { source: 'E', target: 'F', type: 'dashed', color: '#2ea043' }
      ]
    }
  },
  {
    line: 3,
    desc: "步骤二：保留长子，断开其他。只保留父节点与第一个孩子的连线。",
    data: {
      nodes: [
        { id: 'A', val: 'A', ...TREE_POS.A },
        { id: 'B', val: 'B', ...TREE_POS.B }, { id: 'C', val: 'C', ...TREE_POS.C }, { id: 'D', val: 'D', ...TREE_POS.D },
        { id: 'E', val: 'E', ...TREE_POS.E }, { id: 'F', val: 'F', ...TREE_POS.F },
        { id: 'G', val: 'G', ...TREE_POS.G }
      ],
      links: [
        { source: 'A', target: 'B' },
        // 移除的线标红
        { source: 'A', target: 'C', color: '#ff4d4f' }, { source: 'A', target: 'D', color: '#ff4d4f' },
        { source: 'B', target: 'E' },
        { source: 'B', target: 'F', color: '#ff4d4f' },
        { source: 'D', target: 'G' },
        { source: 'B', target: 'C', type: 'dashed', color: '#2ea043' },
        { source: 'C', target: 'D', type: 'dashed', color: '#2ea043' },
        { source: 'E', target: 'F', type: 'dashed', color: '#2ea043' }
      ]
    }
  },
  {
    line: 4,
    desc: "步骤三：旋转整理。层级调整，左孩子右兄弟。",
    data: {
      nodes: [
        // 坐标变为 BT_POS
        { id: 'A', val: 'A', ...BT_POS.A },
        { id: 'B', val: 'B', ...BT_POS.B }, { id: 'C', val: 'C', ...BT_POS.C }, { id: 'D', val: 'D', ...BT_POS.D },
        { id: 'E', val: 'E', ...BT_POS.E }, { id: 'F', val: 'F', ...BT_POS.F },
        { id: 'G', val: 'G', ...BT_POS.G }
      ],
      links: [
        // 连线关系确认
        { source: 'A', target: 'B' },
        { source: 'B', target: 'C' },
        { source: 'C', target: 'D' },
        { source: 'B', target: 'E' },
        { source: 'E', target: 'F' },
        { source: 'D', target: 'G' }
      ]
    }
  }
];

// ---------------------------------------------
// 场景 2: 森林 -> 二叉树
// ---------------------------------------------
const FOREST_POS = {
  // 树1 (Root B)
  B: { x: 150, y: 100 }, E: { x: 100, y: 200 }, F: { x: 200, y: 200 },
  // 树2 (Root C)
  C: { x: 350, y: 100 }, G: { x: 350, y: 200 },
  // 树3 (Root D)
  D: { x: 500, y: 100 }
};

const FOREST_BT_POS = {
  B: { x: 150, y: 50 },
  E: { x: 100, y: 120 }, // B的左孩
  F: { x: 180, y: 180 }, // E的右兄
  C: { x: 250, y: 100 }, // B的右兄 (树2的根)
  G: { x: 200, y: 170 }, // C的左孩
  D: { x: 350, y: 150 }  // C的右兄 (树3的根)
};

const SCENE_FOREST_TO_BT = [
  {
    line: 1,
    desc: "初始状态：森林。包含三棵互不相交的树 (B, C, D)。",
    data: {
      nodes: [
        { id: 'B', val: 'B', ...FOREST_POS.B, color: '#1f6feb' },
        { id: 'E', val: 'E', ...FOREST_POS.E, color: '#1f6feb' }, { id: 'F', val: 'F', ...FOREST_POS.F, color: '#1f6feb' },
        { id: 'C', val: 'C', ...FOREST_POS.C, color: '#d29922' }, { id: 'G', val: 'G', ...FOREST_POS.G, color: '#d29922' },
        { id: 'D', val: 'D', ...FOREST_POS.D, color: '#8250df' }
      ],
      links: [
        { source: 'B', target: 'E' }, { source: 'B', target: 'F' },
        { source: 'C', target: 'G' }
      ]
    }
  },
  {
    line: 2,
    desc: "步骤一：各树转二叉。森林中的每一棵树，先各自转换为二叉树。",
    data: {
      nodes: [
        // 位置微调，表现已经变成了二叉结构
        { id: 'B', val: 'B', ...FOREST_POS.B, color: '#1f6feb' },
        { id: 'E', val: 'E', x: 120, y: 180, color: '#1f6feb' }, { id: 'F', val: 'F', x: 180, y: 240, color: '#1f6feb' },
        { id: 'C', val: 'C', ...FOREST_POS.C, color: '#d29922' }, { id: 'G', val: 'G', ...FOREST_POS.G, color: '#d29922' },
        { id: 'D', val: 'D', ...FOREST_POS.D, color: '#8250df' }
      ],
      links: [
        { source: 'B', target: 'E' }, { source: 'E', target: 'F', type: 'solid' },
        { source: 'C', target: 'G' }
      ]
    }
  },
  {
    line: 3,
    desc: "步骤二：串联根节点。将第二棵树的根连到第一棵树根的右链域...",
    data: {
      nodes: [
        { id: 'B', val: 'B', ...FOREST_POS.B, color: '#1f6feb' },
        { id: 'E', val: 'E', x: 120, y: 180, color: '#1f6feb' }, { id: 'F', val: 'F', x: 180, y: 240, color: '#1f6feb' },
        { id: 'C', val: 'C', ...FOREST_POS.C, color: '#d29922' }, { id: 'G', val: 'G', ...FOREST_POS.G, color: '#d29922' },
        { id: 'D', val: 'D', ...FOREST_POS.D, color: '#8250df' }
      ],
      links: [
        { source: 'B', target: 'E' }, { source: 'E', target: 'F' },
        { source: 'C', target: 'G' },
        // 连接根节点
        { source: 'B', target: 'C', type: 'dashed', color: '#fff' },
        { source: 'C', target: 'D', type: 'dashed', color: '#fff' }
      ]
    }
  },
  {
    line: 4,
    desc: "最终状态：整理为一棵完整的二叉树。",
    data: {
      nodes: [
        { id: 'B', val: 'B', ...FOREST_BT_POS.B, color: '#1f6feb' },
        { id: 'E', val: 'E', ...FOREST_BT_POS.E, color: '#1f6feb' }, { id: 'F', val: 'F', ...FOREST_BT_POS.F, color: '#1f6feb' },
        { id: 'C', val: 'C', ...FOREST_BT_POS.C, color: '#d29922' }, { id: 'G', val: 'G', ...FOREST_BT_POS.G, color: '#d29922' },
        { id: 'D', val: 'D', ...FOREST_BT_POS.D, color: '#8250df' }
      ],
      links: [
        { source: 'B', target: 'E' }, { source: 'E', target: 'F' },
        { source: 'C', target: 'G' },
        { source: 'B', target: 'C' }, { source: 'C', target: 'D' }
      ]
    }
  }
];

// 3. 二叉树 -> 树 (SCENE_TREE_TO_BT 的逆过程)
const SCENE_BT_TO_TREE = [...SCENE_TREE_TO_BT].reverse().map((step, idx) => ({
  ...step,
  desc: `逆向步骤 ${idx+1}：${step.desc.split('：')[0]} (逆操作)`
}));

// 4. 二叉树 -> 森林 (SCENE_FOREST_TO_BT 的逆过程)
const SCENE_BT_TO_FOREST = [...SCENE_FOREST_TO_BT].reverse().map((step, idx) => ({
  ...step,
  desc: `逆向步骤 ${idx+1}：${step.desc.split('：')[0]} (逆操作)`
}));

const SCENES = {
  'tree-bt': { title: '树 ➜ 二叉树', frames: SCENE_TREE_TO_BT, code: 'Tree2BT(root)' },
  'forest-bt': { title: '森林 ➜ 二叉树', frames: SCENE_FOREST_TO_BT, code: 'Forest2BT(trees)' },
  'bt-tree': { title: '二叉树 ➜ 树', frames: SCENE_BT_TO_TREE, code: 'BT2Tree(root)' },
  'bt-forest': { title: '二叉树 ➜ 森林', frames: SCENE_BT_TO_FOREST, code: 'BT2Forest(root)' },
};

// ================== 组件实现 ==================

const TreeConversionGallery = () => {
  const [activeTab, setActiveTab] = useState('tree-bt');
  const currentScene = SCENES[activeTab];

  return (
    <div>
      {/* 选项卡切换 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(SCENES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              backgroundColor: activeTab === key ? '#2ea043' : '#21262d',
              color: activeTab === key ? '#fff' : '#c9d1d9',
              transition: '0.2s'
            }}
          >
            {config.title}
          </button>
        ))}
      </div>

      {/* 播放器区域 */}
      <AlgoPlayer
        // 这里的 Key 很重要，切换 Tab 时强制重置播放器状态
        key={activeTab}
        frames={currentScene.frames}
        code={`// ${currentScene.title} 核心逻辑\n// 暂略伪代码，请关注右侧图形变换`}
        Visualizer={TreeTransVisualizer}
      />
    </div>
  );
};

export default TreeConversionGallery;