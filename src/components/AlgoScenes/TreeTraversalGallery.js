import React, { useState } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import TreeTraversalVisualizer from './TreeTraversalVisualizer';

// ================== 1. 基础数据 ==================
// 拓扑结构 (完全二叉树形状)
const NODES_RAW = [
  { id: '1', val: '1', x: 300, y: 50 },
  { id: '2', val: '2', x: 150, y: 130 },
  { id: '3', val: '3', x: 450, y: 130 },
  { id: '4', val: '4', x: 80, y: 220 },
  { id: '5', val: '5', x: 220, y: 220 },
  { id: '6', val: '6', x: 380, y: 220 },
  { id: '7', val: '7', x: 520, y: 220 },
];

const LINKS_RAW = [
  { source: '1', target: '2' }, { source: '1', target: '3' },
  { source: '2', target: '4' }, { source: '2', target: '5' },
  { source: '3', target: '6' }, { source: '3', target: '7' },
];

// 简单的树对象，用于算法模拟生成路径
const TREE_OBJ = {
  val: '1',
  left: {
    val: '2',
    left: { val: '4' },
    right: { val: '5' }
  },
  right: {
    val: '3',
    left: { val: '6' },
    right: { val: '7' }
  }
};

// ================== 2. 帧生成辅助函数 ==================

// 通用帧生成器
// steps: [{ active: '1', visited: ['1'], queue: [], desc: '' }]
const generateFrames = (steps, codeLineMapping) => {
  return steps.map(step => ({
    line: step.line || 1,
    desc: step.desc,
    data: {
      nodes: NODES_RAW.map(n => ({
        ...n,
        active: n.val === step.active, // 当前正在处理的节点
        visited: step.visited.includes(n.val) // 已经打印过的节点
      })),
      links: LINKS_RAW,
      queue: step.queue, // 队列数据
      output: step.visited // 打印序列
    }
  }));
};

// ---------------- 先序遍历 (PreOrder) ----------------
const PRE_CODE = `void preOrder(TreeNode *root) {
    if (root == NULL) return;
    // 1. 访问根节点
    cout << root->val;
    // 2. 递归遍历左子树
    preOrder(root->left);
    // 3. 递归遍历右子树
    preOrder(root->right);
}`;
// 手动构建先序动画帧 (1 -> 2 -> 4 -> 5 -> 3 -> 6 -> 7)
const PRE_STEPS = [
  { line: 1, active: null, visited: [], desc: "开始先序遍历" },
  { line: 4, active: '1', visited: ['1'], desc: "访问根节点 1" },
  { line: 6, active: '2', visited: ['1'], desc: "进入左子树，遇到 2" },
  { line: 4, active: '2', visited: ['1', '2'], desc: "访问节点 2" },
  { line: 6, active: '4', visited: ['1', '2'], desc: "进入左子树，遇到 4" },
  { line: 4, active: '4', visited: ['1', '2', '4'], desc: "访问节点 4 (叶子)" },
  { line: 8, active: '5', visited: ['1', '2', '4'], desc: "回溯到 2，进入右子树 5" },
  { line: 4, active: '5', visited: ['1', '2', '4', '5'], desc: "访问节点 5 (叶子)" },
  { line: 8, active: '3', visited: ['1', '2', '4', '5'], desc: "回溯到 1，进入右子树 3" },
  { line: 4, active: '3', visited: ['1', '2', '4', '5', '3'], desc: "访问节点 3" },
  { line: 6, active: '6', visited: ['1', '2', '4', '5', '3'], desc: "进入左子树 6" },
  { line: 4, active: '6', visited: ['1', '2', '4', '5', '3', '6'], desc: "访问节点 6" },
  { line: 8, active: '7', visited: ['1', '2', '4', '5', '3', '6'], desc: "进入右子树 7" },
  { line: 4, active: '7', visited: ['1', '2', '4', '5', '3', '6', '7'], desc: "访问节点 7，遍历结束" },
];

