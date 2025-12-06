import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AlgoPlayer from '../AlgoPlayer';

// ================== 1. 代码定义 ==================
const CODE_INIT = `// 顺序栈结构定义
typedef struct {
    int *base;      // 栈底指针
    int *top;       // 栈顶指针
    int stackSize;  // 当前已分配容量
} SqStack;

// 初始化函数
void InitStack(SqStack &S) {
    // 1. 分配内存 (假设 MAX_SIZE = 5)
    S.base = new int[MAX_SIZE];
    
    // 2. 内存分配失败检查
    if (!S.base) exit(0);
    
    // 3. 设置栈顶初值 (空栈时 top == base)
    S.top = S.base;
    
    // 4. 设置栈容量
    S.stackSize = MAX_SIZE;
}`;

// ================== 2. 可视化组件 ==================
const InitVisualizer = ({ data }) => {
  // data.stage:
  // 0: 未开始
  // 1: 分配内存 (S.base 指向内存)
  // 2: 设置 Top (S.top 指向内存)
  // 3: 设置 Size

  const MEMORY_BLOCKS = [0, 1, 2, 3, 4]; // 模拟5个内存单元

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '300px', gap: '50px', background: '#0d1117', borderRadius: '8px'
    }}>

      {/* 左侧：结构体变量 S */}
      <div style={{
        width: 140, padding: 15, border: '2px solid #30363d', borderRadius: 8,
        background: '#161b22', display: 'flex', flexDirection: 'column', gap: 15
      }}>
        <div style={{ color: '#fff', fontWeight: 'bold', borderBottom: '1px solid #30363d', paddingBottom: 5 }}>
          Struct S
        </div>

        {/* base 指针 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8b949e', fontSize: 14 }}>base:</span>
          <span style={{
            color: data.stage >= 1 ? '#58a6ff' : '#ff4d4f',
            fontFamily: 'monospace'
          }}>
            {data.stage >= 1 ? '0x100' : 'NULL'}
          </span>
        </div>

        {/* top 指针 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8b949e', fontSize: 14 }}>top:</span>
          <span style={{
            color: data.stage >= 2 ? '#58a6ff' : '#ff4d4f',
            fontFamily: 'monospace'
          }}>
            {data.stage >= 2 ? '0x100' : 'NULL'}
          </span>
        </div>

        {/* stackSize */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8b949e', fontSize: 14 }}>size:</span>
          <motion.span
            animate={{ scale: data.stage >= 3 ? [1.5, 1] : 1, color: data.stage >= 3 ? '#2ea043' : '#8b949e' }}
            style={{ fontFamily: 'monospace' }}
          >
            {data.stage >= 3 ? '5' : '0'}
          </motion.span>
        </div>
      </div>

      {/* 中间：指针连线区 (绝对定位的箭头) */}
      <div style={{ width: 60, height: 200, position: 'relative' }}>
        {/* Base 指针箭头 */}
        <AnimatePresence>
          {data.stage >= 1 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 60, opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute', top: 60, left: 0,
                height: 2, background: '#58a6ff',
                display: 'flex', alignItems: 'center'
              }}
            >
              <div style={{ position: 'absolute', right: -6, top: -4, borderLeft: '8px solid #58a6ff', borderTop: '5px solid transparent', borderBottom: '5px solid transparent' }} />
              <span style={{ position: 'absolute', top: -20, left: 10, fontSize: 12, color: '#58a6ff' }}>points to</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top 指针箭头 */}
        <AnimatePresence>
          {data.stage >= 2 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 60, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                position: 'absolute', top: 100, left: 0,
                height: 2, background: '#e0a612', // 金色区分 top
                display: 'flex', alignItems: 'center'
              }}
            >
              {/* 弯曲一下箭头指向同一个地方 */}
              <div style={{ position: 'absolute', right: -6, top: -38, borderLeft: '8px solid #e0a612', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', transform: 'rotate(-45deg)' }} />
              <div style={{ position: 'absolute', right: 0, width: 2, height: 40, background: '#e0a612', bottom: 0 }}></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 右侧：堆内存 (连续空间) */}
      <div style={{
        width: 100, height: 220, border: '2px dashed #8b949e', borderRadius: 8,
        display: 'flex', flexDirection: 'column-reverse', padding: 5,
        position: 'relative', background: '#010409'
      }}>
        <span style={{ position: 'absolute', top: -25, width: '100%', textAlign: 'center', fontSize: 12, color: '#8b949e' }}>Heap Memory</span>

        <AnimatePresence>
          {data.stage >= 1 && MEMORY_BLOCKS.map((idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                flex: 1, border: '1px solid #30363d', margin: 1,
                background: idx === 0 ? 'rgba(88, 166, 255, 0.2)' : 'transparent', // 高亮 base/top 指向的位置
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#8b949e', position: 'relative'
              }}
            >
              {/* 内存地址模拟 */}
              <span style={{ position: 'absolute', left: -40, fontSize: 10 }}>0x{100 + idx * 4}</span>
              {/* 索引 */}
              Index {idx}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 标记 */}
        {data.stage >= 2 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'absolute', bottom: -5, right: -60, color: '#e0a612', fontSize: 12, fontWeight: 'bold' }}
          >
            ⬅ Top
          </motion.div>
        )}
        {data.stage >= 1 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'absolute', bottom: -25, right: -60, color: '#58a6ff', fontSize: 12, fontWeight: 'bold' }}
          >
            ⬅ Base
          </motion.div>
        )}
      </div>

    </div>
  );
};

// ================== 3. 动画帧数据 ==================
const FRAMES = [
  {
    line: 1,
    desc: "初始状态：声明了一个结构体 S，但内部指针未初始化 (NULL)。",
    data: { stage: 0 }
  },
  {
    line: 10,
    desc: "第一步：new int[MAX_SIZE]。在堆区开辟连续内存，并将 S.base 指向首地址。",
    data: { stage: 1 }
  },
  {
    line: 13,
    desc: "内存检查通过 (S.base 不为空)。",
    data: { stage: 1 }
  },
  {
    line: 16,
    desc: "第二步：S.top = S.base。让栈顶指针也指向栈底，此时栈为空。",
    data: { stage: 2 }
  },
  {
    line: 19,
    desc: "第三步：记录栈的最大容量 (stackSize = 5)。初始化完成！",
    data: { stage: 3 }
  }
];

// ================== 4. 导出组件 ==================
export default function SeqStackInitDemo() {
  return (
    <AlgoPlayer
      code={CODE_INIT}
      frames={FRAMES}
      Visualizer={InitVisualizer}
    />
  );
}