import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 公共配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  accent: '#58a6ff',
  front: '#2ea043',
  rear: '#d29922',
  highlight: '#a371f7',
  codeBg: '#010409'
};

const CAPACITY = 8;
const RADIUS = 110; // 这里的半径已经调大，配合居中布局

// 辅助函数
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ================== 基础渲染组件 (包含居中修复) ==================
const BaseVisualizer = ({
  queue, front, rear,
  codeLines, activeLine, log,
  onEnqueue, onDequeue, onReset, isAnimating,
  centerText, centerLabel, centerColor = '#fff'
}) => {
  return (
    <div style={{ display: 'flex', border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: 'hidden', height: 360, fontFamily: 'Consolas, monospace', background: THEME.bg, marginBottom: 20 }}>

      {/* 左侧：可视化区域 (Flex 绝对居中) */}
      <div style={{
          flex: 1.4,
          position: 'relative',
          background: '#010409',
          borderRight: `1px solid ${THEME.border}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
      }}>

        {/* 1. 中心信息 (Tag / Size) */}
        <div style={{ position: 'absolute', zIndex: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: centerColor }}>{centerText}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>{centerLabel}</div>
        </div>

        {/* 2. 轨道虚线 */}
        <div style={{
            position: 'absolute', width: RADIUS * 2, height: RADIUS * 2,
            border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '50%'
        }} />

        {/* 3. 数组节点容器 */}
        <div style={{ position: 'absolute', width: RADIUS * 2, height: RADIUS * 2 }}>
            {queue.map((v, i) => {
              // 动态计算坐标 (相对于容器中心)
              const angle = (i * (360 / CAPACITY)) - 90;
              const rad = (angle * Math.PI) / 180;
              const x = RADIUS + RADIUS * Math.cos(rad) - 20;
              const y = RADIUS + RADIUS * Math.sin(rad) - 20;

              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position: 'absolute', left: x, top: y,
                    width: 40, height: 40, borderRadius: 8,
                    border: `1px solid ${THEME.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: v ? 'rgba(31, 111, 235, 0.2)' : 'rgba(255,255,255,0.02)',
                    color: v ? '#fff' : '#666',
                    boxShadow: v ? '0 0 10px rgba(31, 111, 235, 0.2)' : 'none'
                  }}
                >
                  {v}
                  <div style={{position:'absolute', fontSize:9, color:'#444', top:-12}}>{i}</div>

                  {/* 指针 */}
                  {i === front && (
                    <motion.div layoutId={`ptr-f-${centerLabel}`} style={{ position: 'absolute', top: -18, color: THEME.front, fontWeight: 'bold', fontSize: 12, zIndex: 20 }}>F</motion.div>
                  )}
                  {i === rear && (
                    <motion.div layoutId={`ptr-r-${centerLabel}`} style={{ position: 'absolute', bottom: -18, color: THEME.rear, fontWeight: 'bold', fontSize: 12, zIndex: 20 }}>R</motion.div>
                  )}
                </motion.div>
              );
            })}
        </div>

        {/* 底部日志 */}
        <div style={{ position: 'absolute', bottom: 10, width: '100%', textAlign: 'center', fontSize: 12, color: THEME.accent }}>
          {log}
        </div>
      </div>

      {/* 右侧：代码与控制 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: THEME.panel }}>
        <div style={{ flex: 1, padding: 15, fontSize: 12, overflow: 'auto', lineHeight: 1.6 }}>
          {codeLines.map(l => (
            <div key={l.id} style={{
              paddingLeft: l.indent * 8,
              background: activeLine === l.id ? 'rgba(210, 153, 34, 0.2)' : 'transparent',
              borderLeft: activeLine === l.id ? `3px solid ${THEME.rear}` : '3px solid transparent',
              color: activeLine === l.id ? '#fff' : '#8b949e',
              transition: 'background 0.2s'
            }}>
              {l.text}
            </div>
          ))}
        </div>

        {/* 控制按钮 */}
        <div style={{ padding: 15, borderTop: `1px solid ${THEME.border}`, display: 'flex', gap: 8 }}>
          <button onClick={onEnqueue} disabled={isAnimating} style={{...btnStyle, background: THEME.success}}>入队</button>
          <button onClick={onDequeue} disabled={isAnimating} style={{...btnStyle, background: THEME.danger}}>出队</button>
          <button onClick={onReset} disabled={isAnimating} style={{...btnStyle, background: THEME.border}}>重置</button>
        </div>
      </div>
    </div>
  );
};

const btnStyle = {
  flex: 1, padding: '8px 0', borderRadius: 6, border: 'none',
  color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: 13
};

// ================== 组件 1: 牺牲空间法 ==================
export const CircularQueueSacrifice = () => {
  const [queue, setQueue] = useState(Array(CAPACITY).fill(null));
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(0);
  const [activeLine, setActiveLine] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [log, setLog] = useState("判满条件：(rear + 1) % N == front");

  const CODE = [
    { id: 1, text: "bool Enqueue(x) {", indent: 0 },
    { id: 2, text: "  if ((rear+1)%N == front) Full;", indent: 2 },
    { id: 3, text: "  data[rear] = x;", indent: 2 },
    { id: 4, text: "  rear = (rear + 1) % N;", indent: 2 },
    { id: 5, text: "}", indent: 0 },
  ];

  const enqueue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const val = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    setActiveLine(2); await sleep(500);
    if ((rear + 1) % CAPACITY === front) {
      setLog("❌ 队列满 (牺牲一个格子)");
    } else {
      setActiveLine(3);
      const newQ = [...queue]; newQ[rear] = val; setQueue(newQ);
      await sleep(400);
      setActiveLine(4);
      setRear((rear + 1) % CAPACITY);
      setLog(`➕ 入队 ${val}`);
      await sleep(400);
    }
    setActiveLine(-1); setIsAnimating(false);
  };

  const dequeue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (front === rear) {
      setLog("❌ 队列空");
    } else {
      const newQ = [...queue]; newQ[front] = null; setQueue(newQ);
      setFront((front + 1) % CAPACITY);
      setLog(`➖ 出队`);
    }
    await sleep(500);
    setIsAnimating(false);
  };

  return (
    <BaseVisualizer
      queue={queue} front={front} rear={rear}
      codeLines={CODE} activeLine={activeLine} log={log}
      onEnqueue={enqueue} onDequeue={dequeue} isAnimating={isAnimating}
      onReset={() => {setQueue(Array(CAPACITY).fill(null)); setFront(0); setRear(0);}}
      centerText="N-1"
      centerLabel="可用空间"
    />
  );
};

