import React, { useState, useEffect } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import ThreadedTreeVisualizer from './ThreadedTreeVisualizer';

// 基础树结构 (A, B, C, D, E, F, G)
//       A
//     /   \
//    B     C
//   / \   / \
//  D   E F   G
const INITIAL_NODES = [
  { id: 'A', val: 'A', x: 300, y: 50, lchild: 'B', rchild: 'C', ltag: 0, rtag: 0 },
  { id: 'B', val: 'B', x: 150, y: 150, lchild: 'D', rchild: 'E', ltag: 0, rtag: 0 },
  { id: 'C', val: 'C', x: 450, y: 150, lchild: 'F', rchild: 'G', ltag: 0, rtag: 0 },
  { id: 'D', val: 'D', x: 80, y: 250, lchild: null, rchild: null, ltag: 0, rtag: 0 },
  { id: 'E', val: 'E', x: 220, y: 250, lchild: null, rchild: null, ltag: 0, rtag: 0 },
  { id: 'F', val: 'F', x: 380, y: 250, lchild: null, rchild: null, ltag: 0, rtag: 0 },
  { id: 'G', val: 'G', x: 520, y: 250, lchild: null, rchild: null, ltag: 0, rtag: 0 },
];

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

const ThreadedTreeDemo = () => {
  const [activeTab, setActiveTab] = useState('inorder');
  const [frames, setFrames] = useState([]);

  // 核心：生成演示帧
  const generateFrames = (mode) => {
    let _nodes = JSON.parse(JSON.stringify(INITIAL_NODES));
    let _links = [];

    // 初始化实线连接
    _nodes.forEach(n => {
      if (n.lchild) _links.push({ source: n.id, target: n.lchild, type: 'child' });
      if (n.rchild) _links.push({ source: n.id, target: n.rchild, type: 'child' });
    });

    let framesBuffer = [];
    let pre = null; // 指向 Node 对象引用

    // 记录一帧的辅助函数
    const recordFrame = (p, desc, line) => {
      // 转换 _nodes 和 _links 到 visualizer 需要的格式
      // 注意：这里需要处理 links，把 thread 类型的加进去
      const renderLinks = [..._links];

      // 遍历 nodes 找出已经线索化的指针，添加到 links 用于渲染
      _nodes.forEach(n => {
        if (n.ltag === 1 && n.lchild) {
          renderLinks.push({ source: n.id, target: n.lchild, type: 'thread', isLeft: true });
        }
        if (n.rtag === 1 && n.rchild) {
          renderLinks.push({ source: n.id, target: n.rchild, type: 'thread', isLeft: false });
        }
      });

      framesBuffer.push({
        line: line || 0,
        desc: desc,
        data: cloneTree(_nodes, renderLinks, p ? p.id : null, pre ? pre.id : null)
      });
    };

    // 访问节点并线索化的逻辑 (通用的 visit 函数)
    const visit = (p) => {
      if (!p) return;

      // 1. 处理前驱线索 (p 的左孩子为空)
      if (p.lchild === null) {
        p.ltag = 1;
        p.lchild = pre ? pre.id : null; // 指向前驱
        recordFrame(p, `节点 ${p.val} 左子树为空，建立左线索：指向前驱 ${pre ? pre.val : 'NULL'}`, 1);
      } else {
        // 如果不是线索，保持 ltag=0
        // recordFrame(p, `节点 ${p.val} 访问中...`, 1);
      }

      // 2. 处理后继线索 (pre 的右孩子为空)
      if (pre && pre.rchild === null) {
        pre.rtag = 1;
        pre.rchild = p.id; // 指向后继
        recordFrame(p, `前驱 ${pre.val} 右子树为空，建立右线索：指向后继 ${p.val}`, 2);
      }

      pre = p;
    };

    // ========== 算法实现 ==========

    // 1. 中序线索化
    const InOrderThreading = (p) => {
      if (p) {
        // 中序：左 -> 根 -> 右
        // 只有当 ltag == 0 时才递归左子树 (避免死循环)
        if (p.ltag === 0) InOrderThreading(_nodes.find(n => n.id === p.lchild));

        visit(p);

        if (p.rtag === 0) InOrderThreading(_nodes.find(n => n.id === p.rchild));
      }
    };

    // 2. 先序线索化
    const PreOrderThreading = (p) => {
      if (p) {
        visit(p);

        // 先序：根 -> 左 -> 右
        // 特别注意：如果有左线索了，就不要往左走了，否则会转圈
        if (p.ltag === 0) PreOrderThreading(_nodes.find(n => n.id === p.lchild));
        if (p.rtag === 0) PreOrderThreading(_nodes.find(n => n.id === p.rchild));
      }
    };

    // 3. 后序线索化
    const PostOrderThreading = (p) => {
      if (p) {
        // 后序：左 -> 右 -> 根
        if (p.ltag === 0) PostOrderThreading(_nodes.find(n => n.id === p.lchild));
        if (p.rtag === 0) PostOrderThreading(_nodes.find(n => n.id === p.rchild));

        visit(p);
      }
    };


    // 执行算法
    const root = _nodes.find(n => n.id === 'A');

    if (mode === 'inorder') {
        InOrderThreading(root);
        // 处理最后一个节点的右线索
        if (pre) {
            pre.rtag = 1;
            pre.rchild = null;
            recordFrame(null, `遍历结束，处理最后一个节点 ${pre.val} 的右线索为 NULL`, 3);
        }
    } else if (mode === 'preorder') {
        PreOrderThreading(root);
        if (pre) { pre.rtag = 1; pre.rchild = null; recordFrame(null, '处理最后一个节点右线索', 3); }
    } else {
        PostOrderThreading(root);
        if (pre && pre.rchild === null) { pre.rtag = 1; pre.rchild = null; recordFrame(null, '处理最后一个节点右线索', 3); }
    }

    setFrames(framesBuffer);
  };

  // 切换 Tab 时重新生成
  useEffect(() => {
    generateFrames(activeTab);
  }, [activeTab]);

  return (
    <div>
      <div style={{display: 'flex', gap: 10, marginBottom: 20}}>
        <button
            style={btnStyle(activeTab === 'inorder')}
            onClick={() => setActiveTab('inorder')}>
            中序线索化
        </button>
        <button
            style={btnStyle(activeTab === 'preorder')}
            onClick={() => setActiveTab('preorder')}>
            先序线索化
        </button>
        <button
            style={btnStyle(activeTab === 'postorder')}
            onClick={() => setActiveTab('postorder')}>
            后序线索化
        </button>
      </div>

      <AlgoPlayer
        key={activeTab} // 强制重置播放器
        code={CODES[activeTab]}
        frames={frames}
        Visualizer={ThreadedTreeVisualizer}
      />
    </div>
  );
};

