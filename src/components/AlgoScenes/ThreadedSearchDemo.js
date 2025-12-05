// src/components/AlgoScenes/ThreadedSearchDemo.js
import React, { useState, useEffect } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import ThreadedTreeVisualizer from './ThreadedTreeVisualizer';

// ================= 1. 准备一棵已经线索化好的树 =================
// 这是一个标准的中序线索二叉树 (D < B < E < A < F < C < G)
// 虚线连接：D->B, E->A, F->C, G->NULL
const THREADED_NODES = [
  { id: 'A', val: 'A', x: 300, y: 50,  lchild: 'B', rchild: 'C', ltag: 0, rtag: 0 },
  { id: 'B', val: 'B', x: 150, y: 150, lchild: 'D', rchild: 'E', ltag: 0, rtag: 0 },
  { id: 'C', val: 'C', x: 450, y: 150, lchild: 'F', rchild: 'G', ltag: 0, rtag: 0 },
  { id: 'D', val: 'D', x: 80,  y: 250, lchild: null, rchild: 'B', ltag: 1, rtag: 1 }, // rtag=1 指向后继 B
  { id: 'E', val: 'E', x: 220, y: 250, lchild: null, rchild: 'A', ltag: 1, rtag: 1 }, // rtag=1 指向后继 A
  { id: 'F', val: 'F', x: 380, y: 250, lchild: 'C', rchild: 'C', ltag: 1, rtag: 1 }, // ltag=1 指向前驱 C (这里简化逻辑，假设是指向C)
  { id: 'G', val: 'G', x: 520, y: 250, lchild: 'C', rchild: null, ltag: 1, rtag: 1 },
];

// 连线数据 (包含实线和虚线)
const THREADED_LINKS = [
  { source: 'A', target: 'B', type: 'child' }, { source: 'A', target: 'C', type: 'child' },
  { source: 'B', target: 'D', type: 'child' }, { source: 'B', target: 'E', type: 'child' },
  { source: 'C', target: 'F', type: 'child' }, { source: 'C', target: 'G', type: 'child' },
  // 线索
  { source: 'D', target: 'B', type: 'thread', isLeft: false }, // D->B
  { source: 'E', target: 'A', type: 'thread', isLeft: false }, // E->A
  { source: 'F', target: 'C', type: 'thread', isLeft: true },  // F->C (模拟)
  { source: 'G', target: 'C', type: 'thread', isLeft: true },  // G->C (模拟)
];

const CODES = {
  next: `Node* NextNode(Node* p) {
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
}`,
  pre: `Node* PreNode(Node* p) {
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
}`
};

// ================= 2. 核心演示组件 =================

const SearchDemoBase = ({ mode, startNodeId }) => {
  const [frames, setFrames] = useState([]);

  useEffect(() => {
    const _nodes = JSON.parse(JSON.stringify(THREADED_NODES));
    const _links = [...THREADED_LINKS];
    let framesBuffer = [];

    // 辅助：生成某一帧，高亮节点 currentId
    const pushFrame = (currentId, desc, line) => {
      // 关键：每次必须创建一个新的节点数组，更新 isCurrent 状态
      const frameNodes = _nodes.map(n => ({
        ...n,
        isCurrent: n.id === currentId, // 只有当前的 p 是高亮的
        isPre: false
      }));

      framesBuffer.push({
        line,
        desc,
        data: { nodes: frameNodes, links: _links }
      });
    };

    // 模拟指针 p
    let p = _nodes.find(n => n.id === startNodeId);

    // --- 算法逻辑 ---
    if (mode === 'next') {
        // 演示：找 p 的中序后继
        pushFrame(p.id, `初始状态：我们要找节点 ${p.val} 的后继`, 1);

        if (p.rtag === 1) {
            pushFrame(p.id, `rtag==1，说明有右线索，直接沿线索跳转`, 3);
            let nextId = p.rchild;
            let nextNode = _nodes.find(n => n.id === nextId);
            if(nextNode) pushFrame(nextNode.id, `找到后继：${nextNode.val}`, 4);
        } else {
            pushFrame(p.id, `rtag==0，说明有右子树。后继是右子树的“最左下”节点`, 7);

            // 模拟 p = p->rchild
            let rchildId = p.rchild;
            p = _nodes.find(n => n.id === rchildId);
            pushFrame(p.id, `第一步：进入右孩子 ${p.val}`, 8);

            // 模拟 while (p->ltag == 0) p = p->lchild
            while (p.ltag === 0) {
                pushFrame(p.id, `节点 ${p.val} 还有左孩子，继续向左走`, 9);
                let lchildId = p.lchild;
                p = _nodes.find(n => n.id === lchildId);
                pushFrame(p.id, `移动到左孩子 ${p.val}`, 10);
            }
            pushFrame(p.id, `节点 ${p.val} 没有左孩子了 (ltag==1)，停止。后继就是 ${p.val}`, 12);
        }
    }

    else if (mode === 'pre') {
        // 演示：找 p 的中序前驱
        pushFrame(p.id, `初始状态：我们要找节点 ${p.val} 的前驱`, 1);

        if (p.ltag === 1) {
            pushFrame(p.id, `ltag==1，说明有左线索，直接沿线索跳转`, 3);
            let preId = p.lchild;
            let preNode = _nodes.find(n => n.id === preId);
            if(preNode) pushFrame(preNode.id, `找到前驱：${preNode.val}`, 4);
        } else {
            pushFrame(p.id, `ltag==0，说明有左子树。前驱是左子树的“最右下”节点`, 7);

            // p = p->lchild
            let lchildId = p.lchild;
            p = _nodes.find(n => n.id === lchildId);
            pushFrame(p.id, `第一步：进入左孩子 ${p.val}`, 8);

            // while (p->rtag == 0) p = p->rchild
            while (p.rtag === 0) {
                pushFrame(p.id, `节点 ${p.val} 还有右孩子，继续向右走`, 9);
                let rchildId = p.rchild;
                p = _nodes.find(n => n.id === rchildId);
                pushFrame(p.id, `移动到右孩子 ${p.val}`, 10);
            }
            pushFrame(p.id, `节点 ${p.val} 没有右孩子了 (rtag==1)，停止。前驱就是 ${p.val}`, 12);
        }
    }

    setFrames(framesBuffer);
  }, [mode, startNodeId]);

  return (
    <AlgoPlayer
      code={CODES[mode]}
      frames={frames}
      Visualizer={ThreadedTreeVisualizer}
    />
  );
};

// ================= 3. 导出具体案例 =================

// 案例1：找 B 的后继 (B->E) - 简单线索跳转
// 案例2：找 A 的后继 (A->F) - 复杂跳转，演示 "右子树的最左下"
export const InorderNextDemo_Complex = () => <SearchDemoBase mode="next" startNodeId="B" />; // 演示找 B 的后继（简单）
export const InorderNextDemo_Simple = () => <SearchDemoBase mode="next" startNodeId="A" />;  // 演示找 A 的后继（复杂）

export const InorderPreDemo = () => <SearchDemoBase mode="pre" startNodeId="C" />;