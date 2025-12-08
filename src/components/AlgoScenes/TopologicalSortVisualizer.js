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
  zeroIndegree: '#d29922', // 入度为0 (待处理/入队) - 橙色
  sorted: '#2ea043',      // 已排序 (绿)
  cycle: '#da3633',       // 环/无法排序 (红)
  highlight: '#3fb95040',
  tooltipBg: '#6e7681',
  codeBg: '#0d1117'
};

const NODE_R = 24;

// Kahn算法伪代码
const CODE_LINES = [
  { id: 1, text: "void TopologicalSort(Graph G) {", indent: 0 },
  { id: 2, text: "    Queue q; List result;", indent: 2 },
  { id: 3, text: "    for (u in G) if (indegree[u] == 0) q.push(u);", indent: 2 },
  { id: 4, text: "    while (!q.empty()) {", indent: 2 },
  { id: 5, text: "        u = q.pop();", indent: 4 },
  { id: 6, text: "        result.add(u);", indent: 4 },
  { id: 7, text: "        for (v in neighbors(u)) {", indent: 4 },
  { id: 8, text: "            indegree[v]--;", indent: 6 },
  { id: 9, text: "            if (indegree[v] == 0) q.push(v);", indent: 6 },
  { id: 10, text: "        }", indent: 4 },
  { id: 11, text: "    }", indent: 2 },
  { id: 12, text: "    if (result.size < G.size) Error(\"Cycle!\");", indent: 2 },
  { id: 13, text: "}", indent: 0 },
];

