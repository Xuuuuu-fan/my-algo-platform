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
  active: '#d29922',      // 当前处理的单元格 (橙)
  pivot: '#a371f7',       // 中转点 k (紫)
  success: '#2ea043',     // 更新成功 (绿)
  delete: '#da3633',      // 删除红
  infinity: '∞',
  highlight: 'rgba(255,255,255,0.05)',
  pathMatrixColor: '#da3633',
  tooltipBg: '#6e7681'
};

const NODE_R = 22;
const MAX_NODES = 7; // 限制节点数量以保证矩阵显示效果

// Floyd 伪代码
const CODE_LINES = [
  { id: 1, text: "void Floyd(Graph G) {", indent: 0 },
  { id: 2, text: "    // 初始化距离矩阵 D 和路径矩阵 P", indent: 2 },
  { id: 3, text: "    for (k = 0; k < N; k++) { // 中转点", indent: 2 },
  { id: 4, text: "        for (i = 0; i < N; i++) { // 起点", indent: 4 },
  { id: 5, text: "            for (j = 0; j < N; j++) { // 终点", indent: 6 },
  { id: 6, text: "                if (D[i][j] > D[i][k] + D[k][j]) {", indent: 8 },
  { id: 7, text: "                    D[i][j] = D[i][k] + D[k][j];", indent: 10 },
  { id: 8, text: "                    P[i][j] = P[k][j]; // 记录前驱", indent: 10 },
  { id: 9, text: "                }", indent: 8 },
  { id: 10, text: "            }", indent: 6 },
  { id: 11, text: "        }", indent: 4 },
  { id: 12, text: "    }", indent: 2 },
  { id: 13, text: "}", indent: 0 },
];

