import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 配置 ==================
const MAX_SIZE = 8; // 物理数组长度
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  accent: '#58a6ff',
  success: '#2ea043',
  danger: '#da3633',
  warning: '#d29922',
  text: '#c9d1d9',
  codeBg: '#0d1117'
};

// ================== 核心逻辑配置 ==================
const MODES = {
  sacrifice: {
    name: '方法1: 牺牲一个空间',
    desc: '最经典的方法。约定 rear 指向的下一个位置是 front 时为满。实际容量 = MaxSize - 1。',
    fullCond: '(rear + 1) % N == front',
    emptyCond: 'front == rear'
  },
  tag: {
    name: '方法2: 增加 tag 标记',
    desc: '不牺牲空间。利用 tag 标记最近一次操作是入队(1)还是出队(0)。',
    fullCond: 'front == rear && tag == 1',
    emptyCond: 'front == rear && tag == 0'
  },
  size: {
    name: '方法3: 增加 size 计数器',
    desc: '最直观的方法。直接维护一个变量 size 记录当前元素个数。',
    fullCond: 'size == N',
    emptyCond: 'size == 0'
  }
};

const CircularQueueVariants = () => {
  const [activeMode, setActiveMode] = useState('sacrifice');

  // 数据状态
  const [queue, setQueue] = useState(Array(MAX_SIZE).fill(null));
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(0);
  const [tag, setTag] = useState(0); // 0: 最近出队, 1: 最近入队
  const [size, setSize] = useState(0); // 元素个数

  const [inputValue, setInputValue] = useState('');
  const [msg, setMsg] = useState('队列已初始化');

  // 切换模式重置
  const changeMode = (mode) => {
    setActiveMode(mode);
    setQueue(Array(MAX_SIZE).fill(null));
    setFront(0);
    setRear(0);
    setTag(0);
    setSize(0);
    setMsg('队列已重置');
  };

  // --- 入队逻辑 ---
  const handleEnqueue = () => {
    if (!inputValue) return setMsg('⚠️ 请输入数值');

    let isFull = false;

    // 1. 判满逻辑
    if (activeMode === 'sacrifice') {
      if ((rear + 1) % MAX_SIZE === front) isFull = true;
    } else if (activeMode === 'tag') {
      if (front === rear && tag === 1) isFull = true;
    } else if (activeMode === 'size') {
      if (size === MAX_SIZE) isFull = true;
    }

    if (isFull) {
      setMsg(`❌ 队列已满 (${MODES[activeMode].fullCond})`);
      return;
    }

    // 2. 执行入队
    const newQueue = [...queue];
    newQueue[rear] = inputValue;
    setQueue(newQueue);

    // 3. 更新状态
    setRear((rear + 1) % MAX_SIZE);

    if (activeMode === 'tag') setTag(1); // 标记最近是入队
    if (activeMode === 'size') setSize(size + 1);

    setMsg(`✅ 入队成功: ${inputValue}`);
    setInputValue('');
  };

  // --- 出队逻辑 ---
  const handleDequeue = () => {
    let isEmpty = false;

    // 1. 判空逻辑
    if (activeMode === 'sacrifice') {
      if (front === rear) isEmpty = true;
    } else if (activeMode === 'tag') {
      if (front === rear && tag === 0) isEmpty = true;
    } else if (activeMode === 'size') {
      if (size === 0) isEmpty = true;
    }

    if (isEmpty) {
      setMsg(`⚠️ 队列已空 (${MODES[activeMode].emptyCond})`);
      return;
    }

    // 2. 执行出队
    const val = queue[front];
    const newQueue = [...queue];
    newQueue[front] = null;
    setQueue(newQueue);

    // 3. 更新状态
    setFront((front + 1) % MAX_SIZE);

    if (activeMode === 'tag') setTag(0); // 标记最近是出队
    if (activeMode === 'size') setSize(size - 1);

    setMsg(`📤 出队成功: ${val}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'sans-serif' }}>

      {/* 顶部 Tab */}
      <div style={{ display: 'flex', background: THEME.panel, borderRadius: 8, padding: 4, border: `1px solid ${THEME.border}` }}>
        {Object.keys(MODES).map(key => (
          <button
            key={key}
            onClick={() => changeMode(key)}
            style={{
              flex: 1, padding: '8px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13,
              background: activeMode === key ? '#1f6feb' : 'transparent',
              color: activeMode === key ? '#fff' : '#8b949e',
              fontWeight: activeMode === key ? 'bold' : 'normal',
              transition: '0.2s'
            }}
          >
            {MODES[key].name}
          </button>
        ))}
      </div>

      {/* 描述区 */}
      <div style={{ background: '#161b22', padding: 12, borderRadius: 8, borderLeft: `4px solid ${THEME.accent}`, fontSize: 13, color: '#c9d1d9', lineHeight: 1.5 }}>
        <div>📝 <b>核心原理：</b> {MODES[activeMode].desc}</div>
        <div style={{marginTop: 5, fontFamily: 'monospace', color: THEME.success}}>
          判空: {MODES[activeMode].emptyCond}
        </div>
        <div style={{marginTop: 2, fontFamily: 'monospace', color: THEME.danger}}>
          判满: {MODES[activeMode].fullCond}
        </div>
      </div>

      {/* 可视化主体 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20 }}>

        {/* 左侧：循环队列图示 */}
        <div style={{
          background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8,
          padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* 环形展示 (用 flex wrap 模拟) */}
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: 220, justifyContent: 'center' }}>
            {queue.map((val, idx) => {
              const isFront = idx === front;
              const isRear = idx === rear;
              // 牺牲空间法: rear指向的位置如果是front的前一个，则是"牺牲位"
              const isSacrificed = activeMode === 'sacrifice' && (rear + 1) % MAX_SIZE === front && idx === rear;

              return (
                <div key={idx} style={{ position: 'relative', width: 50, height: 50, margin: 2 }}>
                  <motion.div
                    animate={{
                      backgroundColor: val ? 'rgba(31, 111, 235, 0.2)' : 'transparent',
                      borderColor: isSacrificed ? THEME.danger : THEME.border,
                      scale: (isFront || isRear) ? 1.05 : 1
                    }}
                    style={{
                      width: '100%', height: '100%', border: '2px solid', borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: val ? '#fff' : '#444', fontWeight: 'bold'
                    }}
                  >
                    {val}
                    {isSacrificed && <span style={{fontSize: 8, color: THEME.danger}}>✕</span>}
                  </motion.div>

                  {/* 索引 */}
                  <div style={{ position: 'absolute', top: 2, left: 4, fontSize: 9, color: '#666' }}>{idx}</div>

                  {/* 指针 */}
                  {isFront && (
                    <motion.div layoutId="ptr-f" style={{ position: 'absolute', top: -20, left: 0, width: '100%', textAlign: 'center', color: THEME.success, fontSize: 12, fontWeight: 'bold' }}>
                      F
                    </motion.div>
                  )}
                  {isRear && (
                    <motion.div layoutId="ptr-r" style={{ position: 'absolute', bottom: -20, left: 0, width: '100%', textAlign: 'center', color: THEME.danger, fontSize: 12, fontWeight: 'bold' }}>
                      R
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：状态面板 & 控制 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

          {/* 变量监控面板 */}
          <div style={{ background: THEME.panel, padding: 15, borderRadius: 8, border: `1px solid ${THEME.border}` }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#8b949e' }}>变量监控</h4>
            <div style={varRowStyle}>
              <span>Front:</span> <span style={{color: THEME.success}}>{front}</span>
            </div>
            <div style={varRowStyle}>
              <span>Rear:</span> <span style={{color: THEME.danger}}>{rear}</span>
            </div>

            {/* 特殊变量高亮 */}
            {activeMode === 'tag' && (
              <motion.div
                key="tag" initial={{scale:0}} animate={{scale:1}}
                style={{...varRowStyle, background: 'rgba(210, 153, 34, 0.1)', padding: '4px 8px', borderRadius: 4, marginTop: 5}}
              >
                <span>Tag:</span> <span style={{color: THEME.warning, fontWeight:'bold'}}>{tag}</span>
              </motion.div>
            )}

            {activeMode === 'size' && (
              <motion.div
                key="size" initial={{scale:0}} animate={{scale:1}}
                style={{...varRowStyle, background: 'rgba(210, 153, 34, 0.1)', padding: '4px 8px', borderRadius: 4, marginTop: 5}}
              >
                <span>Size:</span> <span style={{color: THEME.warning, fontWeight:'bold'}}>{size} / {MAX_SIZE}</span>
              </motion.div>
            )}
          </div>

          {/* 控制区 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={inputValue} onChange={e => setInputValue(e.target.value)}
              placeholder="Value"
              style={{ padding: '8px', borderRadius: 4, border: '1px solid #555', background: THEME.bg, color: '#fff' }}
            />
            <button onClick={handleEnqueue} style={{...btnStyle, background: THEME.success}}>入队 (EnQueue)</button>
            <button onClick={handleDequeue} style={{...btnStyle, background: THEME.danger}}>出队 (DeQueue)</button>
          </div>

          <div style={{ fontSize: 12, color: THEME.text, textAlign: 'center' }}>
            {msg}
          </div>

        </div>
      </div>
    </div>
  );
};

const varRowStyle = {
  display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#c9d1d9', marginBottom: 4
};

const btnStyle = {
  padding: '8px', border: 'none', borderRadius: 4, color: 'white', cursor: 'pointer', fontWeight: 'bold'
};

export default CircularQueueVariants;