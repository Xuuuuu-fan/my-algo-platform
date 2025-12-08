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
  veColor: '#2ea043',     // 最早发生时间 (绿)
  vlColor: '#a371f7',     // 最迟发生时间 (紫)
  critical: '#da3633',    // 关键路径 (红)
  edgeDefault: '#30363d',
  highlight: 'rgba(255,255,255,0.1)',
  tooltipBg: '#6e7681'
};

const NODE_R = 26;

// 伪代码
const CODE_LINES = [
  { id: 1, text: "void CriticalPath(Graph G) {", indent: 0 },
  { id: 2, text: "    // 1. 正向拓扑排序求 ve (最早发生)", indent: 2 },
  { id: 3, text: "    ve[] = 0; Stack T;", indent: 2 },
  { id: 4, text: "    while (!T.empty()) {", indent: 2 },
  { id: 5, text: "        u = T.pop(); push u to Stack S;", indent: 4 },
  { id: 6, text: "        for (v, w : neighbors(u))", indent: 4 },
  { id: 7, text: "            if (ve[u] + w > ve[v]) ve[v] = ve[u] + w;", indent: 6 },
  { id: 8, text: "    }", indent: 2 },
  { id: 9, text: "    // 2. 逆向拓扑排序求 vl (最迟发生)", indent: 2 },
  { id: 10, text: "    vl[] = ve[end];", indent: 2 },
  { id: 11, text: "    while (!S.empty()) {", indent: 2 },
  { id: 12, text: "        u = S.pop();", indent: 4 },
  { id: 13, text: "        for (v, w : neighbors(u))", indent: 4 },
  { id: 14, text: "            if (vl[v] - w < vl[u]) vl[u] = vl[v] - w;", indent: 6 },
  { id: 15, text: "    }", indent: 2 },
  { id: 16, text: "    // 3. 判断关键活动 (e == l)", indent: 2 },
  { id: 17, text: "    for (edge(u, v) : G) {", indent: 2 },
  { id: 18, text: "        e = ve[u]; l = vl[v] - w;", indent: 4 },
  { id: 19, text: "        if (e == l) MarkCritical(u, v);", indent: 4 },
  { id: 20, text: "    }", indent: 2 },
  { id: 21, text: "}", indent: 0 },
];

