import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 配置 ==================
const THEME = {
  bg: '#0d1117', panel: '#161b22', border: '#30363d',
  text: '#c9d1d9', accent: '#58a6ff',
  front: '#2ea043', rear: '#d29922',
  codeBg: '#0d1117', highlight: '#a371f7', danger: '#da3633'
};
const CAPACITY = 8;
const RADIUS = 100; const CENTER = 150;

const CODE_LINES = [
  { id: 1, text: "bool Enqueue(x) {", indent: 0 },
  { id: 2, text: "  if ((rear + 1) % N == front)", indent: 2 },
  { id: 3, text: "    return false; // 判满", indent: 4 },
  { id: 4, text: "  data[rear] = x;", indent: 2 },
  { id: 5, text: "  rear = (rear + 1) % N;", indent: 2 },
  { id: 6, text: "}", indent: 0 },
];

const QueueSacrificeDemo = () => {
  const [queue, setQueue] = useState(Array(CAPACITY).fill(null));
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(0);
  const [activeLine, setActiveLine] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [log, setLog] = useState("方法一：(rear + 1) % N == front 为满");

  const isFull = (rear + 1) % CAPACITY === front;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const enqueue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const val = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    setActiveLine(2); await sleep(500); // Check
    if (isFull) {
        setLog("❌ 队列满 (牺牲一格法)");
        setActiveLine(3); await sleep(500);
    } else {
        setActiveLine(4);
        const newQ = [...queue]; newQ[rear] = val; setQueue(newQ);
        await sleep(400); // Assign

        setActiveLine(5);
        setRear((rear + 1) % CAPACITY);
        setLog(`➕ 入队 ${val}`);
        await sleep(400); // Move Rear
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
        setLog("➖ 出队");
    }
    await sleep(500);
    setIsAnimating(false);
  };

  const getSlotStyle = (i) => {
      const angle = (i * (360 / CAPACITY)) - 90;
      const rad = (angle * Math.PI) / 180;
      return { left: CENTER + RADIUS * Math.cos(rad) - 20, top: CENTER + RADIUS * Math.sin(rad) - 20, angle };
  };

  return (
    <div style={{fontFamily:'Consolas', background:THEME.bg, color:THEME.text, border:`1px solid ${THEME.border}`, borderRadius:8, overflow:'hidden', display:'flex', height: 320}}>
        {/* 左侧：圆环 */}
        <div style={{flex:1.5, position:'relative', background:'#010409'}}>
            <div style={{position:'absolute', top:10, left:10, fontSize:14, fontWeight:'bold', color:'#fff'}}>牺牲一格法</div>
            {queue.map((v, i) => {
                const pos = getSlotStyle(i);
                const isSacrificed = isFull && i === rear;
                return (
                    <motion.div key={i} animate={{backgroundColor: isSacrificed ? 'rgba(218,54,51,0.2)' : 'rgba(255,255,255,0.05)'}}
                        style={{position:'absolute', width:40, height:40, borderRadius:'50%', border:`1px solid ${isSacrificed?THEME.danger:THEME.border}`, display:'flex', alignItems:'center', justifyContent:'center', ...pos}}>
                        {v}
                        {isSacrificed && <span style={{fontSize:8, color:THEME.danger}}>空</span>}
                        {i===front && <div style={{position:'absolute', top:-15, fontSize:10, color:THEME.front}}>F</div>}
                        {i===rear && <div style={{position:'absolute', bottom:-15, fontSize:10, color:THEME.rear}}>R</div>}
                    </motion.div>
                )
            })}
            <div style={{position:'absolute', bottom:10, width:'100%', textAlign:'center', color:THEME.accent, fontSize:12}}>{log}</div>
        </div>
        {/* 右侧：代码与控制 */}
        <div style={{flex:1, borderLeft:`1px solid ${THEME.border}`, display:'flex', flexDirection:'column'}}>
            <div style={{flex:1, padding:10, fontSize:11, overflow:'auto'}}>
                {CODE_LINES.map(l => (
                    <div key={l.id} style={{paddingLeft:l.indent*8, background:activeLine===l.id?THEME.highlight:'transparent', color:activeLine===l.id?'#fff':THEME.textMuted}}>{l.text}</div>
                ))}
            </div>
            <div style={{padding:10, display:'flex', gap:5, borderTop:`1px solid ${THEME.border}`}}>
                <button onClick={enqueue} disabled={isAnimating} style={btnStyle}>入队</button>
                <button onClick={dequeue} disabled={isAnimating} style={btnStyle}>出队</button>
                <button onClick={()=>{setQueue(Array(CAPACITY).fill(null));setFront(0);setRear(0);}} style={btnStyle}>重置</button>
            </div>
        </div>
    </div>
  );
};
const btnStyle = {flex:1, background:'#238636', border:'none', color:'#fff', borderRadius:4, cursor:'pointer', padding:'5px 0'};
export default QueueSacrificeDemo;