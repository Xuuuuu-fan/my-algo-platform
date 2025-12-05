import React, { useState } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import ThreadedTreeVisualizer from './ThreadedTreeVisualizer';

// ================== 基础拓扑结构 ==================
// 同样使用之前的树结构，方便统一认知
const NODES_BASE = [
  { id: 'A', val: 'A', x: 300, y: 50 },
  { id: 'B', val: 'B', x: 150, y: 150 },
  { id: 'C', val: 'C', x: 450, y: 150 },
  { id: 'D', val: 'D', x: 80, y: 250 },
  { id: 'E', val: 'E', x: 220, y: 250 },
  { id: 'F', val: 'F', x: 380, y: 250 },
  { id: 'G', val: 'G', x: 520, y: 250 }
];

// 普通父子连线
const LINKS_SOLID = [
  { source: 'A', target: 'B', type: 'solid' }, { source: 'A', target: 'C', type: 'solid' },
  { source: 'B', target: 'D', type: 'solid' }, { source: 'B', target: 'E', type: 'solid' },
  { source: 'C', target: 'F', type: 'solid' }, { source: 'C', target: 'G', type: 'solid' }
];

// 中序线索 (D->B, E->A, F->C, G->NULL) + (B->D前, B->E后...)
// 中序序列: D, B, E, A, F, C, G
const THREADS_INORDER = [
  { source: 'D', target: 'B', type: 'thread', dir: 'right' }, // D后继
  { source: 'E', target: 'B', type: 'thread', dir: 'left' },  // E前驱
  { source: 'E', target: 'A', type: 'thread', dir: 'right' }, // E后继
  { source: 'F', target: 'A', type: 'thread', dir: 'left' },  // F前驱
  { source: 'F', target: 'C', type: 'thread', dir: 'right' }, // F后继
  { source: 'G', target: 'C', type: 'thread', dir: 'left' },  // G前驱
];

// 先序线索 (D->E, E->C, F->G, G->NULL)
// 先序序列: A, B, D, E, C, F, G
const THREADS_PREORDER = [
  { source: 'D', target: 'B', type: 'thread', dir: 'left' },
  { source: 'D', target: 'E', type: 'thread', dir: 'right' },
  { source: 'E', target: 'D', type: 'thread', dir: 'left' },
  { source: 'E', target: 'C', type: 'thread', dir: 'right' },
  { source: 'F', target: 'C', type: 'thread', dir: 'left' },
  { source: 'F', target: 'G', type: 'thread', dir: 'right' },
  { source: 'G', target: 'F', type: 'thread', dir: 'left' }
];

// 辅助函数：生成帧
// visitedNodes: 路径上经过的节点 ID 数组
// targetNode: 最终找到的目标节点 ID
const makeFrame = (nodes, links, visitedNodes, targetNode, desc, line) => {
  return {
    line,
    desc,
    data: {
      links,
      nodes: nodes.map(n => {
        let color = '#1f6feb'; // 默认蓝
        if (n.id === targetNode) color = '#2ea043'; // 找到目标变绿
        else if (visitedNodes.includes(n.id)) color = '#d29922'; // 路径经过变黄

        return {
          ...n,
          highlight: n.id === targetNode || visitedNodes.includes(n.id), // 高亮
          color: color, // 传递给 Visualizer 控制颜色（需要修改 Visualizer 支持 color 属性，或者沿用 highlight 逻辑）
          // 在此场景我们简单用 highlight 表示是否参与当前步骤
          // 下面模拟 ltag/rtag 显示逻辑
          ltag: links.some(l => l.source === n.id && l.type === 'thread' && l.dir === 'left'),
          rtag: links.some(l => l.source === n.id && l.type === 'thread' && l.dir === 'right'),
        };
      })
    }
  };
};

// ================== 场景 1: 中序线索树找后继 (NextNode) ==================
// 逻辑：若 rtag==1，则 rchild 为后继；若 rtag==0，则右子树的最左下节点为后继。
const CODE_IN_NEXT = `Node* NextNode(Node* p) {
    // 1. 如果右指针是线索，直接返回
    if (p->rtag == 1) 
        return p->rchild;
    
    // 2. 否则，找到右子树的“最左下”节点
    else {
        p = p->rchild;
        while (p->ltag == 0) {
            p = p->lchild;
        }
        return p;
    }
}`;

