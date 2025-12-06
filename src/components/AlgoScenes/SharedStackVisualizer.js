import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 配置常量
const MAX_SIZE = 10;
const CELL_SIZE = 50;
const GAP = 5;

const SharedStackVisualizer = () => {
  // 核心状态
  const [arr, setArr] = useState(Array(MAX_SIZE).fill(null)); // 物理存储数组
  const [top0, setTop0] = useState(-1);          // 栈0 栈顶指针
  const [top1, setTop1] = useState(MAX_SIZE);    // 栈1 栈顶指针

  // 输入框状态
  const [val0, setVal0] = useState('');
  const [val1, setVal1] = useState('');
  const [msg, setMsg] = useState({ text: '就绪', type: 'info' });

  // --- 操作逻辑 ---

  // 栈 0 入栈
  const push0 = () => {
    if (top0 + 1 === top1) {
      setMsg({ text: '❌ 栈满 (Stack Overflow)', type: 'error' });
      return;
    }
    if (!val0) return;

    const nextTop = top0 + 1;
    const newArr = [...arr];
    newArr[nextTop] = { val: val0, type: 0, id: Date.now() }; // type 0 代表栈0元素

    setArr(newArr);
    setTop0(nextTop);
    setVal0('');
    setMsg({ text: `栈0 入栈: ${val0}`, type: 'success' });
  };

  // 栈 0 出栈
  const pop0 = () => {
    if (top0 === -1) {
      setMsg({ text: '⚠️ 栈0 已空 (Stack Underflow)', type: 'warning' });
      return;
    }
    const newArr = [...arr];
    const val = newArr[top0].val;
    newArr[top0] = null;

    setArr(newArr);
    setTop0(top0 - 1);
    setMsg({ text: `栈0 出栈: ${val}`, type: 'info' });
  };

  // 栈 1 入栈
  const push1 = () => {
    if (top1 - 1 === top0) {
      setMsg({ text: '❌ 栈满 (Stack Overflow)', type: 'error' });
      return;
    }
    if (!val1) return;

    const nextTop = top1 - 1;
    const newArr = [...arr];
    newArr[nextTop] = { val: val1, type: 1, id: Date.now() }; // type 1 代表栈1元素

    setArr(newArr);
    setTop1(nextTop);
    setVal1('');
    setMsg({ text: `栈1 入栈: ${val1}`, type: 'success' });
  };

  // 栈 1 出栈
  const pop1 = () => {
    if (top1 === MAX_SIZE) {
      setMsg({ text: '⚠️ 栈1 已空 (Stack Underflow)', type: 'warning' });
      return;
    }
    const newArr = [...arr];
    const val = newArr[top1].val;
    newArr[top1] = null;

    setArr(newArr);
    setTop1(top1 + 1);
    setMsg({ text: `栈1 出栈: ${val}`, type: 'info' });
  };

  // --- 样式助手 ---
  const getMsgColor = () => {
    if (msg.type === 'error') return '#ff4d4f';
    if (msg.type === 'warning') return '#e0a612';
    if (msg.type === 'success') return '#2ea043';
    return '#8b949e';
  };

  return (
    <div style={{ border: '1px solid #30363d', borderRadius: 8, padding: 20, background: '#0d1117', fontFamily: 'sans-serif' }}>

      {/* 标题与状态栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: '#fff' }}>共享栈 (Shared Stack)</h3>
        <span style={{ color: getMsgColor(), fontWeight: 'bold' }}>{msg.text}</span>
      </div>

      {/* 核心可视化区域 */}
      <div style={{ position: 'relative', height: 120, margin: '40px 0', background: '#161b22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* 数组格子背景 */}
        <div style={{ display: 'flex', gap: GAP }}>
          {Array(MAX_SIZE).fill(0).map((_, i) => (
            <div key={i} style={{
              width: CELL_SIZE, height: CELL_SIZE,
              border: '2px solid #30363d', borderRadius: 6,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              position: 'relative'
            }}>
              {/* 下标 */}
              <span style={{ position: 'absolute', bottom: -25, color: '#8b949e', fontSize: 12 }}>{i}</span>

              {/* 元素动画 */}
              <AnimatePresence>
                {arr[i] && (
                  <motion.div
                    key={arr[i].id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    style={{
                      width: '80%', height: '80%',
                      background: arr[i].type === 0 ? '#1f6feb' : '#d29922', // 蓝 vs 黄
                      borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 'bold'
                    }}
                  >
                    {arr[i].val}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* 指针动画：Top 0 */}
        <motion.div
          animate={{ x: (top0 * (CELL_SIZE + GAP)) - (MAX_SIZE * (CELL_SIZE + GAP) / 2) + 25 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ position: 'absolute', top: 15, left: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{ color: '#58a6ff', fontWeight: 'bold', marginBottom: 2 }}>top0</div>
          <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #58a6ff' }}></div>
        </motion.div>

        {/* 指针动画：Top 1 */}
        <motion.div
          animate={{ x: (top1 * (CELL_SIZE + GAP)) - (MAX_SIZE * (CELL_SIZE + GAP) / 2) + 25 }} // 稍微偏移对齐
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ position: 'absolute', top: 15, left: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{ color: '#d29922', fontWeight: 'bold', marginBottom: 2 }}>top1</div>
          <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #d29922' }}></div>
        </motion.div>

      </div>

      {/* 控制面板 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* 栈 0 控制区 */}
        <div style={{ border: '1px solid #1f6feb', borderRadius: 8, padding: 15, background: 'rgba(31, 111, 235, 0.1)' }}>
          <div style={{ color: '#58a6ff', fontWeight: 'bold', marginBottom: 10 }}>🟦 栈 0 (从左往右)</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text" value={val0} onChange={e => setVal0(e.target.value)} placeholder="输入值"
              style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #30363d', background: '#0d1117', color: '#fff', width: 80 }}
            />
            <button onClick={push0} style={btnStyle('#1f6feb')}>Push</button>
            <button onClick={pop0} style={btnStyle('#238636')}>Pop</button>
          </div>
        </div>

        {/* 栈 1 控制区 */}
        <div style={{ border: '1px solid #d29922', borderRadius: 8, padding: 15, background: 'rgba(210, 153, 34, 0.1)' }}>
          <div style={{ color: '#d29922', fontWeight: 'bold', marginBottom: 10, textAlign: 'right' }}>栈 1 (从右往左) 🟧</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={pop1} style={btnStyle('#238636')}>Pop</button>
            <button onClick={push1} style={btnStyle('#d29922')}>Push</button>
            <input
              type="text" value={val1} onChange={e => setVal1(e.target.value)} placeholder="输入值"
              style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #30363d', background: '#0d1117', color: '#fff', width: 80 }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

const btnStyle = (color) => ({
  padding: '6px 12px',
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: '0.2s'
});

export default SharedStackVisualizer;