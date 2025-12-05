// src/components/AlgoScenes/ThreadedTreeModes.js
import React, { useState, useEffect } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import ThreadedTreeVisualizer from './ThreadedTreeVisualizer';

// ================= 数据准备 =================
const INITIAL_NODES = [
  { id: 'A', val: 'A', x: 300, y: 50, lchild: 'B', rchild: 'C', ltag: 0, rtag: 0 },
  { id: 'B', val: 'B', x: 150, y: 150, lchild: 'D', rchild: 'E', ltag: 0, rtag: 0 },
  { id: 'C', val: 'C', x: 450, y: 150, lchild: 'F', rchild: 'G', ltag: 0, rtag: 0 },
  { id: 'D', val: 'D', x: 80, y: 250, lchild: null, rchild: null, ltag: 0, rtag: 0 },
  { id: 'E', val: 'E', x: 220, y: 250, lchild: null, rchild: null, ltag: 0, rtag: 0 },
  { id: 'F', val: 'F', x: 380, y: 250, lchild: null, rchild: null, ltag: 0, rtag: 0 },
  { id: 'G', val: 'G', x: 520, y: 250, lchild: null, rchild: null, ltag: 0, rtag: 0 },
];

const CODES = {
  inorder: `void InThread(ThreadTree p) {
    if (p != NULL) {
        InThread(p->lchild);
        visit(p);            // 🟢 访问根
        InThread(p->rchild);
    }
}
void visit(ThreadNode *p) {
    // 1. 建立前驱线索
    if (p->lchild == NULL) {
        p->lchild = pre; p->ltag = 1;
    }
    // 2. 建立后继线索
    if (pre != NULL && pre->rchild == NULL) {
        pre->rchild = p; pre->rtag = 1;
    }
    pre = p;
}`,
  preorder: `void PreThread(ThreadTree p) {
    if (p != NULL) {
        visit(p);            // 🟢 先访问根
        if (p->ltag == 0) // 避免回滚
            PreThread(p->lchild);
        PreThread(p->rchild);
    }
}`,
  postorder: `void PostThread(ThreadTree p) {
    if (p != NULL) {
        PostThread(p->lchild);
        PostThread(p->rchild);
        visit(p);            // 🟢 后访问根
    }
}`
};

// 深拷贝工具
const cloneTree = (nodes, links, pId, preId) => {
  return {
    nodes: nodes.map(n => ({
      ...n,
      isCurrent: n.id === pId,
      isPre: n.id === preId
    })),
    links: [...links]
  };
};

// ================= 核心逻辑组件 =================
const ThreadedTreeBase = ({ mode }) => {
  const [frames, setFrames] = useState([]);

  useEffect(() => {
    let _nodes = JSON.parse(JSON.stringify(INITIAL_NODES));
    let _links = [];

    // 初始化实线连接
    _nodes.forEach(n => {
      if (n.lchild) _links.push({ source: n.id, target: n.lchild, type: 'child' });
      if (n.rchild) _links.push({ source: n.id, target: n.rchild, type: 'child' });
    });

    let framesBuffer = [];
    let pre = null;

    // 记录一帧
    const recordFrame = (p, desc, line) => {
      const renderLinks = [..._links];
      _nodes.forEach(n => {
        if (n.ltag === 1 && n.lchild) renderLinks.push({ source: n.id, target: n.lchild, type: 'thread', isLeft: true });
        if (n.rtag === 1 && n.rchild) renderLinks.push({ source: n.id, target: n.rchild, type: 'thread', isLeft: false });
      });

      framesBuffer.push({
        line: line || 0,
        desc: desc,
        data: cloneTree(_nodes, renderLinks, p ? p.id : null, pre ? pre.id : null)
      });
    };

    // [优化1] 添加初始状态帧
    recordFrame(null, '初始状态：准备开始线索化', 0);

    const visit = (p) => {
      if (!p) return;

      // [优化2] 只要访问节点，先记录一帧（哪怕不需要连线）
      // 这样用户能看到光标移动到了当前节点
      recordFrame(p, `正在访问节点 ${p.val}`, mode === 'inorder' ? 4 : (mode === 'preorder' ? 2 : 4));

      // 建立前驱
      if (p.lchild === null) {
        p.ltag = 1; p.lchild = pre ? pre.id : null;
        recordFrame(p, `建立左线索：节点 ${p.val} -> 前驱 ${pre ? pre.val : 'NULL'}`, 9);
      }
      // 建立后继
      if (pre && pre.rchild === null) {
        pre.rtag = 1; pre.rchild = p.id;
        // 注意：这里建立的是 pre 的右线索，但为了视觉连贯，光标还是停在 p 上
        recordFrame(p, `建立右线索：前驱 ${pre.val} -> 后继 ${p.val}`, 12);
      }
      pre = p;
    };

    // 算法递归逻辑
    const InOrderThreading = (p) => {
      if (p) {
        if (p.ltag === 0) InOrderThreading(_nodes.find(n => n.id === p.lchild));
        visit(p);
        if (p.rtag === 0) InOrderThreading(_nodes.find(n => n.id === p.rchild));
      }
    };

    const PreOrderThreading = (p) => {
      if (p) {
        visit(p);
        if (p.ltag === 0) PreOrderThreading(_nodes.find(n => n.id === p.lchild));
        if (p.rtag === 0) PreOrderThreading(_nodes.find(n => n.id === p.rchild));
      }
    };

    const PostOrderThreading = (p) => {
      if (p) {
        if (p.ltag === 0) PostOrderThreading(_nodes.find(n => n.id === p.lchild));
        if (p.rtag === 0) PostOrderThreading(_nodes.find(n => n.id === p.rchild));
        visit(p);
      }
    };

    const root = _nodes.find(n => n.id === 'A');

    // 执行
    if (mode === 'inorder') {
        InOrderThreading(root);
        // 处理最后一个节点的收尾
        if (pre) {
            pre.rtag = 1; pre.rchild = null;
            recordFrame(null, `处理最后一个节点 ${pre.val} 的右线索`, 14);
        }
    } else if (mode === 'preorder') {
        PreOrderThreading(root);
        if (pre) { pre.rtag = 1; pre.rchild = null; recordFrame(null, '收尾工作', 2); }
    } else {
        PostOrderThreading(root);
        if (pre && pre.rchild === null) { pre.rtag = 1; pre.rchild = null; recordFrame(null, '收尾工作', 4); }
    }

    setFrames(framesBuffer);
  }, [mode]);

  return (
    <AlgoPlayer
      code={CODES[mode]}
      frames={frames}
      Visualizer={ThreadedTreeVisualizer}
    />
  );
};

export const InOrderDemo = () => <ThreadedTreeBase mode="inorder" />;
export const PreOrderDemo = () => <ThreadedTreeBase mode="preorder" />;
export const PostOrderDemo = () => <ThreadedTreeBase mode="postorder" />;