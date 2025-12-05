// src/components/AlgoScenes/ThreadedSearchSixModes.js
import React, { useState, useEffect } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import ThreadedTreeVisualizer from './ThreadedTreeVisualizer';

// ================= 1. 基础数据 =================
// 树结构：
//       A
//     /   \
//    B     C
//   / \   / \
//  D   E F   G
const BASE_NODES = [
  { id: 'A', val: 'A', x: 300, y: 50,  lchild: 'B', rchild: 'C' },
  { id: 'B', val: 'B', x: 150, y: 150, lchild: 'D', rchild: 'E' },
  { id: 'C', val: 'C', x: 450, y: 150, lchild: 'F', rchild: 'G' },
  { id: 'D', val: 'D', x: 80,  y: 250, lchild: null, rchild: null },
  { id: 'E', val: 'E', x: 220, y: 250, lchild: null, rchild: null },
  { id: 'F', val: 'F', x: 380, y: 250, lchild: null, rchild: null },
  { id: 'G', val: 'G', x: 520, y: 250, lchild: null, rchild: null },
];

const BASE_LINKS = [
  { source: 'A', target: 'B', type: 'child' }, { source: 'A', target: 'C', type: 'child' },
  { source: 'B', target: 'D', type: 'child' }, { source: 'B', target: 'E', type: 'child' },
  { source: 'C', target: 'F', type: 'child' }, { source: 'C', target: 'G', type: 'child' },
];

// 6套代码字符串
const CODES = {
  // 1. 中序后继
  in_next: `Node* InNext(Node* p) {
    // 1. 若 rtag==1，直接返回右孩子(线索)
    if (p->rtag == 1) return p->rchild;
    
    // 2. 否则，后继是右子树的"最左下"结点
    p = p->rchild; 
    while (p->ltag == 0) {
        p = p->lchild;
    }
    return p; 
}`,
  // 2. 中序前驱
  in_pre: `Node* InPre(Node* p) {
    // 1. 若 ltag==1，直接返回左孩子(线索)
    if (p->ltag == 1) return p->lchild;

    // 2. 否则，前驱是左子树的"最右下"结点
    p = p->lchild;
    while (p->rtag == 0) {
        p = p->rchild;
    }
    return p;
}`,
  // 3. 先序后继
  pre_next: `Node* PreNext(Node* p) {
    // 1. 若有左孩子，则左孩子是后继
    if (p->ltag == 0) return p->lchild;
    
    // 2. 若无左孩子，则右孩子是后继
    // (无论是实孩子还是线索，都是右指针)
    return p->rchild;
}`,
  // 4. 先序前驱 (难点: 需父指针)
  pre_pre: `Node* PrePre(Node* p) {
    // 1. 若 ltag==1，直接返回线索
    if (p->ltag == 1) return p->lchild;
    
    // 2. 若 ltag==0，需找父节点 parent
    // (假设已知 parent 且 p 是 parent 的右孩子)
    // 且 parent 有左孩子，则前驱是左兄弟子树的"最右下"
    // ...逻辑较复杂，依赖父节点...
    return LastNode(parent->lchild);
}`,
  // 5. 后序后继 (难点: 需父指针)
  post_next: `Node* PostNext(Node* p) {
    // 1. 若 rtag==1，直接返回线索
    if (p->rtag == 1) return p->rchild;
    
    // 2. 若 rtag==0，需找父节点 parent
    // 若 p 是 parent 的左孩子，且 parent 有右子树
    // 则后继是右兄弟子树的"第一个"结点
    // ...逻辑较复杂，依赖父节点...
    return FirstNode(parent->rchild);
}`,
  // 6. 后序前驱
  post_pre: `Node* PostPre(Node* p) {
    // 1. 若有右孩子，右孩子是前驱
    if (p->rtag == 0) return p->rchild;
    
    // 2. 若无右孩子，左孩子是前驱
    return p->lchild;
}`
};

// ================= 2. 场景生成器 =================