// ---------------- 中序遍历 (InOrder) ----------------
const IN_CODE = `void inOrder(TreeNode *root) {
    if (root == NULL) return;
    // 1. 递归遍历左子树
    inOrder(root->left);
    // 2. 访问根节点
    cout << root->val;
    // 3. 递归遍历右子树
    inOrder(root->right);
}`;
// 4 -> 2 -> 5 -> 1 -> 6 -> 3 -> 7
const IN_STEPS = [
  { line: 1, active: null, visited: [], desc: "开始中序遍历 (左->根->右)" },
  { line: 4, active: '1', visited: [], desc: "根 1，先去左子树" },
  { line: 4, active: '2', visited: [], desc: "节点 2，先去左子树" },
  { line: 4, active: '4', visited: [], desc: "节点 4，左为空，准备访问" },
  { line: 6, active: '4', visited: ['4'], desc: "访问节点 4，回溯" },
  { line: 6, active: '2', visited: ['4', '2'], desc: "回到 2，访问节点 2" },
  { line: 8, active: '5', visited: ['4', '2'], desc: "进入 2 的右子树 5" },
  { line: 6, active: '5', visited: ['4', '2', '5'], desc: "访问节点 5，回溯" },
  { line: 6, active: '1', visited: ['4', '2', '5', '1'], desc: "回到根 1，访问节点 1" },
  { line: 8, active: '3', visited: ['4', '2', '5', '1'], desc: "进入右子树 3" },
  { line: 4, active: '3', visited: [], desc: "节点 3，先去左子树 6" },
  { line: 6, active: '6', visited: ['4', '2', '5', '1', '6'], desc: "访问节点 6" },
  { line: 6, active: '3', visited: ['4', '2', '5', '1', '6', '3'], desc: "回到 3，访问节点 3" },
  { line: 8, active: '7', visited: ['4', '2', '5', '1', '6', '3', '7'], desc: "进入右子树 7，访问节点 7" },
];

// ---------------- 后序遍历 (PostOrder) ----------------
const POST_CODE = `void postOrder(TreeNode *root) {
    if (root == NULL) return;
    postOrder(root->left);
    postOrder(root->right);
    cout << root->val;
}`;
// 4 -> 5 -> 2 -> 6 -> 7 -> 3 -> 1
const POST_STEPS = [
  { line: 1, active: null, visited: [], desc: "开始后序遍历 (左->右->根)" },
  { line: 3, active: '1', visited: [], desc: "根 1，去左" },
  { line: 3, active: '2', visited: [], desc: "节点 2，去左" },
  { line: 5, active: '4', visited: ['4'], desc: "访问 4" },
  { line: 4, active: '2', visited: ['4'], desc: "回到 2，去右" },
  { line: 5, active: '5', visited: ['4', '5'], desc: "访问 5" },
  { line: 5, active: '2', visited: ['4', '5', '2'], desc: "左右都好了，访问 2" },
  { line: 4, active: '1', visited: ['4', '5', '2'], desc: "回到 1，去右" },
  { line: 3, active: '3', visited: ['4', '5', '2'], desc: "节点 3，去左" },
  { line: 5, active: '6', visited: ['4', '5', '2', '6'], desc: "访问 6" },
  { line: 4, active: '3', visited: ['4', '5', '2', '6'], desc: "回到 3，去右" },
  { line: 5, active: '7', visited: ['4', '5', '2', '6', '7'], desc: "访问 7" },
  { line: 5, active: '3', visited: ['4', '5', '2', '6', '7', '3'], desc: "访问 3" },
  { line: 5, active: '1', visited: ['4', '5', '2', '6', '7', '3', '1'], desc: "最后访问根 1" },
];

// ---------------- 层序遍历 (LevelOrder) ----------------
const LEVEL_CODE = `void levelOrder(TreeNode *root) {
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* node = q.front();
        q.pop();
        cout << node->val;
        if (node->left) q.push(node->left);
        if (node->right) q.push(node->right);
    }
}`;