const SCENE_IN_NEXT = [
  // Case 1: 找 E 的后继 (简单情况)
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['E'], null, "情况1：找结点 E 的中序后继。检查 E->rtag。", 3),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['E'], 'A', "E->rtag==1 (是线索)，直接沿右指针找到后继：A。", 4),

  // Case 2: 找 B 的后继 (复杂情况)
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['B'], null, "情况2：找结点 B 的中序后继。检查 B->rtag。", 3),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['B'], null, "B->rtag==0 (有右孩子)，后继在右子树中。", 7),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['B', 'E'], null, "进入右孩子 E。循环检查：E 有左孩子吗？(E->ltag==1)", 9),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['B', 'E'], 'E', "E 没有左孩子 (ltag==1)，停止循环。后继就是 E。", 12),

  // Case 3: 找 A 的后继 (复杂情况，右子树较深)
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['A'], null, "情况3：找结点 A 的中序后继。A->rtag==0 (有右孩子)。", 7),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['A', 'C'], null, "进入右孩子 C。检查 C 有左孩子吗？", 9),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['A', 'C', 'F'], null, "C 有左孩子 F。进入 F。检查 F 有左孩子吗？", 10),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['A', 'C', 'F'], 'F', "F 没有左孩子 (ltag==1)，停止。后继就是 F。", 12),
];


// ================== 场景 2: 中序线索树找前驱 (PreNode) ==================
// 逻辑：若 ltag==1，则 lchild 为前驱；若 ltag==0，则左子树的最右下节点为前驱。
const CODE_IN_PRE = `Node* PreNode(Node* p) {
    // 1. 如果左指针是线索，直接返回
    if (p->ltag == 1) 
        return p->lchild;
    
    // 2. 否则，找到左子树的“最右下”节点
    else {
        p = p->lchild;
        while (p->rtag == 0) {
            p = p->rchild;
        }
        return p;
    }
}`;

const SCENE_IN_PRE = [
  // Case 1: 找 F 的前驱 (简单情况)
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['F'], null, "情况1：找 F 的前驱。检查 F->ltag。", 3),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['F'], 'A', "F->ltag==1 (是线索)，直接沿左指针找到前驱：A。", 4),

  // Case 2: 找 A 的前驱 (复杂情况)
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['A'], null, "情况2：找 A 的前驱。A->ltag==0 (有左孩子)。", 7),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['A', 'B'], null, "进入左孩子 B。寻找 B 的右子树最底部。", 8),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['A', 'B', 'E'], null, "B 有右孩子 E。进入 E。", 10),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_INORDER], ['A', 'B', 'E'], 'E', "E 没有右孩子 (rtag==1)，停止。前驱就是 E。", 12),
];


// ================== 场景 3: 先序线索树找后继 (PreNext) ==================
// 逻辑：若 ltag==0，必有左孩子，左孩子即后继；若 ltag==1，则看右指针 (无论是孩子还是线索，都是后继)。
const CODE_PRE_NEXT = `Node* PreNext(Node* p) {
    // 1. 如果有左孩子，左孩子就是先序后继
    if (p->ltag == 0)
        return p->lchild;
    
    // 2. 如果没有左孩子，右指针指向的一定是后继
    // (可能是右孩子，也可能是右线索，规则一样)
    else
        return p->rchild;
}`;

const SCENE_PRE_NEXT = [
  // Case 1: 找 A 的后继 (有左孩子)
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_PREORDER], ['A'], null, "情况1：找 A 的先序后继。检查 A->ltag。", 3),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_PREORDER], ['A'], 'B', "A->ltag==0 (有左孩子)，左孩子 B 就是后继。", 4),

  // Case 2: 找 E 的后继 (无左孩子，有右线索)
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_PREORDER], ['E'], null, "情况2：找 E 的先序后继。检查 E->ltag。", 3),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_PREORDER], ['E'], null, "E->ltag==1 (无左孩子)。看右指针。", 9),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_PREORDER], ['E'], 'C', "E->rchild 指向 C (线索)，所以 C 是后继。", 10),

  // Case 3: 找 B 的后继 (无左孩子，但有右孩子 - 假设结构不同，但在本树中B有左D)
  // 让我们找 D 的后继 (D无左，有右线索E)
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_PREORDER], ['D'], null, "情况3：找 D 的先序后继。", 3),
  makeFrame(NODES_BASE, [...LINKS_SOLID, ...THREADS_PREORDER], ['D'], 'E', "D 无左孩子，直接返回右指针指向的 E。", 10),
];


const SCENES = {
  'in-next': { title: '中序找后继', frames: SCENE_IN_NEXT, code: CODE_IN_NEXT },
  'in-prev': { title: '中序找前驱', frames: SCENE_IN_PRE, code: CODE_IN_PRE },
  'pre-next': { title: '先序找后继', frames: SCENE_PRE_NEXT, code: CODE_PRE_NEXT },
};

// ================== 主组件 ==================

const ThreadedSearchGallery = ({ mode = 'all' }) => {
  const [activeTab, setActiveTab] = useState(mode === 'all' ? 'in-next' : mode);
  const safeTab = SCENES[activeTab] ? activeTab : 'in-next';
  const currentScene = SCENES[safeTab];

  return (
    <div>
      {mode === 'all' && (
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
      )}

      <AlgoPlayer
        key={safeTab}
        frames={currentScene.frames}
        code={currentScene.code}
        Visualizer={ThreadedTreeVisualizer} // 复用之前的渲染器
      />
    </div>
  );
};

export default ThreadedSearchGallery;