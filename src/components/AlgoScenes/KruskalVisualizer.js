import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 深色主题配置 (复刻截图风格) ==================
const THEME = {
  bg: '#0d1117',        // 全局背景
  panel: '#161b22',     // 面板背景
  border: '#30363d',    // 边框
  text: '#c9d1d9',      // 主文本
  textMuted: '#8b949e', // 辅助文本

  // 颜色定义
  accent: '#58a6ff',      // 蓝色 (用于选中/步进)
  success: '#238636',     // 绿色 (开始按钮/MST边)
  warning: '#d29922',     // 黄色 (暂停/高亮节点)
  danger: '#da3633',      // 红色 (删除/拒绝)
  purple: '#a371f7',      // 紫色 (当前检查的边)

  // 组件特定
  nodeBg: '#1f6feb',      // 默认节点蓝
  codeBg: '#0d1117',      // 代码区背景
  listActiveBg: 'rgba(46, 160, 67, 0.2)', // 列表选中项背景
  listRejectBg: 'rgba(218, 54, 51, 0.1)', // 列表拒绝项背景
};

const NODE_R = 22;

// Kruskal 伪代码
const CODE_LINES = [
  { id: 1, text: "void Kruskal(Graph G) {", indent: 0 },
  { id: 2, text: "    MST = {};", indent: 2 },
  { id: 3, text: "    SortedEdges = Sort(G.edges, by weight);", indent: 2 },
  { id: 4, text: "    DSU.init(G.nodes); // 并查集初始化", indent: 2 },
  { id: 5, text: "    for (edge(u, v) in SortedEdges) {", indent: 2 },
  { id: 6, text: "        if (DSU.find(u) != DSU.find(v)) {", indent: 4 },
  { id: 7, text: "            MST.add(edge);", indent: 6 },
  { id: 8, text: "            DSU.union(u, v);", indent: 6 },
  { id: 9, text: "        }", indent: 4 },
  { id: 10, text: "    }", indent: 2 },
  { id: 11, text: "}", indent: 0 },
];