const SceneGenerator = ({ mode }) => {
  const [frames, setFrames] = useState([]);

  useEffect(() => {
    // 深拷贝节点，防止污染
    const _nodes = JSON.parse(JSON.stringify(BASE_NODES));
    const _links = JSON.parse(JSON.stringify(BASE_LINKS));
    let framesBuffer = [];

    // 辅助函数：添加线索连线
    const addThread = (source, target, isLeft) => {
      _links.push({ source, target, type: 'thread', isLeft });
    };

    // 辅助函数：根据ID获取节点
    const N = (id) => _nodes.find(n => n.id === id);

    // 核心：录制一帧
    const pushFrame = (pId, desc, line) => {
      const frameNodes = _nodes.map(n => ({
        ...n,
        isCurrent: n.id === pId, // 高亮当前指针 p
        isPre: false // 这里简化，不高亮 pre
      }));
      framesBuffer.push({ line, desc, data: { nodes: frameNodes, links: _links } });
    };

    // ========== 针对不同模式的剧本逻辑 ==========

    if (mode === 'in_next') {
        // 演示：中序后继，找 A 的后继 (是 F)
        // 构造环境：A 的 rchild 是 C (实)，需要走逻辑2
        const p = N('A');
        pushFrame('A', '初始状态：寻找 A 的中序后继', 1);

        pushFrame('A', 'p->rtag == 0 (有右子树)，执行 else 逻辑', 6);
        pushFrame('C', '第一步：进入右子树 (p = p->rchild)', 7); // p 指向 C

        // C 有左孩子 F，继续左走
        pushFrame('C', '检查：p 有左孩子吗？有 (F)', 8);
        pushFrame('F', '向左走：p = p->lchild', 9);

        pushFrame('F', '检查：p 还有左孩子吗？没有 (ltag==1)', 8);
        pushFrame('F', '循环结束，找到后继：F', 11);
    }

    else if (mode === 'in_pre') {
        // 演示：中序前驱，找 C 的前驱 (是 A)
        // 构造环境：C 的 lchild 是 F (实)，但 F 是最左了，不，前驱是左子树最右下
        // 中序序列：D B E A F C G。 C 的前驱是 F。
        // 等等，上面逻辑里，F 是 C 的左孩子。
        // 中序遍历： ... A -> F -> C ...
        // 所以找 C 的前驱。
        const p = N('C');
        pushFrame('C', '初始状态：寻找 C 的中序前驱', 1);

        pushFrame('C', 'p->ltag == 0 (有左子树)，执行 else 逻辑', 6);
        pushFrame('F', '第一步：进入左子树 (p = p->lchild)', 7);

        // F 没有右孩子，循环直接结束
        pushFrame('F', '检查：p 有右孩子吗？没有 (rtag==1)', 8);
        pushFrame('F', '循环结束，找到前驱：F', 11);
    }

    else if (mode === 'pre_next') {
        // 演示：先序后继，找 B 的后继 (是 D)
        const p = N('B');
        pushFrame('B', '初始状态：寻找 B 的先序后继', 1);

        // 先序：根 左 右。 B 有左孩子 D。
        pushFrame('B', '检查：p 有左孩子吗？有 (ltag==0)', 3);
        pushFrame('D', '直接返回左孩子 D', 3);
    }

    else if (mode === 'pre_pre') {
        // 演示：先序前驱，找 E 的前驱 (是 D)
        // 必须假设我们知道父节点 B
        // 先序序列：A B D E ...
        // E 是 B 的右孩子，B 有左孩子 D。前驱是左兄弟子树的最后一个节点(D)。
        const p = N('E');
        addThread('D', 'E', false); // 视觉上画个 D->E 的线索表示前驱关系，但这其实是逻辑推导

        pushFrame('E', '初始状态：寻找 E 的先序前驱', 1);
        pushFrame('E', 'p->ltag==1? 否，无法直接通过线索找', 5);
        pushFrame('E', '困难模式：需要找父节点 B', 7);

        // 模拟父节点跳转
        pushFrame('B', '找到父节点 B。E 是 B 的右孩子', 8);
        pushFrame('B', '检查 B 是否有左孩子？有 (D)', 9);
        pushFrame('D', '前驱是左兄弟 D', 11);
    }

    else if (mode === 'post_next') {
        // 演示：后序后继，找 B 的后继 (是 F)
        // 后序序列：D E B F G C A
        // B 是 A 的左孩子。后继是 A 的右子树(C)的第一个节点(后序第一个是左右根.. F)
        const p = N('B');

        pushFrame('B', '初始状态：寻找 B 的后序后继', 1);
        pushFrame('B', 'p->rtag==1? 否', 5);
        pushFrame('B', '困难模式：需要找父节点 A', 7);

        pushFrame('A', '找到父节点 A。B 是 A 的左孩子', 8);
        pushFrame('A', 'A 有右子树 C，转到右子树', 9);

        // 找 C 子树的后序第一个节点
        pushFrame('C', '进入 C，寻找后序遍历的第一个节点', 10);
        // 后序第一个：优先左，没有左找右
        pushFrame('F', '找到 C 的左孩子 F', 11);
        pushFrame('F', 'F 是叶子，找到后继：F', 11);
    }

    else if (mode === 'post_pre') {
        // 演示：后序前驱，找 C 的前驱 (是 G)
        // 后序：... F G C ...
        // C 有右孩子 G。前驱就是 G。
        const p = N('C');
        pushFrame('C', '初始状态：寻找 C 的后序前驱', 1);

        pushFrame('C', '检查：p 有右孩子吗？有 (G)', 3);
        pushFrame('G', '直接返回右孩子 G', 3);
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

// ================= 3. 导出 6 个独立组件 =================

export const InNextDemo = () => <SceneGenerator mode="in_next" />;
export const InPreDemo = () => <SceneGenerator mode="in_pre" />;
export const PreNextDemo = () => <SceneGenerator mode="pre_next" />;
export const PrePreDemo = () => <SceneGenerator mode="pre_pre" />;
export const PostNextDemo = () => <SceneGenerator mode="post_next" />;
export const PostPreDemo = () => <SceneGenerator mode="post_pre" />;