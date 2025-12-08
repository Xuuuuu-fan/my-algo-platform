import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 公共配置 ==================
const THEME = {
  bg: '#0d1117',        // 背景深灰
  panel: '#161b22',     // 面板灰
  border: '#30363d',    // 边框
  text: '#c9d1d9',      // 文本
  accent: '#58a6ff',    // 蓝色强调
  front: '#2ea043',     // Front 指针绿
  rear: '#d29922',      // Rear 指针橙
  highlight: '#a371f7', // 高亮紫
  codeBg: '#010409'     // 代码块背景
};

const CAPACITY = 8;
const RADIUS = 110;
const CENTER = 160;

// 辅助函数：睡眠
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// 辅助函数：计算圆周坐标


// ================== 子组件 1: 牺牲空间法 ==================
const SacrificeDemo = () => {
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

// ================== 子组件 2: Size 计数法 ==================
const SizeDemo = () => {
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

// ================== 子组件 3: Tag 标记法 ==================
const TagDemo = () => {
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

// ================== 基础渲染组件 (UI 骨架) ==================
const BaseVisualizer = ({
  queue, front, rear,
  codeLines, activeLine, log,
  onEnqueue, onDequeue, onReset, isAnimating,
  centerText, centerLabel, centerColor = '#fff'
}) => {
  return (
    <div style={{ display: 'flex', border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: 'hidden', height: 340, fontFamily: 'Consolas, monospace', background: THEME.bg }}>

      {/* 左侧：可视化区域 */}
      <div style={{
          flex: 1.4,
          position: 'relative',
          background: '#010409',
          borderRight: `1px solid ${THEME.border}`,
          display: 'flex',           // 开启 Flex 布局
          justifyContent: 'center',  // 水平居中
          alignItems: 'center',      // 垂直居中
          overflow: 'hidden'         // 防止溢出
      }}>
         {/* 中心信息 */}
        {/* 👇 修改这里：去掉 top/left 的百分比，直接相对 Flex 容器居中 */}
        <div style={{
            position: 'absolute',
            zIndex: 10,
            textAlign: 'center',
            // 不需要 top/left/transform 了，因为父容器已经 Flex 居中了
            // 但为了保险起见，如果父容器大小变化，保持绝对中心：
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        }}>
          <div style={{ fontSize: 36, fontWeight: 'bold', color: centerColor }}>{centerText}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>{centerLabel}</div>
        </div>

        {/* 轨道虚线 */}
        <div style={{
            position: 'absolute',
            width: RADIUS * 2,
            height: RADIUS * 2,
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '50%',
            // 同样绝对居中
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        }} />

        {/* 数组节点容器 */}
        {/* 👇 新增一个容器 div，用于定位圆环上的格子 */}
        <div style={{
            position: 'absolute',
            width: RADIUS * 2,
            height: RADIUS * 2,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        }}>
            {queue.map((v, i) => {
              // 这里的 getSlotStyle 需要微调，去掉 CENTER 偏移，改为相对容器中心
              const angle = (i * (360 / CAPACITY)) - 90;
              const rad = (angle * Math.PI) / 180;
              // 相对当前容器中心的偏移量 (容器宽高是 RADIUS*2)
              const x = RADIUS + RADIUS * Math.cos(rad) - 20;
              const y = RADIUS + RADIUS * Math.sin(rad) - 20;

              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    left: x, // 使用新计算的坐标
                    top: y,
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

                  {/* 指针 (保持不变) */}
                  {i === front && (
                    <motion.div layoutId="ptr-f" style={{ position: 'absolute', top: -18, color: THEME.front, fontWeight: 'bold', fontSize: 12, zIndex: 20 }}>F</motion.div>
                  )}
                  {i === rear && (
                    <motion.div layoutId="ptr-r" style={{ position: 'absolute', bottom: -18, color: THEME.rear, fontWeight: 'bold', fontSize: 12, zIndex: 20 }}>R</motion.div>
                  )}
                </motion.div>
              );
            })}
        </div>

        {/* 底部日志 (保持不变) */}
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

// ================== 主组件：Gallery 容器 ==================
const CircularQueueGallery = () => {
  const [tab, setTab] = useState('sacrifice');

  const tabs = [
    { id: 'sacrifice', label: '方法1: 牺牲空间' },
    { id: 'size', label: '方法2: Size变量' },
    { id: 'tag', label: '方法3: Tag标记' },
  ];

  return (
    <div>
      {/* 选项卡 */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 15, background: '#161b22', padding: 4, borderRadius: 8, width: 'fit-content', border: '1px solid #30363d' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#1f6feb' : 'transparent',
              color: tab === t.id ? '#fff' : '#8b949e',
              fontWeight: tab === t.id ? 'bold' : 'normal',
              fontSize: 13, transition: '0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ minHeight: 340 }}>
        {tab === 'sacrifice' && <SacrificeDemo />}
        {tab === 'size' && <SizeDemo />}
        {tab === 'tag' && <TagDemo />}
      </div>
    </div>
  );
};

export default CircularQueueGallery;