const KruskalVisualizer = () => {
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

  // ================== 算法执行状态 ==================
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // DSU Helper
  const find = (parent, i) => {
    if (parent[i] === i) return i;
    return find(parent, parent[i]);
  };
  const union = (parent, i, j) => {
    const rootI = find(parent, i);
    const rootJ = find(parent, j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
      return true;
    }
    return false;
  };

  // ================== Kruskal 核心逻辑 ==================
  const generateKruskal = () => {
    const newSteps = [];
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    const parent = {};
    nodes.forEach(n => parent[n.id] = n.id);

    const mstEdges = [];
    const rejectedEdges = [];
    let totalWeight = 0;

    const pushStep = (currentEdgeId, line, desc, activeNodes = []) => {
      newSteps.push({
        mstEdges: [...mstEdges],
        rejectedEdges: [...rejectedEdges],
        // 记录每条边的状态用于列表渲染
        edgeStates: sortedEdges.map(e => {
            if (mstEdges.find(me => me.id === e.id)) return 'accepted';
            if (rejectedEdges.find(re => re.id === e.id)) return 'rejected';
            if (e.id === currentEdgeId) return 'checking';
            return 'waiting';
        }),
        activeNodes,
        totalWeight,
        line,
        desc
      });
    };

    // Step 0: Init
    pushStep(null, 3, "初始化：按权重排序所有边", []);

    for (let i = 0; i < sortedEdges.length; i++) {
        const edge = sortedEdges[i];
        const { from, to, weight, id } = edge;

        pushStep(id, 5, `检查边 <${nodes[from]?.label}-${nodes[to]?.label}> (w=${weight})`, [from, to]);

        const rootU = find(parent, from);
        const rootV = find(parent, to);

        if (rootU !== rootV) {
            union(parent, from, to);
            mstEdges.push(edge);
            totalWeight += weight;
            pushStep(id, 7, `加入 MST：两个端点不在同一集合，不会构成环`, [from, to]);
        } else {
            rejectedEdges.push(edge);
            pushStep(id, 6, `丢弃：两个端点已在同一集合，会构成环`, [from, to]);
        }
    }

    pushStep(null, 11, `生成完成！最小生成树总权重: ${totalWeight}`, []);
    return newSteps;
  };

  // ================== 播放控制 ==================
  const reset = () => { setIsAutoPlaying(false); setCurrentStep(-1); setSteps([]); };
  const startAlgo = () => { reset(); const s = generateKruskal(); setSteps(s); setCurrentStep(0); setIsAutoPlaying(true); };
  const nextStep = () => { if (currentStep < steps.length - 1) setCurrentStep(p => p + 1); else setIsAutoPlaying(false); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(p => p - 1); setIsAutoPlaying(false); };

  useEffect(() => {
    let interval;
    if (isAutoPlaying && currentStep < steps.length - 1) interval = setInterval(nextStep, 1200);
    else setIsAutoPlaying(false);
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStep, steps]);

  // 当前状态
  const curState = steps[currentStep] || {
    mstEdges: [], rejectedEdges: [], edgeStates: [], activeNodes: [], totalWeight: 0, line: -1,
    desc: "准备就绪"
  };

  // 始终保持排序的边列表用于展示
  const displayEdges = [...edges].sort((a,b) => a.weight - b.weight);

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

      {/* 顶部控制栏 (复刻截图) */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, marginRight: 10 }}>Kruskal 最小生成树</h3>

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
        {/* 右侧权重显示 */}
        <div style={{fontSize:14, fontWeight:'bold', color: THEME.success}}>
           MST Weight: {curState.totalWeight}
        </div>
      </div>

      {/* 播放控制栏 (第二行，模仿截图中的播放条) */}
      <div style={{ padding: '8px 20px', background: '#010409', borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
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
          <div style={labelStyle}>Weighted Graph (Kruskal)</div>
          <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.from);
              const t = nodes.find(n => n.id === e.to);

              const isMST = curState.mstEdges.some(me => me.id === e.id);
              const isRejected = curState.rejectedEdges.some(re => re.id === e.id);
              // 从当前 displayEdges 中找到索引，再查状态
              const idx = displayEdges.findIndex(de => de.id === e.id);
              const isChecking = currentStep !== -1 && curState.edgeStates[idx] === 'checking';

              let stroke = '#30363d'; // 默认暗色
              let width = 1.5;
              let opacity = 1;

              if (isChecking) { stroke = THEME.purple; width = 5; }
              else if (isMST) { stroke = THEME.success; width = 4; }
              else if (isRejected) { stroke = THEME.danger; opacity = 0.2; }

              return s && t && (
                <g key={i} onDoubleClick={() => deleteEdgeById(e.id)} style={{cursor: 'pointer', opacity}}>
                    {/* 线条 */}
                    <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={stroke} strokeWidth={width} />
                    {/* 权重背景 */}
                    <rect x={(s.x+t.x)/2 - 12} y={(s.y+t.y)/2 - 9} width={24} height={18} rx={4} fill="#0d1117" stroke={stroke} strokeWidth={1} />
                    {/* 权重文字 */}
                    <text x={(s.x+t.x)/2} y={(s.y+t.y)/2 + 4} textAnchor="middle" fill={THEME.text} fontSize={11} fontWeight="bold">{e.weight}</text>
                </g>
              );
            })}
          </svg>

          {nodes.map(n => {
            const isActive = curState.activeNodes.includes(n.id);
            return (
              <motion.div key={n.id}
                drag dragMomentum={false} dragConstraints={containerRef}
                onDragEnd={(e, i) => updateNodePos(n.id, i)}
                animate={{ x: n.x - NODE_R, y: n.y - NODE_R, scale: isActive ? 1.2 : 1 }}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: NODE_R*2, height: NODE_R*2,
                  borderRadius: '50%', background: isActive ? THEME.warning : THEME.nodeBg,
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
             <div style={panelHeaderStyle}>Kruskal's Algorithm</div>
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

          {/* 下半部分：全局排序边列表 (重点优化) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
            <div style={{...panelHeaderStyle, display:'flex', justifyContent:'space-between'}}>
               <span>Sorted Edges (Global List)</span>
               <span style={{fontSize:11, opacity:0.6}}>Size: {edges.length}</span>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <AnimatePresence>
                    {displayEdges.map((edge, idx) => {
                        // 获取状态
                        const status = currentStep !== -1 ? curState.edgeStates[idx] : 'waiting';

                        // 样式计算
                        let bg = '#161b22';
                        let border = `1px solid ${THEME.border}`;
                        let color = THEME.textMuted;
                        let icon = null;

                        if (status === 'accepted') {
                            bg = THEME.listActiveBg;
                            border = `1px solid ${THEME.success}`;
                            color = '#fff';
                            icon = <span style={{color: THEME.success}}>✔</span>;
                        } else if (status === 'rejected') {
                            bg = THEME.listRejectBg;
                            border = '1px solid transparent';
                            color = '#484f58';
                            icon = <span style={{color: THEME.danger}}>✕</span>;
                        } else if (status === 'checking') {
                            bg = 'rgba(163, 113, 247, 0.15)';
                            border = `1px solid ${THEME.purple}`;
                            color = '#fff';
                            icon = <span style={{fontSize:10}}>●</span>;
                        }

                        return (
                            <motion.div
                                key={edge.id} layout
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display:'flex', alignItems:'center', justifyContent:'space-between',
                                    padding: '8px 12px', borderRadius: 4,
                                    background: bg, border: border, color: color,
                                    fontSize: 13, fontFamily: 'Consolas', fontWeight: status==='waiting'?'normal':'bold'
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
                {edges.length === 0 && <div style={{textAlign:'center', color:THEME.textMuted, marginTop:20, fontSize:12}}>暂无边数据</div>}
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
    padding: '8px 12px', background: '#161b22', borderBottom: '1px solid #30363d', fontSize: 12, fontWeight: 'bold', color: '#8b949e'
};

export default KruskalVisualizer;