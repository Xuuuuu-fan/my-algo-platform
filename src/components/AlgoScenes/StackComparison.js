import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_SIZE = 6; // 顺序栈的最大容量

const StackComparison = () => {
  // --- 状态定义 ---
  // 顺序栈：使用数组，关注 top 下标
  const [seqStack, setSeqStack] = useState([]);

  // 链栈：使用对象数组模拟节点，关注指针
  // 结构: { id, val, address, nextAddr }
  const [linkStack, setLinkStack] = useState([]);

  const [inputValue, setInputValue] = useState('');
  const [msg, setMsg] = useState({ text: '准备就绪', type: 'info' });

  // --- 操作逻辑 ---

  const handlePush = () => {
    if (!inputValue.trim()) return;
    const val = inputValue.trim();

    // 1. 检查顺序栈是否满
    if (seqStack.length >= MAX_SIZE) {
      setMsg({ text: '❌ 顺序栈已满 (Overflow)，但链栈仍可扩容！', type: 'error' });
      // 这里为了对比，即使顺序栈满了，我们也允许链栈继续 Push，体现链栈优势
      pushToLinkStack(val);
      return;
    }

    // 同时入栈
    pushToSeqStack(val);
    pushToLinkStack(val);
    setMsg({ text: `元素 ${val} 入栈成功`, type: 'success' });
    setInputValue('');
  };

  const handlePop = () => {
    let sEmpty = seqStack.length === 0;
    let lEmpty = linkStack.length === 0;

    if (sEmpty && lEmpty) {
      setMsg({ text: '⚠️ 两个栈都空了 (Underflow)', type: 'warning' });
      return;
    }

    popFromSeqStack();
    popFromLinkStack();
    setMsg({ text: '元素出栈', type: 'info' });
  };

  // 顺序栈 Push
  const pushToSeqStack = (val) => {
    setSeqStack(prev => [...prev, { val, id: Date.now() }]);
  };

  // 链栈 Push (头插法)
  const pushToLinkStack = (val) => {
    const mockAddr = `0x${Math.floor(Math.random()*1000 + 1000).toString(16).toUpperCase()}`;
    const newNode = { val, id: Date.now() + 1, addr: mockAddr };
    setLinkStack(prev => [newNode, ...prev]); // 放在数组最前面模拟栈顶
  };

  // 顺序栈 Pop
  const popFromSeqStack = () => {
    setSeqStack(prev => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  };

  // 链栈 Pop
  const popFromLinkStack = () => {
    setLinkStack(prev => {
      if (prev.length === 0) return prev;
      return prev.slice(1);
    });
  };

  return (
    <div style={{ border: '1px solid #30363d', borderRadius: 8, padding: 20, background: '#0d1117' }}>

      {/* 顶部控制栏 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, justifyContent: 'center', alignItems: 'center' }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入元素"
          style={{ padding: '8px', borderRadius: 4, border: '1px solid #30363d', background: '#161b22', color: '#fff' }}
        />
        <button onClick={handlePush} style={btnStyle('#238636')}>Push (入栈)</button>
        <button onClick={handlePop} style={btnStyle('#da3633')}>Pop (出栈)</button>
      </div>
      <div style={{textAlign:'center', color: msg.type==='error'?'#ff4d4f':'#8b949e', fontSize: 13, marginBottom: 30}}>
        {msg.text}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* 左侧：顺序栈 */}
        <div style={{ border: '1px solid #1f6feb', borderRadius: 8, padding: 15, background: 'rgba(31, 111, 235, 0.05)' }}>
          <h4 style={{ color: '#58a6ff', margin: '0 0 15px 0', borderBottom: '1px solid #1f6feb', paddingBottom: 5 }}>
            顺序栈 (Array Stack)
          </h4>
          <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 10 }}>
            • 内存连续<br/>• 容量固定 (Max={MAX_SIZE})<br/>• 依靠 top 下标
          </div>

          {/* 顺序栈可视化容器 */}
          <div style={{ display: 'flex', flexDirection: 'column-reverse', height: 250, width: 80, margin: '0 auto', border: '2px solid #30363d', borderTop: 'none', position: 'relative' }}>
            {/* 栈底到底部 */}
            <AnimatePresence>
              {seqStack.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{
                    height: 40, width: '100%',
                    background: '#1f6feb', borderBottom: '1px solid #0d1117',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 'bold', fontSize: 14,
                    position: 'relative'
                  }}
                >
                  {item.val}
                  {/* 下标 */}
                  <span style={{ position: 'absolute', right: -25, color: '#8b949e', fontSize: 10 }}>[{index}]</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Top 指针 */}
            <motion.div
              animate={{ y: -(seqStack.length * 40) }}
              transition={{ type: 'spring' }}
              style={{ position: 'absolute', bottom: 0, left: -45, display: 'flex', alignItems: 'center' }}
            >
              <span style={{ color: '#e0a612', fontWeight: 'bold', marginRight: 5 }}>Top</span>
              <span style={{ color: '#e0a612' }}>➜</span>
            </motion.div>
          </div>
        </div>

        {/* 右侧：链栈 */}
        <div style={{ border: '1px solid #a371f7', borderRadius: 8, padding: 15, background: 'rgba(163, 113, 247, 0.05)' }}>
          <h4 style={{ color: '#d2a8ff', margin: '0 0 15px 0', borderBottom: '1px solid #a371f7', paddingBottom: 5 }}>
            链栈 (Linked Stack)
          </h4>
          <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 10 }}>
            • 内存离散 (随机地址)<br/>• 理论无上限<br/>• 依靠 next 指针
          </div>

          {/* 链栈可视化容器 */}
          <div style={{ position: 'relative', minHeight: 250, padding: '10px 0' }}>
            <AnimatePresence>
              {linkStack.map((item, index) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  style={{
                    display: 'flex', alignItems: 'center', marginBottom: 15,
                    position: 'relative'
                  }}
                >
                  {/* 节点本体 */}
                  <div style={{
                    width: 140, padding: '8px',
                    border: '1px solid #d2a8ff', borderRadius: 6,
                    background: '#0d1117', display: 'flex', flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #30363d', paddingBottom: 4, marginBottom: 4 }}>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{item.val}</span>
                      <span style={{ color: '#8b949e', fontSize: 10 }}>Addr: {item.addr}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#8b949e' }}>
                      next: {index < linkStack.length - 1 ? linkStack[index+1].addr : 'NULL'}
                    </div>
                  </div>

                  {/* 箭头连接 */}
                  {index < linkStack.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 70, top: 45,
                      width: 2, height: 15, background: '#d2a8ff'
                    }}>
                      <div style={{ position: 'absolute', bottom: 0, left: -2, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderTop: '4px solid #d2a8ff' }}></div>
                    </div>
                  )}

                  {/* Top 标记 */}
                  {index === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ position: 'absolute', left: -40, color: '#e0a612', fontWeight: 'bold' }}
                    >
                      Top ➜
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {linkStack.length === 0 && (
              <div style={{ color: '#8b949e', textAlign: 'center', marginTop: 50 }}>NULL (栈空)</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const btnStyle = (bg) => ({
  padding: '8px 16px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: '0.2s'
});

export default StackComparison;