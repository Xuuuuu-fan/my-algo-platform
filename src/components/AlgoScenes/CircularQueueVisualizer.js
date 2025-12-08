import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 深色主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  textMuted: '#8b949e',
  accent: '#58a6ff',      // 蓝色
  front: '#2ea043',       // 队头 (绿)
  rear: '#d29922',        // 队尾 (橙)
  highlight: '#a371f7',   // 正在操作的代码行 (紫)
  codeBg: '#0d1117',
  slotBg: 'rgba(255,255,255,0.05)',
  danger: '#da3633'
};

const CAPACITY = 8;
const RADIUS = 120; // 圆环半径
const CENTER = 160; // 画布中心坐标

// 伪代码定义
const CODE_LINES = [
  { id: 0, text: "// 循环队列操作", indent: 0 },
  { id: 1, text: "bool Enqueue(x) {", indent: 0 },
  { id: 2, text: "  if (size == N) return false; // 判满", indent: 2 },
  { id: 3, text: "  data[rear] = x; // 填入数据", indent: 2 },
  { id: 4, text: "  rear = (rear + 1) % N; // 队尾后移", indent: 2 },
  { id: 5, text: "  size++;", indent: 2 },
  { id: 6, text: "}", indent: 0 },
  { id: 7, text: "x Dequeue() {", indent: 0 },
  { id: 8, text: "  if (size == 0) return null; // 判空", indent: 2 },
  { id: 9, text: "  x = data[front]; // 取出数据", indent: 2 },
  { id: 10, text: "  front = (front + 1) % N; // 队头后移", indent: 2 },
  { id: 11, text: "  size--;", indent: 2 },
  { id: 12, text: "}", indent: 0 },
];

