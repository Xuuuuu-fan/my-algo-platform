import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 深色主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  nodeBg: '#1f6feb',
  text: '#c9d1d9',
  frontColor: '#2ea043', // 绿色代表前端操作
  rearColor: '#d29922',  // 橙色代表后端操作
};

const DequeVisualizer = () => {
  // 数据结构: { id, val }
  const [deque, setDeque] = useState([
    { id: 1, val: 10 },
    { id: 2, val: 20 },
    { id: 3, val: 30 }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [nextId, setNextId] = useState(4);
  const [msg, setMsg] = useState('双端队列就绪');

  // ================== 操作逻辑 ==================

  // 1. 前端入队 (Push Front)
  const pushFront = () => {
    if (!inputValue) return setMsg('⚠️ 请输入数值');
    if (deque.length >= 8) return setMsg('⚠️ 队列已满');

    const newItem = { id: nextId, val: inputValue, from: 'front' };
    setDeque([newItem, ...deque]); // 插入头部
    setNextId(nextId + 1);
    setInputValue('');
    setMsg(`⬅️ 元素 ${inputValue} 从前端入队`);
  };

  // 2. 后端入队 (Push Rear)
  const pushRear = () => {
    if (!inputValue) return setMsg('⚠️ 请输入数值');
    if (deque.length >= 8) return setMsg('⚠️ 队列已满');

    const newItem = { id: nextId, val: inputValue, from: 'rear' };
    setDeque([...deque, newItem]); // 插入尾部
    setNextId(nextId + 1);
    setInputValue('');
    setMsg(`➡️ 元素 ${inputValue} 从后端入队`);
  };

  // 3. 前端出队 (Pop Front)
  const popFront = () => {
    if (deque.length === 0) return setMsg('⚠️ 队列为空');
    const item = deque[0];
    setDeque(deque.slice(1));
    setMsg(`⬅️ 前端元素 ${item.val} 出队`);
  };

  // 4. 后端出队 (Pop Rear)
  const popRear = () => {
    if (deque.length === 0) return setMsg('⚠️ 队列为空');
    const item = deque[deque.length - 1];
    setDeque(deque.slice(0, -1));
    setMsg(`➡️ 后端元素 ${item.val} 出队`);
  };

  const clear = () => {
    setDeque([]);
    setMsg('🗑️ 清空队列');
  };

  return (
    <div style={{
      border: `1px solid ${THEME.border}`, borderRadius: 8, background: THEME.panel,
      padding: 20, margin: '20px 0', fontFamily: 'sans-serif'
    }}>

      {/* 头部状态 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, borderBottom: `1px solid ${THEME.border}`, paddingBottom: 10 }}>
        <h3 style={{ margin: 0, color: THEME.text }}>双端队列 (Deque)</h3>
        <span style={{ fontSize: 14, color: '#8b949e' }}>{msg}</span>
      </div>

      {/* 控制面板 */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 30, flexWrap: 'wrap' }}>

        {/* 左侧：前端操作组 */}
        <div style={groupStyle(THEME.frontColor)}>
          <span style={{fontSize:12, fontWeight:'bold', color:THEME.frontColor, marginBottom:4}}>Front End</span>
          <div style={{display:'flex', gap:8}}>
            <button onClick={pushFront} style={btnStyle(THEME.frontColor)}>入队 (Push)</button>
            <button onClick={popFront} style={outlineBtnStyle(THEME.frontColor)}>出队 (Pop)</button>
          </div>
        </div>

        {/* 中间：输入框 */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
          <input
            value={inputValue} onChange={e => setInputValue(e.target.value)}
            placeholder="Value"
            style={{
              padding: '8px', borderRadius: 4, border: '1px solid #555',
              background: THEME.bg, color: '#fff', width: 80, textAlign: 'center'
            }}
            onKeyDown={e => {
                if (e.key === 'Enter') pushRear(); // 默认回车往后加
            }}
          />
          <button onClick={clear} style={{ fontSize:12, background:'transparent', border:'none', color:'#8b949e', cursor:'pointer' }}>清空</button>
        </div>

        {/* 右侧：后端操作组 */}
        <div style={groupStyle(THEME.rearColor)}>
          <span style={{fontSize:12, fontWeight:'bold', color:THEME.rearColor, marginBottom:4}}>Rear End</span>
          <div style={{display:'flex', gap:8}}>
            <button onClick={pushRear} style={btnStyle(THEME.rearColor)}>入队 (Push)</button>
            <button onClick={popRear} style={outlineBtnStyle(THEME.rearColor)}>出队 (Pop)</button>
          </div>
        </div>

      </div>

      {/* 可视化区域 */}
      <div style={{
        background: THEME.bg, borderRadius: 8, minHeight: 120,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', position: 'relative', overflow: 'hidden'
      }}>
        {/* 轨道线 */}
        <div style={{ position: 'absolute', height: 2, background: '#30363d', width: '90%', zIndex: 0 }} />

        <div style={{ display: 'flex', gap: 12, zIndex: 1 }}>
          <AnimatePresence mode='popLayout'>
            {deque.map((item, index) => {
              const isFront = index === 0;
              const isRear = index === deque.length - 1;

              return (
                <motion.div
                  layout
                  key={item.id}
                  // 根据数据来源决定动画方向
                  initial={{
                    opacity: 0,
                    x: item.from === 'front' ? -50 : 50,
                    y: 0
                  }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: 50, // 统一向下消失
                    scale: 0.5
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  style={{
                    width: 50, height: 50, borderRadius: 8,
                    background: THEME.nodeBg, color: '#fff', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', border: '2px solid transparent',
                    borderColor: isFront ? THEME.frontColor : (isRear ? THEME.rearColor : 'transparent')
                  }}
                >
                  {item.val}

                  {/* 指针标记 */}
                  {isFront && (
                    <motion.div layoutId="ptr-front" style={{...ptrStyle, top: -25, color: THEME.frontColor}}>
                      Front
                    </motion.div>
                  )}
                  {isRear && (
                    <motion.div layoutId="ptr-rear" style={{...ptrStyle, bottom: -25, color: THEME.rearColor}}>
                      Rear
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {deque.length === 0 && <div style={{color:'#8b949e', fontStyle:'italic'}}>Deque is Empty</div>}
        </div>
      </div>
    </div>
  );
};

// ================== 样式 ==================
const groupStyle = (borderColor) => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '10px', border: `1px solid ${borderColor}40`, borderRadius: 8, background: `${borderColor}10`
});

const btnStyle = (bg) => ({
  padding: '6px 12px', border: 'none', borderRadius: 4, background: bg, color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 12
});

const outlineBtnStyle = (color) => ({
  padding: '5px 11px', border: `1px solid ${color}`, borderRadius: 4, background: 'transparent', color: color, cursor: 'pointer', fontWeight: 'bold', fontSize: 12
});

const ptrStyle = {
  position: 'absolute', fontSize: 10, fontWeight: 'bold', whiteSpace: 'nowrap'
};

export default DequeVisualizer;