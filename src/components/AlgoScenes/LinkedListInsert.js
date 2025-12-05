import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AlgoPlayer from '../AlgoPlayer';

// 1. 定义要在左侧显示的代码
const CODE_C_PLUS_PLUS = `/* 链表插入节点 */
void insert(Node* n0, Node* P) {
    // 1. 新节点 P 的 next 指向 n1
    P->next = n0->next;
    
    // 2. n0 的 next 指向 P
    n0->next = P;
}`;

// 2. 定义可视化的图形组件 (接收 data 参数)
const LinkedListVisualizer = ({ data }) => {
  // data 结构: { nodes: [{val: 1, id: 'n0'}, ...], links: [...] }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100px' }}>
      <AnimatePresence>
        {data.nodes.map((node, i) => (
          <motion.div
            layout // 开启布局动画，这是平滑移动的关键
            key={node.id}
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: node.isNew ? -20 : 0, // 新节点稍微浮起
              backgroundColor: node.highlight ? '#d2a8ff' : '#0969da' // 高亮紫色，普通蓝色
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              position: 'relative',
              zIndex: node.isNew ? 10 : 1
            }}
          >
            <span style={{fontWeight:'bold'}}>{node.val}</span>
            <span style={{fontSize:'10px', opacity:0.7}}>{node.name}</span>

            {/* 简单的指针箭头 */}
            {node.next && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                style={{
                  position: 'absolute',
                  right: '-50px',
                  top: '25px',
                  height: '2px',
                  background: '#fff',
                }}
              >
                 <div style={{position:'absolute', right:0, top:-4, borderLeft:'6px solid #fff', borderTop:'5px solid transparent', borderBottom:'5px solid transparent'}}></div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// 3. 定义“剧本”（帧数据）
const FRAMES = [
  {
    line: 2,
    desc: "初始状态：我们要在 n0 和 n1 之间插入新节点 P",
    data: {
      nodes: [
        { id: 'n0', val: 10, name: 'n0', next: true },
        { id: 'n1', val: 20, name: 'n1', next: true },
        { id: 'n2', val: 30, name: 'n2', next: false }
      ]
    }
  },
  {
    line: 2,
    desc: "创建新节点 P (值为 99)",
    data: {
      nodes: [
        { id: 'n0', val: 10, name: 'n0', next: true },
        // P 出现了，但还没连入链表
        { id: 'p', val: 99, name: 'P', isNew: true, highlight: true, next: false },
        { id: 'n1', val: 20, name: 'n1', next: true },
        { id: 'n2', val: 30, name: 'n2', next: false }
      ]
    }
  },
  {
    line: 4,
    desc: "第一步：P->next = n0->next (让 P 指向 n1)",
    data: {
      nodes: [
        { id: 'n0', val: 10, name: 'n0', next: true },
        // P 的 next 指针出现了
        { id: 'p', val: 99, name: 'P', isNew: true, highlight: true, next: true },
        { id: 'n1', val: 20, name: 'n1', next: true },
        { id: 'n2', val: 30, name: 'n2', next: false }
      ]
    }
  },
  {
    line: 7,
    desc: "第二步：n0->next = P (让 n0 指向 P)",
    data: {
      nodes: [
        // n0 指向了 P (视觉上我们把 P 放入数组中间，依靠 motion layout 自动动画)
        { id: 'n0', val: 10, name: 'n0', next: true },
        { id: 'p', val: 99, name: 'P', isNew: false, highlight: true, next: true },
        { id: 'n1', val: 20, name: 'n1', next: true },
        { id: 'n2', val: 30, name: 'n2', next: false }
      ]
    }
  },
  {
    line: 8,
    desc: "完成：P 成功插入链表",
    data: {
      nodes: [
        { id: 'n0', val: 10, name: 'n0', next: true },
        { id: 'p', val: 99, name: 'P', isNew: false, highlight: false, next: true },
        { id: 'n1', val: 20, name: 'n1', next: true },
        { id: 'n2', val: 30, name: 'n2', next: false }
      ]
    }
  }
];

// 4. 导出最终组件
export default function LinkedListInsertDemo() {
  return (
    <AlgoPlayer
      code={CODE_C_PLUS_PLUS}
      frames={FRAMES}
      Visualizer={LinkedListVisualizer}
    />
  );
}