// ================== 组件 2: Size 计数法 ==================
export const CircularQueueSize = () => {
  const [queue, setQueue] = useState(Array(CAPACITY).fill(null));
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(0);
  const [size, setSize] = useState(0);
  const [activeLine, setActiveLine] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [log, setLog] = useState("判满条件：size == N");

  const CODE = [
    { id: 1, text: "bool Enqueue(x) {", indent: 0 },
    { id: 2, text: "  if (size == N) return Full;", indent: 2 },
    { id: 3, text: "  data[rear] = x;", indent: 2 },
    { id: 4, text: "  rear = (rear + 1) % N;", indent: 2 },
    { id: 5, text: "  size++;", indent: 2 },
    { id: 6, text: "}", indent: 0 },
  ];

  const enqueue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const val = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    setActiveLine(2); await sleep(500);
    if (size === CAPACITY) {
        setLog("❌ 队列满 (Size == N)");
    } else {
        setActiveLine(3);
        const newQ = [...queue]; newQ[rear] = val; setQueue(newQ);
        await sleep(400);
        setActiveLine(4);
        setRear((rear + 1) % CAPACITY);
        await sleep(400);
        setActiveLine(5);
        setSize(s => s + 1);
        setLog(`➕ 入队 ${val}`);
        await sleep(400);
    }
    setActiveLine(-1); setIsAnimating(false);
  };

  const dequeue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (size === 0) {
        setLog("❌ 队列空");
    } else {
        const newQ = [...queue]; newQ[front] = null; setQueue(newQ);
        setFront((front + 1) % CAPACITY);
        setSize(s => s - 1);
        setLog(`➖ 出队`);
    }
    await sleep(500);
    setIsAnimating(false);
  };

  return (
    <BaseVisualizer
      queue={queue} front={front} rear={rear}
      codeLines={CODE} activeLine={activeLine} log={log}
      onEnqueue={enqueue} onDequeue={dequeue} isAnimating={isAnimating}
      onReset={() => {setQueue(Array(CAPACITY).fill(null)); setFront(0); setRear(0); setSize(0);}}
      centerText={size}
      centerLabel="Size"
      centerColor={THEME.highlight}
    />
  );
};

// ================== 组件 3: Tag 标记法 ==================
export const CircularQueueTag = () => {
  const [queue, setQueue] = useState(Array(CAPACITY).fill(null));
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(0);
  const [tag, setTag] = useState(0);
  const [activeLine, setActiveLine] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [log, setLog] = useState("判满：Front==Rear && Tag==1");

  const CODE = [
    { id: 1, text: "bool Enqueue(x) {", indent: 0 },
    { id: 2, text: "  if (front==rear && tag==1) Full;", indent: 2 },
    { id: 3, text: "  data[rear] = x; rear=(rear+1)%N;", indent: 2 },
    { id: 4, text: "  tag = 1; // 设为入队", indent: 2 },
    { id: 5, text: "}", indent: 0 },
    { id: 6, text: "x Dequeue() {", indent: 0 },
    { id: 7, text: "  if (front==rear && tag==0) Empty;", indent: 2 },
    { id: 8, text: "  ...; front=(front+1)%N;", indent: 2 },
    { id: 9, text: "  tag = 0; // 设为出队", indent: 2 },
    { id: 10, text: "}", indent: 0 },
  ];

  const enqueue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const val = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    setActiveLine(2); await sleep(500);
    if (front === rear && tag === 1) {
        setLog("❌ 队列满 (Tag == 1)");
    } else {
        setActiveLine(3);
        const newQ = [...queue]; newQ[rear] = val; setQueue(newQ);
        setRear((rear + 1) % CAPACITY);
        await sleep(400);
        setActiveLine(4);
        setTag(1);
        setLog(`➕ 入队 ${val}`);
        await sleep(400);
    }
    setActiveLine(-1); setIsAnimating(false);
  };

  const dequeue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveLine(7); await sleep(500);
    if (front === rear && tag === 0) {
        setLog("❌ 队列空 (Tag == 0)");
    } else {
        setActiveLine(8);
        const newQ = [...queue]; newQ[front] = null; setQueue(newQ);
        setFront((front + 1) % CAPACITY);
        await sleep(400);
        setActiveLine(9);
        setTag(0);
        setLog(`➖ 出队`);
        await sleep(400);
    }
    setActiveLine(-1); setIsAnimating(false);
  };

  return (
    <BaseVisualizer
      queue={queue} front={front} rear={rear}
      codeLines={CODE} activeLine={activeLine} log={log}
      onEnqueue={enqueue} onDequeue={dequeue} isAnimating={isAnimating}
      onReset={() => {setQueue(Array(CAPACITY).fill(null)); setFront(0); setRear(0); setTag(0);}}
      centerText={tag}
      centerLabel="Tag"
      centerColor={tag === 1 ? THEME.rear : THEME.front}
    />
  );
};