const FloydVisualizer = () => {
  const containerRef = useRef(null);
  const logsContainerRef = useRef(null);

  // ================== 数据状态 ==================
  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 100, y: 100 },
    { id: 1, label: 'B', x: 300, y: 100 },
    { id: 2, label: 'C', x: 300, y: 300 },
    { id: 3, label: 'D', x: 100, y: 300 },
  ]);

  const [edges, setEdges] = useState([
    { from: 0, to: 1, weight: 5 },
    { from: 1, to: 0, weight: 50 },
    { from: 0, to: 3, weight: 10 },
    { from: 1, to: 2, weight: 5 },
    { from: 2, to: 3, weight: 5 },
    { from: 3, to: 1, weight: 20 },
    { from: 0, to: 2, weight: 40 }
  ]);

  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1, weight: 1 });

  // ================== 算法执行状态 ==================
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // ================== Floyd 核心逻辑 ==================
  const generateFloyd = () => {
    const N = nodes.length;
    const newSteps = [];
    const logHistory = [];

    // 映射 ID 到 0..N-1 的索引
    const idToIndex = {};
    nodes.forEach((n, idx) => idToIndex[n.id] = idx);

    // D: 距离矩阵, P: 路径矩阵
    let D = Array(N).fill(null).map(() => Array(N).fill(Infinity));
    let P = Array(N).fill(null).map(() => Array(N).fill(-1));

    // 对角线为0
    for(let i=0; i<N; i++) { D[i][i] = 0; }

    // 填入初始边权
    edges.forEach(e => {
        const u = idToIndex[e.from];
        const v = idToIndex[e.to];
        if (u !== undefined && v !== undefined) {
            // 处理多重边，取最小权重
            if (e.weight < D[u][v]) {
                D[u][v] = e.weight;
                P[u][v] = u; // 初始化前驱为起点
            }
        }
    });

    // 辅助快照
    const pushStep = (k, i, j, line, msg, highlightCell = null) => {
        const timestamp = new Date().toLocaleTimeString('en-US', {hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit"});
        logHistory.push(`[${timestamp}] ${msg}`);

        newSteps.push({
            D: D.map(row => [...row]),
            P: P.map(row => [...row]),
            kNodeId: k === -1 ? -1 : nodes[k].id,
            iNodeId: i === -1 ? -1 : nodes[i].id,
            jNodeId: j === -1 ? -1 : nodes[j].id,
            line,
            logs: [...logHistory],
            highlightCell // {r, c, type: 'check'|'update'}
        });
    };

    pushStep(-1, -1, -1, 2, "初始化矩阵：D[i][j] = 边权，P[i][j] = i");

    // 三层循环
    for (let k = 0; k < N; k++) {
        pushStep(k, -1, -1, 3, `=== 第 ${k+1} 轮：以节点 ${nodes[k].label} 为中转点 (Pivot) ===`);

        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (i === j) continue;
                if (i === k || j === k) continue;

                const distIK = D[i][k];
                const distKJ = D[k][j];
                const currentDist = D[i][j];

                // 准备检查
                // pushStep(k, i, j, 6, `检查路径 ${nodes[i].label}→${nodes[j].label}`, {r:i, c:j, type:'check'});

                if (distIK !== Infinity && distKJ !== Infinity && currentDist > distIK + distKJ) {
                    D[i][j] = distIK + distKJ;
                    P[i][j] = P[k][j];

                    pushStep(k, i, j, 7,
                        `🚀 更新！${nodes[i].label}→${nodes[j].label} 经由 ${nodes[k].label} 更短：${currentDist === Infinity ? '∞' : currentDist} ➔ ${D[i][j]}`,
                        {r:i, c:j, type:'update'}
                    );
                }
            }
        }
    }

    pushStep(-1, -1, -1, 13, "算法结束。矩阵 D 即为任意两点间的最短距离。");
    return newSteps;
  };

  // ================== 控制逻辑 ==================
  const reset = () => { setIsAutoPlaying(false); setCurrentStep(-1); setSteps([]); };

  const startAlgo = () => {
      reset();
      const s = generateFloyd();
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
    if (isAutoPlaying && currentStep < steps.length - 1) interval = setInterval(nextStep, 500); // 速度适中
    else setIsAutoPlaying(false);
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep, steps]);

  const defaultLogs = ["准备就绪。请编辑图结构，点击「开始计算」。"];

  // ----------------------------------------------------
  // [修复点 1]：初始化矩阵 P 为二维数组，防止访问 P[0] 报错
  // ----------------------------------------------------
  const initialMatrix = Array(nodes.length).fill(null).map(()=>Array(nodes.length).fill(Infinity));
  const initialP = Array(nodes.length).fill(null).map(()=>Array(nodes.length).fill(-1));

  const curState = steps[currentStep] || {
    D: initialMatrix,
    P: initialP, // <--- 修复这里，使用 initialP
    kNodeId: -1, iNodeId: -1, jNodeId: -1, line: -1, logs: defaultLogs, highlightCell: null
  };

  // ================== 图编辑逻辑 (New) ==================
  const updateNodePos = (id, info) => setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));

  const addNode = () => {
    reset();
    if (nodes.length >= MAX_NODES) return alert(`为了矩阵显示效果，最多支持 ${MAX_NODES} 个节点`);
    const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
    const label = String.fromCharCode(65 + (nodes.length % 26));
    setNodes([...nodes, {id: newId, label, x: 50+Math.random()*200, y:50+Math.random()*200}]);
  };

  const addEdge = () => {
    const { from, to, weight } = edgeInput;
    const u = Number(from); const v = Number(to); const w = Number(weight);
    if (u === v) return;

    // 有向图：覆盖旧边
    const otherEdges = edges.filter(e => !(e.from === u && e.to === v));
    setEdges([...otherEdges, {from: u, to: v, weight: w}]);
    reset();
  };

  const removeEdge = () => {
    const { from, to } = edgeInput; const u = Number(from); const v = Number(to);
    setEdges(edges.filter(e => !(e.from === u && e.to === v)));
    reset();
  };

  const deleteEdgeByObj = (edge) => {
      setEdges(edges.filter(e => e !== edge));
      reset();
  };

  // 渲染矩阵单元格
  const renderCell = (row, col, val, isPathMatrix = false) => {
      // 安全检查：如果 nodes[row] 不存在，不渲染
      if (!nodes[row] || !nodes[col]) return null;

      const rowNodeId = nodes[row].id;
      const colNodeId = nodes[col].id;

      const isPivotRow = rowNodeId === curState.kNodeId;
      const isPivotCol = colNodeId === curState.kNodeId;
      const isTarget = curState.highlightCell && curState.highlightCell.r === row && curState.highlightCell.c === col;
      const isUpdate = isTarget && curState.highlightCell.type === 'update';

      let bg = 'transparent';
      let color = isPathMatrix ? THEME.pathMatrixColor : THEME.text;
      let fontWeight = 'normal';

      if (isTarget) {
          bg = isUpdate ? 'rgba(46, 160, 67, 0.3)' : 'rgba(210, 153, 34, 0.2)';
          fontWeight = 'bold';
      } else if (isPivotRow || isPivotCol) {
          bg = 'rgba(163, 113, 247, 0.1)';
      } else if (row === col) {
          bg = '#0d1117';
          color = THEME.textMuted;
      }

      let displayVal = val;
      if (!isPathMatrix && val === Infinity) displayVal = '∞';
      if (isPathMatrix) {
          if (val === -1) displayVal = '-';
          else {
              // P 存储的是 id 对应的 index
              displayVal = nodes[val]?.label || '-';
          }
      }

      return (
          <div key={`${row}-${col}`} style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${THEME.border}`, fontSize: 12, background: bg, color, fontWeight,
              transition: 'background 0.2s'
          }}>
              {displayVal}
          </div>
      );
  };

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, marginRight: 10 }}>Floyd 多源最短路径</h3>

        {/* 编辑区 */}
        <Tooltip text="添加新节点 (上限7个)">
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
            <span style={{color: THEME.textMuted, fontSize:12, marginLeft:5}}>w:</span>
            <input type="number" value={edgeInput.weight} onChange={e=>setEdgeInput({...edgeInput, weight:e.target.value})} style={{...selectStyle, width:40, textAlign:'center'}} />

            <Tooltip text="添加或更新带权边">
                <button onClick={addEdge} style={btnStyle(THEME.border)}>连线/更新</button>
            </Tooltip>
            <button onClick={removeEdge} style={btnStyle(THEME.delete)}>删除</button>
        </div>

        <div style={{flex:1}}></div>
        <button onClick={startAlgo} style={btnStyle(THEME.success)}>开始计算</button>
        <div style={{display:'flex', gap:2}}>
             <button onClick={prevStep} style={iconBtnStyle(THEME.accent)} disabled={currentStep<=0}>◀</button>
             <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} style={{...btnStyle(THEME.active), width: 80}}>
                {isAutoPlaying ? "暂停" : "播放"}
             </button>
             <button onClick={nextStep} style={iconBtnStyle(THEME.accent)} disabled={currentStep >= steps.length-1}>▶</button>
        </div>
        <button onClick={reset} style={btnStyle(THEME.border)}>重置</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* === 左侧区域 (图 + 日志) === */}
        <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${THEME.border}` }}>

            {/* 图可视化 */}
            <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#0d1117', overflow: 'hidden', minHeight: '300px' }}>
                <div style={labelStyle}>Directed Weighted Graph</div>
                <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="24" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L9,3 z" fill={THEME.border} />
                        </marker>
                        <marker id="arrow-active" markerWidth="10" markerHeight="10" refX="24" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L9,3 z" fill={THEME.active} />
                        </marker>
                    </defs>
                    {edges.map((e, i) => {
                    const s = nodes.find(n => n.id === e.from);
                    const t = nodes.find(n => n.id === e.to);
                    if (!s || !t) return null;

                    // 高亮正在检查的三条边逻辑较复杂，这里简单高亮涉及的节点连线
                    const isRelated = (curState.iNodeId === e.from && curState.kNodeId === e.to) || (curState.kNodeId === e.from && curState.jNodeId === e.to);

                    let stroke = '#30363d';
                    let width = 1.5;
                    let marker = "url(#arrow)";

                    if (isRelated) { stroke = THEME.active; width = 3; marker = "url(#arrow-active)"; }

                    return (
                        <g key={i} onDoubleClick={() => deleteEdgeByObj(e)} style={{cursor: 'pointer'}}>
                            <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={stroke} strokeWidth={width} markerEnd={marker} />
                            <g transform={`translate(${(s.x+t.x)/2}, ${(s.y+t.y)/2})`}>
                                <rect x={-10} y={-8} width={20} height={16} rx={4} fill="#0d1117" stroke={stroke} strokeWidth={1} />
                                <text x={0} y={4} textAnchor="middle" fill={THEME.text} fontSize={10} fontWeight="bold">{e.weight}</text>
                            </g>
                        </g>
                    );
                    })}
                </svg>

                {nodes.map(n => {
                    const isPivot = n.id === curState.kNodeId;
                    const isStart = n.id === curState.iNodeId;
                    const isEnd = n.id === curState.jNodeId;

                    let bg = THEME.bg;
                    let scale = 1;
                    let border = '2px solid #fff';

                    if (isPivot) { bg = THEME.pivot; scale = 1.2; border = `2px solid ${THEME.pivot}`; }
                    else if (isStart || isEnd) { bg = THEME.active; }
                    else { bg = '#1f6feb'; }

                    return (
                    <motion.div key={n.id}
                        drag dragMomentum={false} dragConstraints={containerRef}
                        onDragEnd={(e, i) => updateNodePos(n.id, i)}
                        animate={{ x: n.x - NODE_R, y: n.y - NODE_R, scale }}
                        style={{
                        position: 'absolute', top: 0, left: 0,
                        width: NODE_R*2, height: NODE_R*2,
                        borderRadius: '50%', background: bg,
                        color: 'white', border: border,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                        cursor: 'move', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10
                        }}
                    >
                        {n.label}
                        {isPivot && <div style={{position:'absolute', top:-18, fontSize:10, color: THEME.pivot, fontWeight:'bold'}}>Pivot</div>}
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

        {/* === 右侧区域 (Code + Matrix) === */}
        <div style={{ flex: 1.8, display: 'flex', flexDirection: 'column', background: THEME.panel, borderLeft: `1px solid ${THEME.border}` }}>

          {/* 代码区 */}
          <div style={{ height: '30%', display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${THEME.border}` }}>
             <div style={panelHeaderStyle}>Floyd-Warshall (O(n³))</div>
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

          {/* 矩阵可视化 */}
          <div style={{ flex: 1, display: 'flex', background: '#0d1117', overflow: 'hidden' }}>

             {/* 距离矩阵 D */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${THEME.border}` }}>
                 <div style={panelHeaderStyle}>Distance Matrix (D)</div>
                 <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: `30px repeat(${nodes.length}, 34px)`, gap: 1 }}>
                         <div />
                         {nodes.map(n => <div key={n.id} style={{textAlign:'center', fontSize:12, fontWeight:'bold', color:THEME.textMuted}}>{n.label}</div>)}

                         {nodes.map((rowNode, r) => (
                             <React.Fragment key={r}>
                                 <div style={{display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:'bold', color:THEME.textMuted}}>{rowNode.label}</div>
                                 {nodes.map((colNode, c) => renderCell(r, c, curState.D ? curState.D[r][c] : Infinity))}
                             </React.Fragment>
                         ))}
                     </div>
                 </div>
             </div>

             {/* 路径矩阵 P */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                 <div style={panelHeaderStyle}>Path Matrix (P)</div>
                 <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: `30px repeat(${nodes.length}, 34px)`, gap: 1 }}>
                         <div />
                         {nodes.map(n => <div key={n.id} style={{textAlign:'center', fontSize:12, fontWeight:'bold', color:THEME.textMuted}}>{n.label}</div>)}

                         {nodes.map((rowNode, r) => (
                             <React.Fragment key={r}>
                                 <div style={{display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:'bold', color:THEME.textMuted}}>{rowNode.label}</div>
                                 {nodes.map((colNode, c) => {
                                     // [修复点 2]: 安全访问 curState.P[r]
                                     const pIndex = curState.P && curState.P[r] ? curState.P[r][c] : -1;
                                     return renderCell(r, c, pIndex, true);
                                 })}
                             </React.Fragment>
                         ))}
                     </div>
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

export default FloydVisualizer;