import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const THEME = {
  bg: '#0d1117', border: '#30363d', text: '#c9d1d9',
  front: '#2ea043', rear: '#d29922', highlight: '#d29922', danger: '#da3633'
};
const CAPACITY = 8;
const RADIUS = 100; const CENTER = 150;

const CODE_LINES = [
  { id: 1, text: "bool Enqueue(x) {", indent: 0 },
  { id: 2, text: "  if (front==rear && tag==1) Full;", indent: 2 },
  { id: 3, text: "  data[rear] = x; rear = (rear+1)%N;", indent: 2 },
  { id: 4, text: "  tag = 1; // 设为入队", indent: 2 },
  { id: 5, text: "}", indent: 0 },
  { id: 6, text: "x Dequeue() {", indent: 0 },
  { id: 7, text: "  if (front==rear && tag==0) Empty;", indent: 2 },
  { id: 8, text: "  x=data[front]; front=(front+1)%N;", indent: 2 },
  { id: 9, text: "  tag = 0; // 设为出队", indent: 2 },
  { id: 10, text: "}", indent: 0 },
];

const QueueTagDemo = () => {
  const [queue, setQueue] = useState(Array(CAPACITY).fill(null));
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(0);
  const [tag, setTag] = useState(0); // 0: dequeue, 1: enqueue
  const [activeLine, setActiveLine] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [log, setLog] = useState("方法三：Front==Rear 且 Tag==1 为满");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const enqueue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const val = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    setActiveLine(2); await sleep(500);
    if (front === rear && tag === 1) {
        setLog("❌ 队列满 (Tag=1)");
    } else {
        setActiveLine(3);
        const newQ = [...queue]; newQ[rear] = val; setQueue(newQ);
        setRear((rear + 1) % CAPACITY);
        await sleep(400);

        setActiveLine(4);
        setTag(1);
        setLog(`➕ 入队 ${val}, Tag=1`);
        await sleep(400);
    }
    setActiveLine(-1); setIsAnimating(false);
  };

  const dequeue = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setActiveLine(7); await sleep(500);
    if (front === rear && tag === 0) {
        setLog("❌ 队列空 (Tag=0)");
    } else {
        setActiveLine(8);
        const newQ = [...queue]; newQ[front] = null; setQueue(newQ);
        setFront((front + 1) % CAPACITY);
        await sleep(400);

        setActiveLine(9);
        setTag(0);
        setLog(`➖ 出队, Tag=0`);
        await sleep(400);
    }
    setActiveLine(-1); setIsAnimating(false);
  };

  const getSlotStyle = (i) => {
      const angle = (i * (360 / CAPACITY)) - 90;
      const rad = (angle * Math.PI) / 180;
      return { left: CENTER + RADIUS * Math.cos(rad) - 20, top: CENTER + RADIUS * Math.sin(rad) - 20 };
  };

  return (
    <div style={{fontFamily:'Consolas', background:THEME.bg, color:THEME.text, border:`1px solid ${THEME.border}`, borderRadius:8, overflow:'hidden', display:'flex', height: 320}}>
        <div style={{flex:1.5, position:'relative', background:'#010409'}}>
            <div style={{position:'absolute', top:10, left:10, fontSize:14, fontWeight:'bold', color:'#fff'}}>Tag 标记法</div>
            <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center'}}>
                <div style={{fontSize:30, fontWeight:'bold', color: tag===1?THEME.rear:THEME.front}}>{tag}</div>
                <div style={{fontSize:10, color:'#666'}}>Tag (1:In, 0:Out)</div>
            </div>
            {queue.map((v, i) => (
                <div key={i} style={{position:'absolute', width:40, height:40, borderRadius:'50%', border:`1px solid ${THEME.border}`, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.05)', ...getSlotStyle(i)}}>
                    {v}
                    {i===front && <div style={{position:'absolute', top:-15, fontSize:10, color:THEME.front}}>F</div>}
                    {i===rear && <div style={{position:'absolute', bottom:-15, fontSize:10, color:THEME.rear}}>R</div>}
                </div>
            ))}
            <div style={{position:'absolute', bottom:10, width:'100%', textAlign:'center', color:THEME.highlight, fontSize:12}}>{log}</div>
        </div>
        <div style={{flex:1, borderLeft:`1px solid ${THEME.border}`, display:'flex', flexDirection:'column'}}>
            <div style={{flex:1, padding:10, fontSize:11, overflow:'auto'}}>
                {CODE_LINES.map(l => (
                    <div key={l.id} style={{paddingLeft:l.indent*8, background:activeLine===l.id?THEME.highlight:'transparent', color:activeLine===l.id?'#fff':'#8b949e'}}>{l.text}</div>
                ))}
            </div>
            <div style={{padding:10, display:'flex', gap:5, borderTop:`1px solid ${THEME.border}`}}>
                <button onClick={enqueue} disabled={isAnimating} style={btnStyle}>入队</button>
                <button onClick={dequeue} disabled={isAnimating} style={btnStyle}>出队</button>
                <button onClick={()=>{setQueue(Array(CAPACITY).fill(null));setFront(0);setRear(0);setTag(0)}} style={btnStyle}>重置</button>
            </div>
        </div>
    </div>
  );
};
const btnStyle = {flex:1, background:'#d29922', border:'none', color:'#fff', borderRadius:4, cursor:'pointer', padding:'5px 0'};
export default QueueTagDemo;