const LEVEL_STEPS = [
  { line: 3, active: '1', visited: [], queue: ['1'], desc: "根节点 1 入队" },
  { line: 4, active: '1', visited: [], queue: ['1'], desc: "队列不空，进入循环" },
  { line: 6, active: '1', visited: [], queue: [], desc: "取出队头 1" },
  { line: 7, active: '1', visited: ['1'], queue: [], desc: "访问 1" },
  { line: 8, active: '1', visited: ['1'], queue: ['2'], desc: "1 有左孩子 2，2 入队" },
  { line: 9, active: '1', visited: ['1'], queue: ['2', '3'], desc: "1 有右孩子 3，3 入队" },

  { line: 6, active: '2', visited: ['1'], queue: ['3'], desc: "取出队头 2" },
  { line: 7, active: '2', visited: ['1', '2'], queue: ['3'], desc: "访问 2" },
  { line: 8, active: '2', visited: ['1', '2'], queue: ['3', '4'], desc: "2 左孩子 4 入队" },
  { line: 9, active: '2', visited: ['1', '2'], queue: ['3', '4', '5'], desc: "2 右孩子 5 入队" },

  { line: 6, active: '3', visited: ['1', '2'], queue: ['4', '5'], desc: "取出队头 3" },
  { line: 7, active: '3', visited: ['1', '2', '3'], queue: ['4', '5'], desc: "访问 3" },
  { line: 8, active: '3', visited: ['1', '2', '3'], queue: ['4', '5', '6'], desc: "3 左孩子 6 入队" },
  { line: 9, active: '3', visited: ['1', '2', '3'], queue: ['4', '5', '6', '7'], desc: "3 右孩子 7 入队" },

  { line: 6, active: '4', visited: ['1', '2', '3'], queue: ['5', '6', '7'], desc: "取出 4" },
  { line: 7, active: '4', visited: ['1', '2', '3', '4'], queue: ['5', '6', '7'], desc: "访问 4，无孩子" },

  { line: 6, active: '5', visited: ['1', '2', '3', '4'], queue: ['6', '7'], desc: "取出 5" },
  { line: 7, active: '5', visited: ['1', '2', '3', '4', '5'], queue: ['6', '7'], desc: "访问 5" },

  { line: 6, active: '6', visited: ['1', '2', '3', '4', '5'], queue: ['7'], desc: "取出 6" },
  { line: 7, active: '6', visited: ['1', '2', '3', '4', '5', '6'], queue: ['7'], desc: "访问 6" },

  { line: 6, active: '7', visited: ['1', '2', '3', '4', '5', '6'], queue: [], desc: "取出 7" },
  { line: 7, active: '7', visited: ['1', '2', '3', '4', '5', '6', '7'], queue: [], desc: "访问 7" },
  { line: 4, active: null, visited: ['1', '2', '3', '4', '5', '6', '7'], queue: [], desc: "队列为空，遍历结束" },
];

const SCENES = {
  'pre': { title: '先序遍历', code: PRE_CODE, frames: generateFrames(PRE_STEPS) },
  'in': { title: '中序遍历', code: IN_CODE, frames: generateFrames(IN_STEPS) },
  'post': { title: '后序遍历', code: POST_CODE, frames: generateFrames(POST_STEPS) },
  'level': { title: '层序遍历', code: LEVEL_CODE, frames: generateFrames(LEVEL_STEPS) },
};

const TreeTraversalGallery = () => {
  const [activeTab, setActiveTab] = useState('level');
  const currentScene = SCENES[activeTab];

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {Object.entries(SCENES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              backgroundColor: activeTab === key ? '#2ea043' : '#21262d',
              color: activeTab === key ? '#fff' : '#c9d1d9', transition: '0.2s'
            }}
          >
            {config.title}
          </button>
        ))}
      </div>
      <AlgoPlayer
        key={activeTab}
        frames={currentScene.frames}
        code={currentScene.code}
        Visualizer={TreeTraversalVisualizer}
      />
    </div>
  );
};

export default TreeTraversalGallery;