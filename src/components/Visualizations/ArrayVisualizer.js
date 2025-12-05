import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ArrayVisualizer = () => {
  // 使用对象数组以获得唯一的 key，保证动画正确
  const [items, setItems] = useState([
    { id: 1, val: 10 },
    { id: 2, val: 20 },
    { id: 3, val: 30 }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [nextId, setNextId] = useState(4);

  // 尾部插入 (Push)
  const handlePush = () => {
    if (!inputValue) return;
    setItems([...items, { id: nextId, val: parseInt(inputValue) }]);
    setNextId(nextId + 1);
    setInputValue('');
  };

  // 头部插入 (Unshift - 模拟队列入队或链表头插)
  const handleUnshift = () => {
    if (!inputValue) return;
    setItems([{ id: nextId, val: parseInt(inputValue) }, ...items]);
    setNextId(nextId + 1);
    setInputValue('');
  };

  // 尾部删除 (Pop)
  const handlePop = () => {
    if (items.length === 0) return;
    const newItems = [...items];
    newItems.pop();
    setItems(newItems);
  };

  // 头部删除 (Shift)
  const handleShift = () => {
    if (items.length === 0) return;
    const newItems = [...items];
    newItems.shift();
    setItems(newItems);
  };

  return (
    <div style={{
      border: '1px solid #30363d',
      borderRadius: '12px',
      padding: '24px',
      background: '#161b22', // GitHub Dark 风格背景
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      margin: '20px 0'
    }}>
      <h3 style={{marginTop:0, color: '#fff'}}>数组/线性表 动态演示</h3>

      {/* 控制面板 */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Value"
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #555', background: '#0d1117', color: '#fff' }}
        />
        <button onClick={handlePush} style={btnStyle('#238636')}>Push (尾增)</button>
        <button onClick={handleUnshift} style={btnStyle('#1f6feb')}>Unshift (头增)</button>
        <button onClick={handlePop} style={btnStyle('#da3633')}>Pop (尾删)</button>
        <button onClick={handleShift} style={btnStyle('#9e6a03')}>Shift (头删)</button>
      </div>

      {/* 可视化区域 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        minHeight: '80px',
        alignItems: 'center',
        overflowX: 'auto',
        padding: '10px 0'
      }}>
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              layout // 开启布局动画，让元素自动平滑移动
              key={item.id} // 必须使用唯一的 ID
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                minWidth: '60px',
                height: '60px',
                background: 'linear-gradient(145deg, #1f6feb, #0a4f9e)',
                color: 'white',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
              }}
            >
              <span style={{fontWeight: 'bold', fontSize: '18px'}}>{item.val}</span>
              <span style={{fontSize: '10px', opacity: 0.7, position: 'absolute', bottom: '2px'}}>idx:{index}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {items.length === 0 && <div style={{color: '#8b949e', textAlign: 'center'}}>List is Empty</div>}
    </div>
  );
};

const btnStyle = (bgColor) => ({
  padding: '8px 16px',
  backgroundColor: bgColor,
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
});

export default ArrayVisualizer;