const CircularQueueVisualizer = () => {
  const [queue, setQueue] = useState(Array(CAPACITY).fill(null));
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(0);
  const [size, setSize] = useState(0);

  const [activeLine, setActiveLine] = useState(-1); // 当前高亮的代码行
  const [isAnimating, setIsAnimating] = useState(false); // 动画锁
  const [inputValue, setInputValue] = useState('');
  const [logs, setLogs] = useState(["循环队列就绪。N=" + CAPACITY]);

  const logsContainerRef = useRef(null);

  // 自动滚动日志 (修复了页面整体滚动的问题)
  useEffect(() => {
    if (logsContainerRef.current) {
        logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('en-US', {hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit"});
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ================== 核心逻辑 (带动画步骤) ==================

  const enqueue = async () => {
    if (isAnimating) return;
    if (!inputValue.trim()) return;
    setIsAnimating(true);

    const val = inputValue;
    setInputValue('');

    // Step 1: 判满
    setActiveLine(2);
    await sleep(600);
    if (size === CAPACITY) {
        addLog("❌ 队列已满 (Full)！");
        setActiveLine(-1);
        setIsAnimating(false);
        return;
    }

    // Step 2: 填入数据
    setActiveLine(3);
    const newQueue = [...queue];
    newQueue[rear] = val;
    setQueue(newQueue);
    await sleep(600);

    // Step 3: Rear 后移
    setActiveLine(4);
    const nextRear = (rear + 1) % CAPACITY;
    setRear(nextRear);
    addLog(`➕ 入队: "${val}" (Rear: ${rear} -> ${nextRear})`);
    await sleep(600);

    // Step 4: Size++
    setActiveLine(5);
    setSize(s => s + 1);
    await sleep(600);

    setActiveLine(-1);
    setIsAnimating(false);
  };

  const dequeue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Step 1: 判空
    setActiveLine(8);
    await sleep(600);
    if (size === 0) {
        addLog("❌ 队列为空 (Empty)！");
        setActiveLine(-1);
        setIsAnimating(false);
        return;
    }

    // Step 2: 取出数据 (视觉上清空)
    setActiveLine(9);
    const val = queue[front];
    const newQueue = [...queue];
    newQueue[front] = null;
    setQueue(newQueue);
    await sleep(600);

    // Step 3: Front 后移
    setActiveLine(10);
    const nextFront = (front + 1) % CAPACITY;
    setFront(nextFront);
    addLog(`➖ 出队: "${val}" (Front: ${front} -> ${nextFront})`);
    await sleep(600);

    // Step 4: Size--
    setActiveLine(11);
    setSize(s => s - 1);
    await sleep(600);

    setActiveLine(-1);
    setIsAnimating(false);
  };

  const reset = () => {
      if (isAnimating) return;
      setQueue(Array(CAPACITY).fill(null));
      setFront(0);
      setRear(0);
      setSize(0);
      setActiveLine(-1);
      addLog("队列已重置。");
  };

  const generateRandom = () => {
      setInputValue(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
  };

  // ================== 计算圆环位置 ==================
  // 计算第 i 个索引在圆周上的坐标 (x, y) 和旋转角度
  const getSlotStyle = (index) => {
      // -90度是为了让 index 0 在正上方 (12点钟方向)
      const angleDeg = (index * (360 / CAPACITY)) - 90;
      const angleRad = (angleDeg * Math.PI) / 180;

      const x = CENTER + RADIUS * Math.cos(angleRad);
      const y = CENTER + RADIUS * Math.sin(angleRad);

      return { x, y, angle: angleDeg };
  };

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部栏 */}
      <div style={{ padding: '12px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 15, alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 18, marginRight: 10 }}>循环队列 (Ring Buffer)</h3>

        <div style={{display:'flex'}}>
            <input
                value={inputValue} onChange={e => setInputValue(e.target.value)}
                placeholder="Val" maxLength={3} disabled={isAnimating}
                style={{width:60, padding:'6px', borderRadius:'4px 0 0 4px', border:`1px solid ${THEME.border}`, background: THEME.bg, color:'#fff', outline:'none', textAlign:'center'}}
                onKeyDown={(e) => e.key === 'Enter' && enqueue()}
            />
            <button onClick={generateRandom} disabled={isAnimating} style={{...btnStyle(THEME.panel), borderRadius:'0 4px 4px 0', borderLeft:'none', padding:'0 8px'}}>🎲</button>
        </div>

        <button onClick={enqueue} disabled={isAnimating} style={btnStyle(THEME.accent)}>入队</button>
        <button onClick={dequeue} disabled={isAnimating} style={btnStyle(THEME.danger)}>出队</button>
        <button onClick={reset} disabled={isAnimating} style={btnStyle(THEME.border)}>重置</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* === 左侧：圆环可视化 === */}
        <div style={{ flex: 1.5, position: 'relative', background: '#0d1117', overflow: 'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>

            {/* 画布容器 */}
            <div style={{ width: 320, height: 320, position:'relative' }}>

                {/* 中心信息 */}
                <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', textAlign:'center'}}>
                    <div style={{fontSize:12, color:THEME.textMuted}}>SIZE</div>
                    <div style={{fontSize:24, fontWeight:'bold', color: size===CAPACITY ? THEME.danger : THEME.text}}>{size}</div>
                    <div style={{fontSize:12, color:THEME.textMuted}}>MAX: {CAPACITY}</div>
                </div>

                {/* 渲染槽位 (Slots) */}
                {queue.map((val, i) => {
                    const { x, y } = getSlotStyle(i);
                    const isFront = i === front;
                    const isRear = i === rear;
                    // 高亮判断：如果正在入队且是 rear，或者正在出队且是 front
                    const isActivelyProcessing = (activeLine === 3 && isRear) || (activeLine === 9 && isFront);

                    return (
                        <React.Fragment key={i}>
                            {/* 槽位盒子 */}
                            <motion.div
                                animate={{
                                    backgroundColor: isActivelyProcessing ? 'rgba(163, 113, 247, 0.3)' : THEME.slotBg,
                                    scale: isActivelyProcessing ? 1.2 : 1
                                }}
                                style={{
                                    position: 'absolute', left: x - 20, top: y - 20,
                                    width: 40, height: 40, borderRadius: '50%',
                                    border: `1px solid ${THEME.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 10
                                }}
                            >
                                <span style={{fontSize: 10, position:'absolute', top:-15, color:'#666'}}>{i}</span>
                                <AnimatePresence mode='wait'>
                                    {val && (
                                        <motion.span
                                            initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
                                            style={{fontWeight:'bold', color:'#fff'}}
                                        >
                                            {val}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </React.Fragment>
                    );
                })}

                {/* 渲染指针 (Front/Rear) - 独立层，旋转动画 */}
                {/* Rear 指针 (外圈) */}
                <motion.div
                    animate={{ rotate: (rear * (360 / CAPACITY)) - 90 }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    style={{
                        position: 'absolute', left: CENTER, top: CENTER, width: 0, height: 0,
                        zIndex: 5
                    }}
                >
                    {/* 指针臂长 */}
                    <div style={{ position: 'absolute', left: -1, top: -RADIUS - 35, width: 2, height: 25, background: THEME.rear }}></div>
                    <div style={{
                        position: 'absolute', left: -15, top: -RADIUS - 55, width: 30, height: 20,
                        background: THEME.rear, borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, fontWeight:'bold', color:'#fff'
                    }}>
                        Rear
                    </div>
                </motion.div>

                {/* Front 指针 (内圈) */}
                <motion.div
                    animate={{ rotate: (front * (360 / CAPACITY)) - 90 }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                    style={{
                        position: 'absolute', left: CENTER, top: CENTER, width: 0, height: 0,
                        zIndex: 5
                    }}
                >
                    <div style={{ position: 'absolute', left: -1, top: -RADIUS + 25, width: 2, height: 15, background: THEME.front }}></div>
                    <div style={{
                        position: 'absolute', left: -15, top: -RADIUS + 40, width: 30, height: 20,
                        background: THEME.front, borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:10, fontWeight:'bold', color:'#fff'
                    }}>
                        Front
                    </div>
                </motion.div>

            </div>
        </div>

        {/* === 右侧：代码与日志 === */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${THEME.border}`, background: THEME.panel }}>

            {/* 代码同步高亮区 */}
            <div style={{ flex: 1.2, padding: 15, background: THEME.codeBg, overflow: 'auto', borderBottom: `1px solid ${THEME.border}` }}>
                <div style={{fontSize:12, color:THEME.textMuted, marginBottom:10, fontWeight:'bold'}}>Code Walkthrough</div>
                <div style={{fontFamily:'Consolas', fontSize:12, lineHeight:1.6}}>
                    {CODE_LINES.map(line => (
                        <motion.div
                            key={line.id}
                            animate={{
                                backgroundColor: activeLine === line.id ? 'rgba(163, 113, 247, 0.2)' : 'transparent',
                                borderLeft: activeLine === line.id ? `3px solid ${THEME.highlight}` : '3px solid transparent'
                            }}
                            style={{
                                paddingLeft: 6 + (line.indent * 10),
                                color: activeLine === line.id ? '#fff' : (line.indent===0 ? THEME.text : THEME.textMuted)
                            }}
                        >
                            {line.text}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 日志区 */}
            <div style={{ flex: 1, display:'flex', flexDirection:'column', padding: 15, background: '#161b22' }}>
                <div style={{fontSize:12, color:THEME.textMuted, marginBottom:8, fontWeight:'bold'}}>Operation Log</div>
                <div ref={logsContainerRef} style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:4}}>
                    {logs.map((log, idx) => (
                        <div key={idx} style={{fontSize:12, color: idx === logs.length-1 ? '#fff' : '#666', fontFamily:'Consolas'}}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

// ================== 样式 ==================
const btnStyle = (bg) => ({
  padding: '6px 14px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 'bold', transition:'0.2s', opacity: bg.includes('disabled') ? 0.5 : 1
});

export default CircularQueueVisualizer;