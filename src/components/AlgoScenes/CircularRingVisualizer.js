import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 配置 ==================
const MAX_SIZE = 8;
const RADIUS = 100; // 圆环半径
const CENTER = 150; // 中心坐标 (150, 150)

const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  accent: '#58a6ff',
  success: '#2ea043', // Green
  danger: '#da3633',  // Red
  warning: '#d29922', // Orange
  text: '#c9d1d9',
  emptySlot: '#21262d'
};

// 模式定义 (逻辑与之前保持一致)
const MODES = {
  sacrifice: { name: '牺牲空间法', fullCond: '(rear + 1) % N == front', emptyCond: 'front == rear' },
  tag: { name: 'Tag 标记法', fullCond: 'front==rear && tag==1', emptyCond: 'front==rear && tag==0' },
  size: { name: 'Size 计数法', fullCond: 'size == N', emptyCond: 'size == 0' }
};

// 辅助：计算圆周上的坐标
const getPosition = (index, offsetRadius = 0) => {
  const angle = (index * (360 / MAX_SIZE)) - 90; // -90度让 0 在正上方
  const radian = (angle * Math.PI) / 180;
  const r = RADIUS + offsetRadius;
  return {
    x: CENTER + r * Math.cos(radian),
    y: CENTER + r * Math.sin(radian),
    rotate: angle
  };
};

