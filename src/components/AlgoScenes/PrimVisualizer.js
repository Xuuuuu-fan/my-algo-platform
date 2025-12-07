import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 深色主题配置 (IDE 风格) ==================
const THEME = {
  bg: '#0d1117',        // 全局背景
  panel: '#161b22',     // 面板背景
  border: '#30363d',    // 边框
  text: '#c9d1d9',      // 主文本
  textMuted: '#8b949e', // 辅助文本

  // 颜色定义
  accent: '#58a6ff',      // 蓝色 (用于选中/步进)
  success: '#238636',     // 绿色 (MST边/已访问节点)
  warning: '#d29922',     // 橙色 (当前刚加入的节点)
  danger: '#da3633',      // 红色 (丢弃/无效)
  purple: '#a371f7',      // 紫色 (当前检查的候选边)

  // 组件特定
  nodeBg: '#1f6feb',      // 默认节点蓝
  codeBg: '#0d1117',      // 代码区背景
  listActiveBg: 'rgba(46, 160, 67, 0.2)', // 列表选中项背景
  listCandidateBg: 'rgba(255, 255, 255, 0.05)', // 候选背景
};

const NODE_R = 22;

// Prim 伪代码
const CODE_LINES = [
  { id: 1, text: "void Prim(Graph G, int start) {", indent: 0 },
  { id: 2, text: "    MST = {}; Visited = {start};", indent: 2 },
  { id: 3, text: "    PQ.add(edges from start);", indent: 2 },
  { id: 4, text: "    while (!PQ.empty()) {", indent: 2 },
  { id: 5, text: "        edge(u, v) = PQ.popMin();", indent: 4 },
  { id: 6, text: "        if (v is not in Visited) {", indent: 4 },
  { id: 7, text: "            Visited.add(v);", indent: 6 },
  { id: 8, text: "            MST.add(edge);", indent: 6 },
  { id: 9, text: "            PQ.add(edges from v);", indent: 6 },
  { id: 10, text: "       }", indent: 4 },
  { id: 11, text: "    }", indent: 2 },
  { id: 12, text: "}", indent: 0 },
];