const TopologicalSortVisualizer = () => {
  const containerRef = useRef(null);
  const logsContainerRef = useRef(null);

  // ================== 数据状态 ==================
  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 100, y: 150 },
    { id: 1, label: 'B', x: 250, y: 80 },
    { id: 2, label: 'C', x: 250, y: 220 },
    { id: 3, label: 'D', x: 400, y: 150 },
    { id: 4, label: 'E', x: 550, y: 150 },
  ]);

  const [edges, setEdges] = useState([
    { from: 0, to: 1, id: '0-1' },
    { from: 0, to: 2, id: '0-2' },
    { from: 1, to: 3, id: '1-3' },
    { from: 2, to: 3, id: '2-3' },
    { from: 3, to: 4, id: '3-4' }
  ]);

  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1 });

  // ================== 算法执行状态 ==================
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // 计算入度表
  const calculateIndegrees = (currentNodes, currentEdges) => {
    const indegrees = {};
    currentNodes.forEach(n => indegrees[n.id] = 0);
    currentEdges.forEach(e => {
        if (indegrees[e.to] !== undefined) indegrees[e.to]++;
    });
    return indegrees;
  };

  // ================== Kahn 算法核心逻辑 ==================
  const generateTopoSort = () => {
    const newSteps = [];
    const logHistory = [];

    // 初始状态复制
    const indegrees = calculateIndegrees(nodes, edges);
    const queue = [];
    const result = [];
    const sortedSet = new Set();

    // 辅助快照
    const pushStep = (u, line, desc, highlightNode = null) => {
        const timestamp = new Date().toLocaleTimeString('en-US', {hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit"});
        logHistory.push(`[${timestamp}] ${desc}`);
        newSteps.push({
            indegrees: {...indegrees},
            queue: [...queue],
            result: [...result],
            sortedSet: new Set(sortedSet),
            line,
            desc,
            highlightNode,
            logs: [...logHistory]
        });
    };

    // 1. 初始化：找所有入度为0的
    nodes.forEach(n => {
        if (indegrees[n.id] === 0) {
            queue.push(n.id);
        }
    });
    pushStep(null, 3, `初始化：计算所有节点入度。发现入度为 0 的节点: [${queue.map(id => nodes.find(n=>n.id===id).label).join(', ')}]，加入队列。`);

    // 2. 循环处理
    while (queue.length > 0) {
        // Pop
        const uId = queue.shift();
        sortedSet.add(uId);
        result.push(uId);

        pushStep(uId, 6, `出队：节点 ${nodes.find(n=>n.id===uId).label} 入度为0，加入排序结果。`, uId);

        // 遍历邻居
        const neighbors = edges.filter(e => e.from === uId).map(e => e.to);
        for (let vId of neighbors) {
            indegrees[vId]--;
            const vLabel = nodes.find(n=>n.id===vId)?.label;

            if (indegrees[vId] === 0) {
                queue.push(vId);
                pushStep(uId, 9, `更新邻居 ${vLabel}：入度减为 0，加入队列！`, vId);
            } else {
                pushStep(uId, 8, `更新邻居 ${vLabel}：入度减 1 (当前剩余 ${indegrees[vId]})。`, vId);
            }
        }
    }

    // 3. 环检测
    if (result.length < nodes.length) {
        pushStep(null, 12, `结束：结果集数量 (${result.length}) 小于节点总数 (${nodes.length})。检测到图中存在环 (Cycle)，无法完成拓扑排序。`);
    } else {
        pushStep(null, 13, `完成：所有节点排序完毕。拓扑序列: ${result.map(id=>nodes.find(n=>n.id===id).label).join(' → ')}`);
    }

    return newSteps;
  };

  // ================== 控制逻辑 ==================
  const reset = () => { setIsAutoPlaying(false); setCurrentStep(-1); setSteps([]); };

  const startAlgo = () => {
      reset();
      const s = generateTopoSort();
      setSteps(s);
      setCurrentStep(0);
      setIsAutoPlaying(true);
  };

  const nextStep = () => { if (currentStep < steps.length - 1) setCurrentStep(p => p + 1); else setIsAutoPlaying(false); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(p => p - 1); setIsAutoPlaying(false); };

  useEffect(() => {
    if (logsContainerRef.current) {
        logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [currentStep]);

  useEffect(() => {
    let interval;
    if (isAutoPlaying && currentStep < steps.length - 1) interval = setInterval(nextStep, 1000);
    else setIsAutoPlaying(false);
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep, steps]);

  const defaultLogs = ["准备就绪。请绘制有向无环图 (DAG)，点击「开始排序」。"];
  const curState = steps[currentStep] || {
    indegrees: calculateIndegrees(nodes, edges), queue: [], result: [], sortedSet: new Set(), line: -1, logs: defaultLogs
  };

  // ================== 编辑逻辑 ==================
  const updateNodePos = (id, info) => setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));

  const addNode = () => {
    reset();
    const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
    const label = String.fromCharCode(65 + (newId % 26));
    setNodes([...nodes, {id: newId, label, x: 50+Math.random()*200, y:50+Math.random()*200}]);
  };

  const addEdge = () => {
    const { from, to } = edgeInput;
    const u = Number(from); const v = Number(to);
    if (u === v) return;
    if (!edges.find(e => e.from === u && e.to === v)) {
        setEdges([...edges, {from: u, to: v, id: `${u}-${v}`}]);
        reset();
    }
  };

  const removeEdge = () => {
    const { from, to } = edgeInput; const u = Number(from); const v = Number(to);
    setEdges(edges.filter(e => !(e.from === u && e.to === v)));
    reset();
  };

  const handleEdgeDoubleClick = (id) => {
      setEdges(edges.filter(e => e.id !== id));
      reset();
  };

  // 渲染入度表行
  const renderIndegreeRow = (n) => {
      const val = curState.indegrees[n.id] ?? 0;
      const isZero = val === 0;
      const isSorted = curState.sortedSet.has(n.id);

      let bg = 'transparent';
      let color = THEME.text;

      if (isSorted) { color = THEME.textMuted; }
      else if (isZero) { bg = 'rgba(210, 153, 34, 0.15)'; color = THEME.zeroIndegree; }

      return (
          <div key={n.id} style={{display:'flex', justifyContent:'space-between', padding:'4px 8px', fontSize:12, background: bg, color: color, borderRadius: 4}}>
              <span>{n.label}</span>
              <span style={{fontWeight:'bold'}}>{val}</span>
          </div>
      );
  };

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, marginRight: 10 }}>拓扑排序 (Kahn)</h3>

        {/* 编辑区 */}
        <Tooltip text="添加新节点">
            <button onClick={addNode} style={btnStyle(THEME.accent)}>+ 节点</button>
        </Tooltip>

        <div style={groupStyle}>
            <select value={edgeInput.from} onChange={e=>setEdgeInput({...edgeInput, from:e.target.value})} style={selectStyle}>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <span style={{color: THEME.textMuted}}>➔</span>
            <select value={edgeInput.to} onChange={e=>setEdgeInput({...edgeInput, to:e.target.value})} style={selectStyle}>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>

            <Tooltip text="添加有向边 (A->B)">
                <button onClick={addEdge} style={btnStyle(THEME.border)}>连线</button>
            </Tooltip>
            <button onClick={removeEdge} style={btnStyle(THEME.cycle)}>删除</button>
        </div>

        <div style={{flex:1}}></div>
        <button onClick={startAlgo} style={btnStyle(THEME.sorted)}>开始排序</button>
        <div style={{display:'flex', gap:2}}>
             <button onClick={prevStep} style={iconBtnStyle(THEME.accent)} disabled={currentStep<=0}>◀</button>
             <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} style={btnStyle(THEME.zeroIndegree)} style={{...btnStyle(THEME.zeroIndegree), width: 80}}>
                {isAutoPlaying ? "暂停" : "播放"}
             </button>
             <button onClick={nextStep} style={iconBtnStyle(THEME.accent)} disabled={currentStep >= steps.length-1}>▶</button>
        </div>
        <button onClick={reset} style={btnStyle(THEME.border)}>重置</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* === 左侧区域 === */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${THEME.border}` }}>

            {/* 图可视化 */}
            <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#0d1117', overflow: 'hidden', minHeight: '300px' }}>
                <div style={labelStyle}>DAG Visualization</div>
                <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="24" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L9,3 z" fill={THEME.border} />
                        </marker>
                    </defs>
                    {edges.map((e, i) => {
                        const s = nodes.find(n => n.id === e.from);
                        const t = nodes.find(n => n.id === e.to);
                        if (!s || !t) return null;
                        return (
                            <g key={e.id} onDoubleClick={() => handleEdgeDoubleClick(e.id)} style={{cursor: 'pointer'}}>
                                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="15" />
                                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={THEME.border} strokeWidth="2" markerEnd="url(#arrow)" />
                            </g>
                        );
                    })}
                </svg>

                {nodes.map(n => {
                    // 状态逻辑
                    const isSorted = curState.sortedSet.has(n.id);
                    const indegree = curState.indegrees[n.id] ?? 0;
                    const isZero = indegree === 0 && !isSorted; // 入度为0且未排序 = 待处理
                    const isHighlighted = n.id === curState.highlightNode;

                    // 颜色
                    let bg = '#1f6feb';
                    let borderColor = '#fff';
                    let scale = 1;

                    // 环检测逻辑：如果步骤结束，但节点既没被Sorted，入度也不为0，说明在环中
                    const isCycle = currentStep === steps.length - 1 && !isSorted && indegree > 0;

                    if (isCycle) { bg = THEME.cycle; borderColor = THEME.cycle; }
                    else if (isSorted) { bg = THEME.sorted; borderColor = THEME.sorted; }
                    else if (isZero) { bg = THEME.zeroIndegree; scale = 1.1; }
                    else if (isHighlighted) { borderColor = THEME.accent; scale = 1.1; }

                    return (
                    <motion.div key={n.id}
                        drag dragMomentum={false} dragConstraints={containerRef}
                        onDragEnd={(e, i) => updateNodePos(n.id, i)}
                        animate={{ x: n.x - NODE_R, y: n.y - NODE_R, scale }}
                        style={{
                        position: 'absolute', top: 0, left: 0,
                        width: NODE_R*2, height: NODE_R*2,
                        borderRadius: '50%', background: bg,
                        color: '#fff', border: `3px solid ${borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                        cursor: 'move', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10
                        }}
                    >
                        {n.label}
                        {/* 入度 Badge */}
                        <div style={{
                            position: 'absolute', top: -12, right: -12,
                            background: isZero ? THEME.zeroIndegree : '#21262d',
                            color: '#fff', fontSize: 10, fontWeight:'bold',
                            width: 18, height: 18, borderRadius: '50%',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            border: `1px solid ${THEME.border}`
                        }}>
                            {indegree}
                        </div>
                    </motion.div>
                    );
                })}
            </div>

            {/* 操作日志 */}
            <div style={{ height: 160, padding: 10, background: '#161b22', borderTop: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' }}>
                <div style={{fontSize:11, color:THEME.textMuted, marginBottom:5, fontWeight: 'bold'}}>Operation Log</div>
                <div ref={logsContainerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {curState.logs.map((log, index) => (
                        <div key={index}
                            style={{
                                fontSize: 12,
                                color: index === curState.logs.length - 1 ? THEME.text : '#666',
                                borderLeft: index === curState.logs.length - 1 ? `2px solid ${THEME.accent}` : '2px solid transparent',
                                paddingLeft: 6,
                                lineHeight: 1.4
                            }}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* === 右侧区域 === */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', background: THEME.panel, borderLeft: `1px solid ${THEME.border}` }}>

          {/* 代码区 */}
          <div style={{ height: '35%', display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${THEME.border}` }}>
             <div style={panelHeaderStyle}>Kahn's Algorithm (BFS based)</div>
             <div style={{ flex: 1, overflow: 'auto', background: THEME.codeBg, padding: 10 }}>
                {CODE_LINES.map(line => (
                <div key={line.id} style={{
                    padding: '1px 0', fontSize: 12, fontFamily:'Consolas',
                    background: curState.line === line.id ? 'rgba(56, 139, 253, 0.15)' : 'transparent',
                    color: curState.line === line.id ? '#fff' : THEME.textMuted,
                    borderLeft: curState.line === line.id ? `2px solid ${THEME.accent}` : '2px solid transparent',
                    paddingLeft: 10 + line.indent * 10
                }}>
                    {line.text}
                </div>
                ))}
             </div>
          </div>

          {/* 数据面板 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117', padding:10, gap: 10, overflow:'auto' }}>

             {/* 队列 */}
             <div style={{background:THEME.panel, padding:8, borderRadius:4, border:`1px solid ${THEME.border}`}}>
                <div style={{fontSize:11, color:THEME.textMuted, marginBottom:5}}>Queue (Indegree=0 Nodes)</div>
                <div style={{display:'flex', gap:5, minHeight:24, flexWrap:'wrap'}}>
                    <AnimatePresence>
                        {curState.queue.length === 0 ? <span style={{fontSize:12, color:'#444'}}>Empty</span> :
                         curState.queue.map(id => (
                             <motion.div key={id} layout initial={{opacity:0, scale:0}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0}}
                                style={{
                                    width:24, height:24, borderRadius:'50%', background:THEME.zeroIndegree,
                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:'bold'
                                }}>
                                {nodes.find(n=>n.id===id)?.label}
                             </motion.div>
                         ))
                        }
                    </AnimatePresence>
                </div>
             </div>

             {/* 入度表 */}
             <div style={{background:THEME.panel, padding:8, borderRadius:4, border:`1px solid ${THEME.border}`, flex:1, display:'flex', flexDirection:'column'}}>
                 <div style={{fontSize:11, color:THEME.textMuted, marginBottom:5, borderBottom:`1px solid ${THEME.border}`}}>Indegree Table</div>
                 <div style={{overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:2}}>
                     {nodes.map(n => renderIndegreeRow(n))}
                 </div>
             </div>

             {/* 结果序列 */}
             <div style={{background:THEME.panel, padding:8, borderRadius:4, border:`1px solid ${THEME.border}`}}>
                <div style={{fontSize:11, color:THEME.textMuted, marginBottom:5}}>Sorted Result</div>
                <div style={{fontSize:13, color:THEME.sorted, fontWeight:'bold', wordBreak:'break-all'}}>
                    {curState.result.map(id => nodes.find(n=>n.id===id)?.label).join(' → ')}
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ================== Tooltip & Style ==================
const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', bottom: '100%', left: '50%', x: '-50%', marginBottom: 8,
              background: THEME.tooltipBg, color: '#fff', padding: '5px 10px', borderRadius: 4,
              fontSize: 12, whiteSpace: 'pre-line', zIndex: 100, textAlign: 'center', minWidth: 120, pointerEvents: 'none'
            }}
          >
            {text}
            <div style={{ position: 'absolute', top: '100%', left: '50%', marginLeft: -4, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `4px solid ${THEME.tooltipBg}` }}></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const btnStyle = (bg) => ({
  padding: '5px 12px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
});
const iconBtnStyle = (bg) => ({
    padding: '5px 10px', borderRadius: 4, background: bg, color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
});
const selectStyle = {
  background: '#0d1117', color: 'white', border: `1px solid ${THEME.border}`, padding: '4px', borderRadius: 4, fontSize: 12
};
const groupStyle = {
  display: 'flex', alignItems: 'center', gap: 5, background: '#0d1117', padding: '2px 8px', borderRadius: 4, border:`1px solid ${THEME.border}`
};
const labelStyle = {
  position: 'absolute', top: 10, left: 10, color: '#8b949e', fontSize: 12, fontWeight: 'bold', pointerEvents: 'none', zIndex: 20,
  background: 'rgba(13, 17, 23, 0.6)', padding: '2px 6px', borderRadius: 4
};
const panelHeaderStyle = {
    padding: '6px 12px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: 11, fontWeight: 'bold', color: '#8b949e'
};

export default TopologicalSortVisualizer;