const CPMVisualizer = () => {
  const containerRef = useRef(null);
  const logsContainerRef = useRef(null);

  // ================== 数据状态 ==================
  const [nodes, setNodes] = useState([
    { id: 0, label: 'v1', x: 80, y: 200 },
    { id: 1, label: 'v2', x: 200, y: 100 },
    { id: 2, label: 'v3', x: 200, y: 300 },
    { id: 3, label: 'v4', x: 350, y: 100 },
    { id: 4, label: 'v5', x: 350, y: 300 },
    { id: 5, label: 'v6', x: 500, y: 200 },
  ]);

  const [edges, setEdges] = useState([
    { from: 0, to: 1, weight: 3 },
    { from: 0, to: 2, weight: 2 },
    { from: 1, to: 3, weight: 2 },
    { from: 1, to: 4, weight: 3 },
    { from: 2, to: 3, weight: 4 },
    { from: 2, to: 4, weight: 3 },
    { from: 3, to: 5, weight: 2 },
    { from: 4, to: 5, weight: 1 }
  ]);

  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1, weight: 1 });

  // ================== 算法执行状态 ==================
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // ================== 核心算法: 关键路径 ==================
  const generateCPM = () => {
    const N = nodes.length;
    const adj = Array(N).fill(null).map(() => []);
    const inDegree = Array(N).fill(0);
    const newSteps = [];
    const logHistory = [];

    // 构建图 & 计算入度
    edges.forEach(e => {
        if(e.from < N && e.to < N) {
            adj[e.from].push({ to: e.to, w: e.weight });
            inDegree[e.to]++;
        }
    });

    // 状态变量
    const ve = Array(N).fill(0); // Earliest start for EVENT
    const vl = Array(N).fill(Infinity); // Latest start for EVENT
    const topoOrder = []; // Stack S for reverse pass
    const criticalEdges = new Set(); // ID string "u-v"

    // 辅助快照
    const pushStep = (phase, line, msg, activeU = null, activeV = null, highlightEdges = []) => {
        const timestamp = new Date().toLocaleTimeString('en-US', {hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit"});
        logHistory.push(`[${timestamp}] ${msg}`);
        newSteps.push({
            ve: [...ve],
            vl: [...vl],
            criticalEdges: new Set(criticalEdges),
            phase, // 'forward', 'backward', 'check'
            activeU,
            activeV,
            line,
            logs: [...logHistory],
            highlightEdges // 临时高亮的边
        });
    };

    // === Phase 1: 正向拓扑排序求 ve ===
    pushStep('forward', 2, "阶段一：正向拓扑排序，计算事件最早发生时间 (ve)");

    const queue = [];
    inDegree.forEach((d, i) => { if(d === 0) queue.push(i); });

    while(queue.length > 0) {
        const u = queue.shift();
        topoOrder.push(u); // 压入栈，供逆向使用
        pushStep('forward', 5, `节点 ${nodes[u].label} 拓扑出队，当前 ve[${nodes[u].label}] = ${ve[u]}`, u);

        adj[u].forEach(({to: v, w}) => {
            inDegree[v]--;
            if(inDegree[v] === 0) queue.push(v);

            const oldVe = ve[v];
            if (ve[u] + w > ve[v]) {
                ve[v] = ve[u] + w;
                pushStep('forward', 7, `松弛边 ${nodes[u].label}->${nodes[v].label} (w=${w}): ve[${nodes[v].label}] 更新 ${oldVe} -> ${ve[v]} (取Max)`, u, v, [`${u}-${v}`]);
            } else {
                pushStep('forward', 7, `检查边 ${nodes[u].label}->${nodes[v].label} (w=${w}): ve[${nodes[u].label}](${ve[u]}) + ${w} <= ve[${nodes[v].label}](${ve[v]})，不更新`, u, v, [`${u}-${v}`]);
            }
        });
    }

    if (topoOrder.length < N) {
        pushStep('error', 13, "错误：图中存在环，无法进行关键路径分析！");
        return newSteps;
    }

    // === Phase 2: 逆向拓扑排序求 vl ===
    const maxVe = Math.max(...ve);
    // 初始化终点 vl
    vl.fill(maxVe); // 汇点 vl = ve，其他人初始化为终点时间（或 Infinity，但实际上初始化为 maxVe 更符合逻辑起点）

    // 正确的做法：汇点的 vl = ve，其他初始化为 Infinity (或者足够大)。
    // 但在 AOE 网中，通常只有一个汇点。如果有多个，通常在这个阶段把所有无出度点的 vl 设为 ve[u]。
    // 简单起见，我们假设最后一个拓扑序的点是汇点，或者所有无后继点的 vl = ve
    // 更严谨：从拓扑序列逆序遍历，初始化 vl[u] = ve[u] (如果是汇点)，否则 min
    // 这里采用标准算法：所有点初始化为最终工期 maxVe

    pushStep('backward', 9, `阶段二：逆向扫描，计算事件最迟发生时间 (vl)。初始化所有 vl = ${maxVe}`);

    for (let i = topoOrder.length - 1; i >= 0; i--) {
        const u = topoOrder[i];

        // 如果是汇点（没有后继），vl[u] 默认为 ve[u]
        if (adj[u].length === 0) {
             vl[u] = ve[u];
             pushStep('backward', 10, `汇点 ${nodes[u].label}：vl = ve = ${ve[u]}`, u);
        }

        // 此时 vl[u] 应该已经被后继更新过了（因为是逆拓扑序）。
        // 等等，标准写法是：u 的 vl 由 v 更新：vl[u] = min(vl[v] - w)
        // 所以我们不需要在这里初始化，而是在处理后继 v 的时候更新前驱 u？
        // 不，逆拓扑序意味着当我们处理 u 时，u 的所有后继 v 已经处理完毕，vl[v] 已知。
        // 所以我们可以遍历 u 的所有邻居 v，用 vl[v] 来更新 vl[u]。

        adj[u].forEach(({to: v, w}) => {
             // 这一步其实是在 Forward 循环里做的...
             // 逆向时，我们需要知道 "谁指向了我"。
             // 或者，我们保持上面的结构：
             // 当我们取出 u (从栈顶)，我们看 u 指向谁？ v。
             // 此时 vl[v] 是已知的吗？不，u 在 v 之前。逆序是 v 先于 u。
             // 所以：逆序遍历 stack，取出 u。此时 u 是靠后的点。
             // 我们需要用 u 去更新 指向 u 的点？ 这样需要逆邻接表。

             // 另一种写法：
             // 初始化 vl 为 maxVe。
             // 逆序遍历 u。对于 u 的每个邻居 v：vl[u] = min(vl[u], vl[v] - w) <-- 这不对，这是由后继定前驱
             // 正确逻辑：
             // u 是前驱，v 是后继。
             // vl[u] = min(vl[v] - w) for all v in adj[u]
             // 因为是逆拓扑序，处理 u 时，所有 v 都已经处理过了（v 在 u 后面）。
             // 所以 vl[v] 已经是最终确定的值。
        });

        // 修正后的 Phase 2 逻辑：
        if (adj[u].length > 0) {
             // 如果不是汇点，重置为 Infinity 以便取 Min
             // 但如果初始化全为 maxVe，则只需要 min 操作即可
             let minVal = Infinity;
             adj[u].forEach(({to: v, w}) => {
                 if (vl[v] - w < minVal) minVal = vl[v] - w;
             });
             // 如果是汇点保持 maxVe，否则更新
             if (minVal !== Infinity) {
                 vl[u] = minVal;
                 pushStep('backward', 14, `节点 ${nodes[u].label} 回溯：vl[${nodes[u].label}] = min(vl[邻居] - w) = ${vl[u]}`, u);
             }
        }
    }

    // === Phase 3: 识别关键活动 ===
    pushStep('check', 16, "阶段三：对比每条边的 e (早开) 和 l (晚开)");

    edges.forEach(e => {
        const u = e.from;
        const v = e.to;
        const w = e.weight;
        if(u >= N || v >= N) return;

        const earlyStart = ve[u];           // e(i) = ve(u)
        const lateStart = vl[v] - w;        // l(i) = vl(v) - w

        const isCritical = Math.abs(earlyStart - lateStart) < 0.001;

        if (isCritical) {
            criticalEdges.add(`${u}-${v}`);
            pushStep('check', 19, `活动 <${nodes[u].label}→${nodes[v].label}>: e=${earlyStart}, l=${lateStart}。相等！➔ 关键路径`, u, v, [`${u}-${v}`]);
        } else {
            pushStep('check', 18, `活动 <${nodes[u].label}→${nodes[v].label}>: e=${earlyStart}, l=${lateStart}。有余量。`, u, v, [`${u}-${v}`]);
        }
    });

    pushStep('finish', 21, `分析完成。关键路径长度: ${maxVe}`);
    return newSteps;
  };

  // ================== 控制逻辑 ==================
  const reset = () => { setIsAutoPlaying(false); setCurrentStep(-1); setSteps([]); };

  const startAlgo = () => {
      reset();
      const s = generateCPM();
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

  const defaultLogs = ["准备就绪。绘制 AOE 网 (有向无环图)，点击「开始分析」。"];
  const curState = steps[currentStep] || {
    ve: Array(nodes.length).fill(0),
    vl: Array(nodes.length).fill('?'),
    criticalEdges: new Set(),
    phase: 'idle',
    activeU: null,
    highlightEdges: [],
    line: -1,
    logs: defaultLogs
  };

  // ================== 编辑逻辑 ==================
  const updateNodePos = (id, info) => setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
  const addNode = () => {
    reset();
    const newId = nodes.length;
    const label = `v${newId + 1}`;
    setNodes([...nodes, {id: newId, label, x: 50+Math.random()*200, y:50+Math.random()*200}]);
  };
  const addEdge = () => {
    const { from, to, weight } = edgeInput;
    const u = Number(from); const v = Number(to); const w = Number(weight);
    if (u === v) return;
    const other = edges.filter(e => !(e.from === u && e.to === v));
    setEdges([...other, {from: u, to: v, weight: w}]);
    reset();
  };
  const removeEdge = () => {
    const { from, to } = edgeInput; const u = Number(from); const v = Number(to);
    setEdges(edges.filter(e => !(e.from === u && e.to === v)));
    reset();
  };
  const deleteEdgeByObj = (e) => {
      setEdges(edges.filter(ed => ed !== e)); reset();
  };

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, marginRight: 10 }}>关键路径 (CPM)</h3>

        {/* 编辑区 */}
        <button onClick={addNode} style={btnStyle(THEME.accent)}>+ 事件(点)</button>

        <div style={groupStyle}>
            <select value={edgeInput.from} onChange={e=>setEdgeInput({...edgeInput, from:e.target.value})} style={selectStyle}>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <span style={{color: THEME.textMuted}}>➔</span>
            <select value={edgeInput.to} onChange={e=>setEdgeInput({...edgeInput, to:e.target.value})} style={selectStyle}>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <span style={{color: THEME.textMuted, fontSize:12, marginLeft:5}}>Cost:</span>
            <input type="number" value={edgeInput.weight} onChange={e=>setEdgeInput({...edgeInput, weight:e.target.value})} style={{...selectStyle, width:40, textAlign:'center'}} />
            <button onClick={addEdge} style={btnStyle(THEME.border)}>连线/更新</button>
            <button onClick={removeEdge} style={btnStyle(THEME.critical)}>删除</button>
        </div>

        <div style={{flex:1}}></div>
        <button onClick={startAlgo} style={btnStyle(THEME.veColor)}>开始分析</button>
        <div style={{display:'flex', gap:2}}>
             <button onClick={prevStep} style={iconBtnStyle(THEME.accent)} disabled={currentStep<=0}>◀</button>
             <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} style={btnStyle(THEME.active)} style={{...btnStyle(THEME.active), width: 80}}>
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
                <div style={labelStyle}>AOE Network</div>

                {/* 图例 */}
                <div style={{position:'absolute', top: 10, right: 10, fontSize:11, background:'rgba(0,0,0,0.5)', padding:5, borderRadius:4, zIndex:20}}>
                    <div style={{color:THEME.veColor}}>● ve: 最早发生</div>
                    <div style={{color:THEME.vlColor}}>● vl: 最迟发生</div>
                    <div style={{color:THEME.critical}}>━ 关键路径 (e=l)</div>
                </div>

                <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
                    <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="26" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L9,3 z" fill={THEME.border} />
                        </marker>
                    </defs>
                    {edges.map((e, i) => {
                    const s = nodes.find(n => n.id === e.from);
                    const t = nodes.find(n => n.id === e.to);
                    if(!s || !t) return null;

                    const isCritical = curState.criticalEdges.has(`${e.from}-${e.to}`);
                    const isHighlight = curState.highlightEdges.includes(`${e.from}-${e.to}`);

                    let stroke = '#30363d';
                    let width = 1.5;

                    if (isCritical) { stroke = THEME.critical; width = 4; }
                    else if (isHighlight) { stroke = THEME.accent; width = 3; }

                    return (
                        <g key={i} onDoubleClick={() => deleteEdgeByObj(e)} style={{cursor: 'pointer'}}>
                            <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="transparent" strokeWidth="15" />
                            <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={stroke} strokeWidth={width} markerEnd="url(#arrow)"/>
                            <g transform={`translate(${(s.x+t.x)/2}, ${(s.y+t.y)/2})`}>
                                <rect x={-10} y={-8} width={20} height={16} rx={4} fill="#0d1117" stroke={stroke} strokeWidth={1} />
                                <text x={0} y={4} textAnchor="middle" fill={THEME.text} fontSize={10} fontWeight="bold">{e.weight}</text>
                            </g>
                        </g>
                    );
                    })}
                </svg>

                {nodes.map(n => {
                    const isActive = n.id === curState.activeU || n.id === curState.activeV;
                    const veVal = curState.ve[n.id];
                    const vlVal = curState.vl[n.id];

                    return (
                    <motion.div key={n.id}
                        drag dragMomentum={false} dragConstraints={containerRef}
                        onDragEnd={(e, i) => updateNodePos(n.id, i)}
                        animate={{ x: n.x - NODE_R, y: n.y - NODE_R, scale: isActive ? 1.1 : 1 }}
                        style={{
                        position: 'absolute', top: 0, left: 0,
                        width: NODE_R*2, height: NODE_R*2,
                        borderRadius: '50%', background: '#161b22',
                        color: THEME.text, border: `2px solid ${isActive ? THEME.accent : THEME.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                        cursor: 'move', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10
                        }}
                    >
                        {n.label}

                        {/* 参数显示 (上: ve, 下: vl) */}
                        <div style={{position:'absolute', top: -18, color: THEME.veColor, fontSize: 10, fontWeight:'bold'}}>
                            {veVal}
                        </div>
                        <div style={{position:'absolute', bottom: -18, color: vlVal===Infinity?'#666':THEME.vlColor, fontSize: 10, fontWeight:'bold'}}>
                            {vlVal === Infinity ? '?' : vlVal}
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

        {/* === 右侧区域 (代码 + 参数表) === */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', background: THEME.panel, borderLeft: `1px solid ${THEME.border}` }}>

          {/* 代码区 */}
          <div style={{ height: '40%', display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${THEME.border}` }}>
             <div style={panelHeaderStyle}>Critical Path Method</div>
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

          {/* 参数表 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
             <div style={panelHeaderStyle}>Node Parameters</div>
             <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
                 <table style={{width:'100%', borderCollapse:'collapse', fontSize:12, color:THEME.text}}>
                     <thead>
                         <tr style={{borderBottom:`1px solid ${THEME.border}`, color:THEME.textMuted}}>
                             <th style={{textAlign:'left', padding:4}}>Event</th>
                             <th style={{textAlign:'center', padding:4, color:THEME.veColor}}>ve (Early)</th>
                             <th style={{textAlign:'center', padding:4, color:THEME.vlColor}}>vl (Late)</th>
                             <th style={{textAlign:'center', padding:4}}>Slack</th>
                         </tr>
                     </thead>
                     <tbody>
                         {nodes.map(n => {
                             const ve = curState.ve[n.id];
                             const vl = curState.vl[n.id];
                             const slack = (vl === Infinity) ? '-' : (vl - ve);
                             const isCritical = slack === 0;

                             return (
                                 <tr key={n.id} style={{background: isCritical && curState.phase==='finish' ? 'rgba(218, 54, 51, 0.1)' : 'transparent'}}>
                                     <td style={{padding:4, fontWeight:'bold'}}>{n.label}</td>
                                     <td style={{padding:4, textAlign:'center'}}>{ve}</td>
                                     <td style={{padding:4, textAlign:'center'}}>{vl===Infinity ? '-' : vl}</td>
                                     <td style={{padding:4, textAlign:'center', color: isCritical && curState.phase==='finish' ? THEME.critical : THEME.textMuted}}>
                                         {slack}
                                     </td>
                                 </tr>
                             )
                         })}
                     </tbody>
                 </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================== 样式 ==================
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

export default CPMVisualizer;