const PrimVisualizer = () => {
  const containerRef = useRef(null);

  // ================== 数据状态 ==================
  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 200, y: 80 },
    { id: 1, label: 'B', x: 100, y: 200 },
    { id: 2, label: 'C', x: 300, y: 200 },
    { id: 3, label: 'D', x: 150, y: 320 },
    { id: 4, label: 'E', x: 350, y: 320 },
  ]);

  const [edges, setEdges] = useState([
    { from: 0, to: 1, weight: 2, id: 'A-B' },
    { from: 0, to: 2, weight: 3, id: 'A-C' },
    { from: 1, to: 2, weight: 1, id: 'B-C' },
    { from: 1, to: 3, weight: 4, id: 'B-D' },
    { from: 2, to: 3, weight: 5, id: 'C-D' },
    { from: 2, to: 4, weight: 2, id: 'C-E' },
    { from: 3, to: 4, weight: 6, id: 'D-E' }
  ]);

  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1, weight: 1 });
  const [startNodeId, setStartNodeId] = useState(0);

  // ================== 算法执行状态 ==================
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // 获取邻接表
  const getAdjacency = () => {
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      adj[e.from].push({ to: e.to, weight: e.weight, id: e.id });
      adj[e.to].push({ to: e.from, weight: e.weight, id: e.id });
    });
    return adj;
  };

  // ================== Prim 核心逻辑 ==================
  const generatePrim = (rootId) => {
    const adj = getAdjacency();
    const newSteps = [];

    const visited = new Set();
    const mstEdges = [];
    // 优先队列，存储对象: { from, to, weight, id }
    let pq = [];
    let totalWeight = 0;

    // 辅助：记录当前状态快照
    // pqStatus: 'checking' | 'candidate'
    const pushStep = (currentEdgeId, line, desc, activeNode = null) => {
      // 对 PQ 进行排序，模拟最小堆
      const sortedPQ = [...pq].sort((a, b) => a.weight - b.weight);

      newSteps.push({
        visited: new Set(visited),
        mstEdges: [...mstEdges],
        pq: sortedPQ,
        // 用于列表渲染：MST边 + 当前PQ边
        displayList: [
            ...mstEdges.map(e => ({...e, status: 'accepted'})),
            ...sortedPQ.map(e => ({...e, status: e.id === currentEdgeId ? 'checking' : 'candidate'}))
        ],
        activeNode,
        currentEdgeId,
        totalWeight,
        line,
        desc
      });
    };

    // Step 0: Init
    visited.add(rootId);
    if (adj[rootId]) {
        adj[rootId].forEach(e => {
            pq.push({ from: rootId, to: e.to, weight: e.weight, id: e.id });
        });
    }
    pushStep(null, 3, `初始化：从节点 ${nodes.find(n=>n.id===rootId)?.label} 开始，将其邻接边加入优先队列`, rootId);

    // Step 1: Loop
    while (pq.length > 0) {
        // 1.1 Sort (Simulate popMin)
        pq.sort((a, b) => a.weight - b.weight);
        const bestEdge = pq[0];

        // 1.2 Peek & Check
        pushStep(bestEdge.id, 5, `检查队列中最小权重的边: <${nodes[bestEdge.from]?.label}-${nodes[bestEdge.to]?.label}> (w=${bestEdge.weight})`);

        // 1.3 Remove form PQ
        pq.shift();

        // 1.4 Process
        if (!visited.has(bestEdge.to)) {
            // Add to MST
            visited.add(bestEdge.to);
            mstEdges.push(bestEdge);
            totalWeight += bestEdge.weight;

            // Add neighbors to PQ
            if (adj[bestEdge.to]) {
                adj[bestEdge.to].forEach(e => {
                    if (!visited.has(e.to)) {
                        pq.push({ from: bestEdge.to, to: e.to, weight: e.weight, id: e.id });
                    }
                });
            }
            pushStep(bestEdge.id, 8, `选中！节点 ${nodes[bestEdge.to]?.label} 加入 MST，将其邻接边加入队列`, bestEdge.to);
        } else {
            // Already visited (Cycle)
            // 在 Prim 中，如果是延迟删除策略，这里直接跳过。
            // 为了演示效果，我们可以记录一个短暂的“拒绝”状态，但 Prim 的标准展示通常只关注队列中的有效边。
            // 这里我们选择不显示已拒绝的边在列表中（因为它们已经出队了），但在图中可以闪烁一下红色。
             newSteps.push({
                visited: new Set(visited),
                mstEdges: [...mstEdges],
                pq: [...pq],
                displayList: [...mstEdges.map(e=>({...e, status:'accepted'})), ...pq.map(e=>({...e, status:'candidate'}))],
                activeNode: null,
                currentEdgeId: bestEdge.id,
                rejectedEdgeId: bestEdge.id, // 标记拒绝
                totalWeight,
                line: 6,
                desc: `节点 ${nodes[bestEdge.to]?.label} 已在 MST 中，忽略此边 (避免环)`
            });
        }
    }

    pushStep(null, 12, `优先队列为空，最小生成树构建完成。总权重: ${totalWeight}`);
    return newSteps;
  };

  // ================== 播放控制 ==================
  const reset = () => { setIsAutoPlaying(false); setCurrentStep(-1); setSteps([]); };
  const startAlgo = () => {
      reset();
      // 检查 Start Node 是否存在
      const root = nodes.find(n => n.id === startNodeId) ? startNodeId : nodes[0].id;
      const s = generatePrim(root);
      setSteps(s);
      setCurrentStep(0);
      setIsAutoPlaying(true);
  };
  const nextStep = () => { if (currentStep < steps.length - 1) setCurrentStep(p => p + 1); else setIsAutoPlaying(false); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(p => p - 1); setIsAutoPlaying(false); };

  useEffect(() => {
    let interval;
    if (isAutoPlaying && currentStep < steps.length - 1) interval = setInterval(nextStep, 1500);
    else setIsAutoPlaying(false);
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep, steps]);

  const curState = steps[currentStep] || {
    visited: new Set(), displayList: [], currentEdgeId: null, rejectedEdgeId: null, activeNode: null, totalWeight: 0, line: -1,
    desc: "准备就绪"
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
    const { from, to, weight } = edgeInput;
    const u = Number(from); const v = Number(to); const w = Number(weight);
    if (u === v) return;
    const id = `${Math.min(u,v)}-${Math.max(u,v)}`;
    const other = edges.filter(e => !((e.from === u && e.to === v) || (e.from === v && e.to === u)));
    setEdges([...other, {from: u, to: v, weight: w, id}]);
    reset();
  };
  const removeEdge = () => {
    const { from, to } = edgeInput; const u = Number(from); const v = Number(to);
    setEdges(edges.filter(e => !((e.from === u && e.to === v) || (e.from === v && e.to === u))));
    reset();
  };
  const deleteEdgeById = (edgeId) => {
    setEdges(edges.filter(e => e.id !== edgeId));
    reset();
  };

  return (
    <div style={{ fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh', background: THEME.bg, color: THEME.text }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, marginRight: 10 }}>Prim 最小生成树</h3>

        {/* 编辑组 */}
        <button onClick={addNode} style={btnStyle(THEME.accent)}>+ 节点</button>
        <div style={groupStyle}>
            <select value={edgeInput.from} onChange={e=>setEdgeInput({...edgeInput, from:e.target.value})} style={selectStyle}>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <span style={{color: THEME.textMuted}}>-</span>
            <select value={edgeInput.to} onChange={e=>setEdgeInput({...edgeInput, to:e.target.value})} style={selectStyle}>
                {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <span style={{color: THEME.textMuted, fontSize:12, marginLeft:5}}>w:</span>
            <input type="number" value={edgeInput.weight} onChange={e=>setEdgeInput({...edgeInput, weight:e.target.value})} style={{...selectStyle, width:40, textAlign:'center'}} />
            <button onClick={addEdge} style={btnStyle(THEME.border)}>连线</button>
            <button onClick={removeEdge} style={btnStyle(THEME.danger)}>删除</button>
        </div>

        <div style={{flex:1}}></div>
        <div style={{fontSize:14, fontWeight:'bold', color: THEME.success}}>
           MST Weight: {curState.totalWeight}
        </div>
      </div>

      {/* 播放控制栏 */}
      <div style={{ padding: '8px 20px', background: '#010409', borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{display:'flex', alignItems:'center', gap:5, marginRight: 10}}>
                <label style={{fontSize:12}}>Start:</label>
                <select value={startNodeId} onChange={e=>{reset(); setStartNodeId(Number(e.target.value))}} style={selectStyle}>
                    {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
          </div>

          <button onClick={startAlgo} style={btnStyle(THEME.success)}>开始生成</button>

          <div style={{display:'flex', gap:2}}>
             <button onClick={prevStep} style={iconBtnStyle(THEME.accent)} disabled={currentStep<=0}>◀</button>
             <button onClick={() => setIsAutoPlaying(!isAutoPlaying)} style={btnStyle(THEME.warning)} style={{...btnStyle(THEME.warning), width: 80}}>
                {isAutoPlaying ? "暂停" : "播放"}
             </button>
             <button onClick={nextStep} style={iconBtnStyle(THEME.accent)} disabled={currentStep >= steps.length-1}>▶</button>
          </div>

          <button onClick={reset} style={btnStyle(THEME.border)}>重置</button>
          <span style={{marginLeft:'auto', fontSize:12, color:THEME.textMuted}}>{curState.desc}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* === 左侧：图可视化 === */}
        <div ref={containerRef} style={{ flex: 1.8, position: 'relative', borderRight: `1px solid ${THEME.border}`, background: '#0d1117' }}>
          <div style={labelStyle}>Weighted Graph (Prim)</div>
          <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.from);
              const t = nodes.find(n => n.id === e.to);

              // 状态判定
              // 1. MST 中的边
              const isMST = curState.displayList.some(item => item.id === e.id && item.status === 'accepted');
              // 2. 当前正在检查的边
              const isChecking = e.id === curState.currentEdgeId;
              // 3. 刚被拒绝的边
              const isRejected = e.id === curState.rejectedEdgeId;
              // 4. 在优先队列中等待的边
              const isCandidate = curState.displayList.some(item => item.id === e.id && item.status === 'candidate');

              let stroke = '#30363d';
              let width = 1.5;
              let opacity = 1;
              let dash = 'none';

              if (isChecking) { stroke = THEME.purple; width = 5; }
              else if (isMST) { stroke = THEME.success; width = 4; }
              else if (isRejected) { stroke = THEME.danger; opacity = 0.4; }
              else if (isCandidate) { stroke = '#fff'; width = 2; opacity = 0.6; dash = '4,4'; } // 候选边虚线显示

              return s && t && (
                <g key={i} onDoubleClick={() => deleteEdgeById(e.id)} style={{cursor: 'pointer', opacity}}>
                    {/* 线条 */}
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={stroke} strokeWidth={width} strokeDasharray={dash} />
                    {/* 权重背景 */}
                    <rect x={(s.x+t.x)/2 - 12} y={(s.y+t.y)/2 - 9} width={24} height={18} rx={4} fill="#0d1117" stroke={stroke} strokeWidth={1} />
                    {/* 权重文字 */}
                    <text x={(s.x+t.x)/2} y={(s.y+t.y)/2 + 4} textAnchor="middle" fill={THEME.text} fontSize={11} fontWeight="bold">{e.weight}</text>
                </g>
              );
            })}
          </svg>

          {nodes.map(n => {
            const isVisited = curState.visited.has(n.id);
            const isActive = n.id === curState.activeNode;

            let bg = THEME.nodeBg;
            if (isVisited) bg = THEME.success;
            if (isActive) bg = THEME.warning;

            return (
              <motion.div key={n.id}
                drag dragMomentum={false} dragConstraints={containerRef}
                onDragEnd={(e, i) => updateNodePos(n.id, i)}
                animate={{ x: n.x - NODE_R, y: n.y - NODE_R, scale: isActive ? 1.2 : 1 }}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: NODE_R*2, height: NODE_R*2,
                  borderRadius: '50%', background: bg,
                  color: 'white', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                  cursor: 'move', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', zIndex: 10
                }}
              >
                {n.label}
              </motion.div>
            );
          })}
        </div>

        {/* === 右侧：代码与列表 === */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: THEME.panel, borderLeft: `1px solid ${THEME.border}` }}>

          {/* 上半部分：代码 */}
          <div style={{ height: '40%', display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${THEME.border}` }}>
             <div style={panelHeaderStyle}>Prim's Algorithm</div>
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

          {/* 下半部分：优先队列 + MST 列表 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
            <div style={{...panelHeaderStyle, display:'flex', justifyContent:'space-between'}}>
               <span>Priority Queue & MST</span>
               <span style={{fontSize:11, opacity:0.6}}>Size: {curState.displayList.length}</span>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <AnimatePresence>
                    {curState.displayList.map((edge, idx) => {
                        // 样式计算
                        const status = edge.status;
                        let bg = THEME.listCandidateBg;
                        let border = `1px solid ${THEME.border}`;
                        let color = THEME.textMuted;
                        let icon = <span style={{fontSize:10, opacity:0.5}}>...</span>;

                        if (status === 'accepted') {
                            bg = THEME.listActiveBg;
                            border = `1px solid ${THEME.success}`;
                            color = '#fff';
                            icon = <span style={{color: THEME.success}}>✔</span>;
                        } else if (status === 'checking') {
                            bg = 'rgba(163, 113, 247, 0.15)';
                            border = `1px solid ${THEME.purple}`;
                            color = '#fff';
                            icon = <span style={{fontSize:10, color:THEME.purple}}>●</span>;
                        } else if (status === 'candidate') {
                            // 候补
                            color = THEME.text;
                        }

                        return (
                            <motion.div
                                key={edge.id} layout
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                style={{
                                    display:'flex', alignItems:'center', justifyContent:'space-between',
                                    padding: '8px 12px', borderRadius: 4,
                                    background: bg, border: border, color: color,
                                    fontSize: 13, fontFamily: 'Consolas', fontWeight: status==='candidate'?'normal':'bold'
                                }}
                            >
                                <div style={{display:'flex', gap:10}}>
                                    <span>{nodes[edge.from]?.label} — {nodes[edge.to]?.label}</span>
                                </div>
                                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                                    <span>w={edge.weight}</span>
                                    <div style={{width:15, textAlign:'center'}}>{icon}</div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
                {curState.displayList.length === 0 && <div style={{textAlign:'center', color:THEME.textMuted, marginTop:20, fontSize:12}}>队列为空</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ================== 样式定义 ==================
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
    padding: '8px 12px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: 12, fontWeight: 'bold', color: '#8b949e'
};

export default PrimVisualizer;