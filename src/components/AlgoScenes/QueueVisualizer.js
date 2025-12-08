import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 样式配置
const COLORS = {
  bg: '#0d1117',
  nodeBg: '#1f6feb',
  nodeText: '#ffffff',
  highlight: '#e0a612', // 高亮色
  front: '#2ea043',     // 队头颜色
  rear: '#f78166',      // 队尾颜色
  border: '#30363d'
};

const QueueVisualizer = () => {
  // 队列数据状态：每个元素包含 { id, val }
  // id 用于 framer-motion 识别唯一性，val 是显示的值
  const [queue, setQueue] = useState([
    { id: 1, val: 10 },
    { id: 2, val: 20 },
    { id: 3, val: 30 }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [nextId, setNextId] = useState(4); // 用于生成唯一ID
  const [peekIndex, setPeekIndex] = useState(null); // 控制 Peek 高亮
  const [message, setMessage] = useState('就绪');

  // --- 操作逻辑 ---

  // 1. 入队 (Enqueue)
  const handleEnqueue = () => {
    if (!inputValue) {
      setMessage('⚠️ 请输入数值');
      return;
    }
    if (queue.length >= 8) {
      setMessage('⚠️ 队列已满 (演示限制 8 个)');
      return;
    }

    const newItem = { id: nextId, val: inputValue };
    setQueue([...queue, newItem]);
    setNextId(nextId + 1);
    setInputValue('');
    setMessage(`✅ 元素 ${inputValue} 入队`);
    setPeekIndex(null);
  };

  // 2. 出队 (Dequeue)
  const handleDequeue = () => {
    if (queue.length === 0) {
      setMessage('⚠️ 队列为空，无法出队');
      return;
    }

    const removedItem = queue[0];
    const newQueue = queue.slice(1);
    setQueue(newQueue);
    setMessage(`📤 元素 ${removedItem.val} 出队`);
    setPeekIndex(null);
  };

  // 3. 查看队头 (Peek)
  const handlePeek = () => {
    if (queue.length === 0) {
      setMessage('⚠️ 队列为空');
      return;
    }
    setPeekIndex(0); // 标记索引 0 高亮
    setMessage(`👀 队头元素是: ${queue[0].val}`);

    // 1秒后取消高亮
    setTimeout(() => setPeekIndex(null), 1000);
  };

  // 4. 清空
  const handleClear = () => {
    setQueue([]);
    setMessage('🗑️ 队列已清空');
  };

  return (
    <div style={{
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      background: '#161b22',
      padding: '20px',
      margin: '20px 0',
      fontFamily: 'sans-serif'
    }}>

      {/* 标题与状态栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#c9d1d9' }}>队列 (First In First Out)</h3>
        <span style={{ fontSize: '14px', color: '#8b949e' }}>{message}</span>
      </div>

      {/* 控件区域 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入值"
          style={{
            padding: '6px 12px', borderRadius: '6px', border: `1px solid ${COLORS.border}`,
            background: '#0d1117', color: 'white', width: '80px'
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleEnqueue()}
        />
        <button onClick={handleEnqueue} style={btnStyle(COLORS.nodeBg)}>入队 (Push)</button>
        <button onClick={handleDequeue} style={btnStyle(COLORS.rear)}>出队 (Pop)</button>
        <button onClick={handlePeek} style={btnStyle(COLORS.front)}>取队头 (Peek)</button>
        <button onClick={handleClear} style={btnStyle(COLORS.border)}>清空</button>
      </div>

      {/* 可视化区域 */}
      <div style={{
        position: 'relative',
        minHeight: '120px',
        background: '#0d1117',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px', // 留出进出空间
        overflow: 'hidden'
      }}>

        {/* 管道背景装饰 (可选) */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: '#30363d', zIndex: 0 }} />

        {/* 队列容器 */}
        <div style={{ display: 'flex', gap: '15px', zIndex: 1, margin: '0 auto' }}>
          <AnimatePresence mode='popLayout'>
            {queue.map((item, index) => {
              const isFront = index === 0;
              const isRear = index === queue.length - 1;
              const isPeek = index === peekIndex;

              return (
                <motion.div
                  layout // 启用布局动画，出队时后面的元素会自动补位
                  key={item.id}
                  initial={{ opacity: 0, x: 50, scale: 0.5 }} // 从右侧飞入
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: isPeek ? 1.2 : 1, // Peek 时放大
                    backgroundColor: isPeek ? COLORS.highlight : COLORS.nodeBg,
                    boxShadow: isPeek ? `0 0 15px ${COLORS.highlight}` : 'none'
                  }}
                  exit={{ opacity: 0, y: 50, scale: 0 }} // 向下消失
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: COLORS.nodeText,
                    fontWeight: 'bold',
                    position: 'relative',
                    cursor: 'default',
                    border: isFront ? `2px solid ${COLORS.front}` : (isRear ? `2px solid ${COLORS.rear}` : 'none')
                  }}
                >
                  {item.val}

                  {/* 下标 */}
                  <span style={{ position: 'absolute', bottom: '-20px', fontSize: '10px', color: '#8b949e' }}>
                    {index}
                  </span>

                  {/* 队头指针 */}
                  {isFront && (
                    <motion.div
                      layoutId="front-ptr"
                      style={{ position: 'absolute', top: '-25px', color: COLORS.front, fontSize: '12px', fontWeight: 'bold' }}
                    >
                      Front ↓
                    </motion.div>
                  )}

                  {/* 队尾指针 */}
                  {isRear && (
                    <motion.div
                      layoutId="rear-ptr"
                      style={{ position: 'absolute', bottom: '-40px', color: COLORS.rear, fontSize: '12px', fontWeight: 'bold' }}
                    >
                      ↑ Rear
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {queue.length === 0 && (
            <div style={{ color: '#8b949e', fontStyle: 'italic' }}>Queue is Empty</div>
          )}
        </div>
      </div>
    </div>
  );
};

// 简单的按钮样式
const btnStyle = (bg) => ({
  padding: '6px 12px',
  borderRadius: '6px',
  border: 'none',
  background: bg,
  color: 'white',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'opacity 0.2s',
  opacity: 0.9
});

export default QueueVisualizer;