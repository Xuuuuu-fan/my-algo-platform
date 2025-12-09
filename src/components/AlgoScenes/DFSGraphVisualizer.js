import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// ================== 样式配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  node: '#1f6feb',        // 未访问节点 (蓝)
  nodeActive: '#d29922',  // 当前访问节点 (橙)
  nodeVisited: '#2ea043', // 已完成节点 (绿)
  edge: '#30363d',        // 初始边 (灰)
  treeEdge: '#2ea043',    // 树边 (绿实线)
  backEdge: '#da3633',    // 回边 (红虚线)
  textMuted: '#8b949e'
};

const NODE_R = 20;

// 辅助：睡眠
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const DFSGraphVisualizer = () => {
  const containerRef = useRef(null);

  // ================== 数据状态 ==================
  // 节点: { id, label, x, y, status: 'unvisited'|'active'|'visited' }
  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 250, y: 50, status: 'unvisited' },
    { id: 1, label: 'B', x: 150, y: 150, status: 'unvisited' },
    { id: 2, label: 'C', x: 350, y: 150, status: 'unvisited' },
    { id: 3, label: 'D', x: 100, y: 280, status: 'unvisited' },
    { id: 4, label: 'E', x: 200, y: 280, status: 'unvisited' },
    { id: 5, label: 'F', x: 300, y: 280, status: 'unvisited' },
    { id: 6, label: 'G', x: 400, y: 280, status: 'unvisited' },
  ]);

  // 边: { source, target, status: 'default'|'tree'|'back' }
  const [edges, setEdges] = useState([
    { source: 0, target: 1, status: 'default' },
    { source: 0, target: 2, status: 'default' },
    { source: 1, target: 3, status: 'default' },
    { source: 1, target: 4, status: 'default' },
    { source: 2, target: 5, status: 'default' },
    { source: 2, target: 6, status: 'default' },
    { source: 4, target: 5, status: 'default' }, // 横向连接，形成环
    { source: 1, target: 2, status: 'default' }, // 形成环
  ]);

  const [edgeInput, setEdgeInput] = useState({ from: 0, to: 1 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [log, setLog] = useState('请编辑图结构，或点击“开始生成”。');

  // ================== 图编辑逻辑 ==================
  const updateNodePos = (id, info) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
  };

  const addNode = () => {
    if (isAnimating) return;
    const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 0;
    const label = String.fromCharCode(65 + (nodes.length % 26));
    setNodes([...nodes, { id: newId, label, x: 50 + Math.random() * 300, y: 50 + Math.random() * 200, status: 'unvisited' }]);
    resetStatus();
  };

  const addEdge = () => {
    if (isAnimating) return;
    const u = Number(edgeInput.from);
    const v = Number(edgeInput.to);
    if (u === v) return;
    // 检查是否已存在 (无向图)
    const exists = edges.some(e => (e.source === u && e.target === v) || (e.source === v && e.target === u));
    if (!exists) {
      setEdges([...edges, { source: u, target: v, status: 'default' }]);
      resetStatus();
    }
  };

  const resetStatus = () => {
    setNodes(prev => prev.map(n => ({ ...n, status: 'unvisited' })));
    setEdges(prev => prev.map(e => ({ ...e, status: 'default' })));
    setLog('图已重置。');
  };

  const clearGraph = () => {
    if (isAnimating) return;
    setNodes([]);
    setEdges([]);
    setLog('图已清空。');
  };

  // ================== DFS 核心算法 ==================
  // 辅助：更新节点状态
  const setNodeStatus = (id, status) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  };

  // 辅助：更新边状态
  const setEdgeStatus = (u, v, status) => {
    setEdges(prev => prev.map(e => {
      if ((e.source === u && e.target === v) || (e.source === v && e.target === u)) {
        // 如果已经是树边，不要覆盖成回边 (在无向图中防止回看父节点)
        if (e.status === 'tree' && status === 'back') return e;
        return { ...e, status };
      }
      return e;
    }));
  };

  const startDFS = async () => {
    if (nodes.length === 0) return;
    setIsAnimating(true);
    resetStatus();
    await sleep(500);

    const visited = new Set();

    // 构建邻接表
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (adj[e.target]) adj[e.target].push(e.source);
    });
    // 排序邻接表，保证遍历顺序可预测 (按ID从小到大)
    Object.keys(adj).forEach(k => adj[k].sort((a, b) => a - b));

    const dfs = async (u, p) => {
      visited.add(u);
      setNodeStatus(u, 'active');
      setLog(`访问节点 ${nodes.find(n => n.id === u).label}`);
      await sleep(800);

      const neighbors = adj[u] || [];
      for (const v of neighbors) {
        if (v === p) continue; // 无向图：不回访父节点

        if (!visited.has(v)) {
          // 未访问 -> 树边
          setEdgeStatus(u, v, 'tree');
          setLog(`  ➜ 发现新节点 ${nodes.find(n => n.id === v).label}，标记为【树边】`);
          await sleep(800);
          await dfs(v, u);

          // 回溯时，重新高亮当前节点 u
          setLog(`  ⬅ 回溯到节点 ${nodes.find(n => n.id === u).label}`);
          setNodeStatus(u, 'active');
          await sleep(600);
        } else {
          // 已访问 -> 回边 (注意：如果是树边则不应覆盖，这里简单判断只要已访问且非父节点)
          // 检查这条边是否已经被标记为树边（从另一端）
          const isTreeEdge = edges.find(e =>
            ((e.source === u && e.target === v) || (e.source === v && e.target === u)) && e.status === 'tree'
          );

          if (!isTreeEdge) {
            setEdgeStatus(u, v, 'back');
            setLog(`  ↺ 节点 ${nodes.find(n => n.id === v).label} 已访问，标记为【回边】`);
            await sleep(800);
          }
        }
      }

      setNodeStatus(u, 'visited');
    };

    // 从第0个节点开始 (或你可以做个下拉框选择起点)
    await dfs(nodes[0].id, -1);

    setLog('DFS 生成树构建完成！');
    setIsAnimating(false);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', height: '500px', background: THEME.bg, color: THEME.text, border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: 'hidden' }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: 12, background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={addNode} disabled={isAnimating} style={btnStyle(THEME.border)}>+ 节点</button>
        <div style={{display:'flex', alignItems:'center', gap:5, border:`1px solid ${THEME.border}`, borderRadius:4, padding:2}}>
          <select value={edgeInput.from} onChange={e=>setEdgeInput({...edgeInput, from:e.target.value})} style={selectStyle}>
            {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <span>-</span>
          <select value={edgeInput.to} onChange={e=>setEdgeInput({...edgeInput, to:e.target.value})} style={selectStyle}>
            {nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <button onClick={addEdge} disabled={isAnimating} style={{...btnStyle(THEME.border), padding:'4px 8px', fontSize:12}}>连线</button>
        </div>
        <div style={{flex:1}}></div>
        <button onClick={startDFS} disabled={isAnimating} style={btnStyle(THEME.treeEdge)}>开始 DFS 生成</button>
        <button onClick={clearGraph} disabled={isAnimating} style={btnStyle(THEME.backEdge)}>清空</button>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* 左侧：可视化区域 */}
        <div ref={containerRef} style={{ flex: 2, position: 'relative', background: '#0d1117', overflow: 'hidden' }}>

          <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
            {/* 连线 */}
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.source);
              const t = nodes.find(n => n.id === e.target);
              if (!s || !t) return null;

              let stroke = THEME.edge;
              let width = 2;
              let dash = '0';

              if (e.status === 'tree') { stroke = THEME.treeEdge; width = 4; }
              if (e.status === 'back') { stroke = THEME.backEdge; width = 2; dash = '5,5'; }

              return (
                <motion.line
                  key={`${e.source}-${e.target}`}
                  initial={false}
                  animate={{ stroke, strokeWidth: width, strokeDasharray: dash }}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                />
              );
            })}
          </svg>

          {/* 节点 */}
          {nodes.map(n => {
            let bg = THEME.node;
            let scale = 1;
            if (n.status === 'active') { bg = THEME.nodeActive; scale = 1.2; }
            if (n.status === 'visited') { bg = THEME.nodeVisited; }

            return (
              <motion.div
                key={n.id}
                drag dragMomentum={false} dragConstraints={containerRef}
                onDragEnd={(e, i) => updateNodePos(n.id, i)}
                animate={{ x: n.x - NODE_R, y: n.y - NODE_R, backgroundColor: bg, scale }}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: NODE_R * 2, height: NODE_R * 2,
                  borderRadius: '50%', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', color: '#fff', cursor: 'move', zIndex: 10,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                }}
              >
                {n.label}
              </motion.div>
            );
          })}

          {/* 图例 */}
          <div style={{position:'absolute', bottom:10, left:10, background:'rgba(0,0,0,0.6)', padding:8, borderRadius:4, fontSize:12, color:THEME.textMuted}}>
             <div style={{display:'flex', alignItems:'center', gap:5, marginBottom:4}}>
               <div style={{width:20, height:3, background:THEME.treeEdge}}></div> 树边 (生成树)
             </div>
             <div style={{display:'flex', alignItems:'center', gap:5}}>
               <div style={{width:20, height:2, background:THEME.backEdge, borderTop:'2px dashed '+THEME.backEdge}}></div> 回边 (非树边)
             </div>
          </div>

        </div>

        {/* 右侧：日志面板 */}
        <div style={{ flex: 1, borderLeft: `1px solid ${THEME.border}`, background: THEME.panel, padding: 15, display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#fff' }}>运行日志</h4>
          <div style={{ flex: 1, fontFamily: 'Consolas, monospace', fontSize: 13, color: THEME.textMuted, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {log}
          </div>
          <div style={{ marginTop: 20, paddingTop: 10, borderTop: `1px solid ${THEME.border}`, fontSize: 12, color: '#666' }}>
            <p>💡 <b>DFS生成树性质：</b></p>
            <p>1. 包含图中所有顶点。</p>
            <p>2. 树边构成极小连通子图。</p>
            <p>3. 回边连接到祖先节点。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 样式
const btnStyle = (bg) => ({
  padding: '6px 12px', border: 'none', borderRadius: 4, background: bg, color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 12
});
const selectStyle = {
  background: '#0d1117', color: 'white', border: 'none', padding: '2px', fontSize: 12, width: 40
};

export default DFSGraphVisualizer;