const CircularQueueRing = () => {
  const [activeMode, setActiveMode] = useState('sacrifice');

  // 核心数据
  const [queue, setQueue] = useState(Array(MAX_SIZE).fill(null));
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(0);
  const [tag, setTag] = useState(0);
  const [size, setSize] = useState(0);

  const [inputValue, setInputValue] = useState('');
  const [msg, setMsg] = useState('循环队列就绪');

  // 重置
  const changeMode = (mode) => {
    setActiveMode(mode);
    setQueue(Array(MAX_SIZE).fill(null));
    setFront(0); setRear(0); setTag(0); setSize(0);
    setMsg('队列已重置');
  };

  // 入队
  const handleEnqueue = () => {
    if (!inputValue) return setMsg('⚠️ 请输入数值');

    let isFull = false;
    if (activeMode === 'sacrifice' && (rear + 1) % MAX_SIZE === front) isFull = true;
    if (activeMode === 'tag' && front === rear && tag === 1) isFull = true;
    if (activeMode === 'size' && size === MAX_SIZE) isFull = true;

    if (isFull) return setMsg(`❌ 队列已满`);

    const newQ = [...queue];
    newQ[rear] = inputValue;
    setQueue(newQ);
    setRear((rear + 1) % MAX_SIZE);
    if (activeMode === 'tag') setTag(1);
    if (activeMode === 'size') setSize(size + 1);
    setMsg(`✅ 入队: ${inputValue}`);
    setInputValue('');
  };

  // 出队
  const handleDequeue = () => {
    let isEmpty = false;
    if (activeMode === 'sacrifice' && front === rear) isEmpty = true;
    if (activeMode === 'tag' && front === rear && tag === 0) isEmpty = true;
    if (activeMode === 'size' && size === 0) isEmpty = true;

    if (isEmpty) return setMsg(`⚠️ 队列已空`);

    const val = queue[front];
    const newQ = [...queue];
    newQ[front] = null;
    setQueue(newQ);
    setFront((front + 1) % MAX_SIZE);
    if (activeMode === 'tag') setTag(0);
    if (activeMode === 'size') setSize(size - 1);
    setMsg(`📤 出队: ${val}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'sans-serif' }}>

      {/* 顶部控制 */}
      <div style={{ background: THEME.panel, padding: 12, borderRadius: 8, border: `1px solid ${THEME.border}`, display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#0d1117', padding: 3, borderRadius: 6, border: `1px solid ${THEME.border}` }}>
          {Object.keys(MODES).map(key => (
            <button key={key} onClick={() => changeMode(key)}
              style={{ padding: '6px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', background: activeMode === key ? '#1f6feb' : 'transparent', color: activeMode === key ? '#fff' : '#8b949e', fontWeight: activeMode === key ? 'bold' : 'normal' }}>
              {MODES[key].name}
            </button>
          ))}
        </div>
        <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Val" style={{ padding: '6px', borderRadius: 4, border: '1px solid #555', background: '#0d1117', color: 'white', width: 60, textAlign: 'center' }} />
        <button onClick={handleEnqueue} style={{...btnStyle, background: THEME.success}}>入队</button>
        <button onClick={handleDequeue} style={{...btnStyle, background: THEME.danger}}>出队</button>
        <span style={{ fontSize: 13, color: THEME.text }}>{msg}</span>
      </div>

      {/* 核心可视化区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20 }}>

        {/* 左侧：圆环图 */}
        <div style={{ background: '#0d1117', height: 320, position: 'relative', overflow: 'hidden', borderRadius: 12, border: `1px solid ${THEME.border}` }}>

          {/* 1. 绘制轨道虚线 */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: RADIUS * 2, height: RADIUS * 2, border: `2px dashed ${THEME.border}`, borderRadius: '50%' }} />

          {/* 2. 绘制格子 */}
          {queue.map((val, i) => {
            const pos = getPosition(i);
            // 牺牲空间法的高亮
            const isSacrificed = activeMode === 'sacrifice' && (rear + 1) % MAX_SIZE === front && i === rear;

            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{
                  position: 'absolute', left: pos.x, top: pos.y,
                  width: 40, height: 40, marginLeft: -20, marginTop: -20,
                  borderRadius: 8,
                  background: isSacrificed ? 'rgba(218, 54, 51, 0.2)' : (val ? '#1f6feb' : THEME.emptySlot),
                  border: isSacrificed ? `1px solid ${THEME.danger}` : `1px solid ${val ? '#58a6ff' : '#30363d'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isSacrificed ? THEME.danger : '#fff', fontWeight: 'bold', zIndex: 1
                }}
              >
                {isSacrificed ? 'X' : val}
                {/* 索引号 */}
                <span style={{ position: 'absolute', fontSize: 10, color: '#666', transform: `translate(${pos.x - 150 > 0 ? 30 : -30}px, ${pos.y - 150 > 0 ? 30 : -30}px)` }}>{i}</span>
              </motion.div>
            );
          })}

          {/* 3. Front 指针 (在圆内侧，绿色) */}
          <motion.div
            animate={getPosition(front, -50)} // 半径减小，在内侧
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            style={{ position: 'absolute', marginLeft: -20, marginTop: -15, width: 40, height: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}
          >
            <div style={{ color: THEME.success, fontSize: 12, fontWeight: 'bold' }}>Front</div>
            <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: `8px solid ${THEME.success}` }} />
          </motion.div>

          {/* 4. Rear 指针 (在圆外侧，红色) */}
          <motion.div
            animate={getPosition(rear, 50)} // 半径增加，在外侧
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            style={{ position: 'absolute', marginLeft: -20, marginTop: -15, width: 40, height: 30, display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', zIndex: 2 }}
          >
            <div style={{ color: THEME.danger, fontSize: 12, fontWeight: 'bold' }}>Rear</div>
            <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `8px solid ${THEME.danger}` }} />
          </motion.div>

          {/* 中心说明 */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#8b949e', fontSize: 12 }}>
            <div>MaxSize = {MAX_SIZE}</div>
            <div style={{marginTop:4}}>顺时针增长 ↻</div>
          </div>

        </div>

        {/* 右侧：状态面板 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: THEME.panel, padding: 15, borderRadius: 8, border: `1px solid ${THEME.border}` }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: THEME.text }}>当前状态</h4>
            <InfoRow label="Front" val={front} color={THEME.success} />
            <InfoRow label="Rear" val={rear} color={THEME.danger} />

            {activeMode === 'tag' && <InfoRow label="Tag" val={tag} color={THEME.warning} />}
            {activeMode === 'size' && <InfoRow label="Size" val={`${size} / ${MAX_SIZE}`} color={THEME.warning} />}
          </div>

          <div style={{ background: '#161b22', padding: 12, borderRadius: 8, borderLeft: `3px solid ${THEME.accent}`, fontSize: 12, color: '#8b949e', lineHeight: 1.6 }}>
            <div style={{color: THEME.text, fontWeight:'bold', marginBottom:4}}>{MODES[activeMode].name}</div>
            <div>满: <code style={codeStyle}>{MODES[activeMode].fullCond}</code></div>
            <div>空: <code style={codeStyle}>{MODES[activeMode].emptyCond}</code></div>
          </div>
        </div>

      </div>
    </div>
  );
};

const InfoRow = ({ label, val, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
    <span style={{ color: '#8b949e' }}>{label}:</span>
    <span style={{ color: color, fontWeight: 'bold' }}>{val}</span>
  </div>
);

const btnStyle = { padding: '6px 12px', border: 'none', borderRadius: 4, color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 12 };
const codeStyle = { background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 3, color: '#c9d1d9', fontFamily: 'monospace' };

export default CircularQueueRing;