const btnStyle = (active) => ({
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    backgroundColor: active ? '#2ea043' : '#21262d',
    color: active ? '#fff' : '#c9d1d9',
    transition: '0.2s'
});

const CODES = {
    inorder: `void InThread(ThreadTree p) {
    if (p != NULL) {
        InThread(p->lchild); // 递归左
        visit(p);            // 处理根
        InThread(p->rchild); // 递归右
    }
}
void visit(ThreadNode *p) {
    if (p->lchild == NULL) { // 建立前驱线索
        p->lchild = pre;
        p->ltag = 1;
    }
    if (pre != NULL && pre->rchild == NULL) {
        pre->rchild = p; // 建立后继线索
        pre->rtag = 1;
    }
    pre = p;
}`,
    preorder: `void PreThread(ThreadTree p) {
    if (p != NULL) {
        visit(p); // 先处理根
        // ltag==0 防止转圈(避免访问到前驱线索)
        if (p->ltag == 0) 
            PreThread(p->lchild);
        PreThread(p->rchild);
    }
}`,
    postorder: `void PostThread(ThreadTree p) {
    if (p != NULL) {
        PostThread(p->lchild);
        PostThread(p->rchild);
        visit(p); // 最后处理根
    }
}`
};

export default ThreadedTreeDemo;