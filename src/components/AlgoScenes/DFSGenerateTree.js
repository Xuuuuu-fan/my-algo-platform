import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  nodeBase: '#1f6feb',    // 未访问节点
  nodeActive: '#d29922',  // 当前访问节点 (橙色)
  nodeVisited: '#2ea043', // 已访问节点 (绿色)
  edgeBase: '#30363d',    // 普通边
  edgeTree: '#2ea043',    // 树边 (绿色)
  edgeVisit: '#d29922',   // 正在探索的边
  text: '#c9d1d9',
};

const NODE_R = 20;

// ================== 初始数据 ==================
// 默认图结构 (稍微复杂一点，带环)
const INITIAL_NODES = [
  { id: 0, label: 'A', x: 150, y: 50 },
  { id: 1, label: 'B', x: 50, y: 150 },
  { id: 2, label: 'C', x: 150, y: 150 },
  { id: 3, label: 'D', x: 250, y: 150 },
  { id: 4, label: 'E', x: 50, y: 250 },
  { id: 5, label: 'F', x: 250, y: 250 },
];

const INITIAL_EDGES = [
  { source: 0, target: 1 }, { source: 0, target: 2 }, { source: 0, target: 3 },
  { source: 1, target: 4 }, { source: 1, target: 2 }, // B-C 形成环
  { source: 2, target: 3 }, // C-D 形成环
  { source: 3, target: 5 },
  { source: 4, target: 2 }, // E-C 跨层环
];

// ================== 核心组件 ==================
const DFSGenerateTree = () => {
  // --- 数据状态 ---
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);

  // --- 算法状态 ---
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAuto, setIsAuto] = useState(false);

  // --- 编辑状态 ---
  const [editMode, setEditMode] = useState(false);
  const [newEdgeStart, setNewEdgeStart] = useState(null);

  // 1. 核心算法：生成 DFS 步骤快照
  const generateSteps = () => {
    const snapshots = [];
    const visited = new Set();
    const treeEdges = []; // 存储生成树的边
    const treeNodes = new Set(); // 存储生成树的节点

    // 构建邻接表
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
        adj[e.source].push(e.target);
        adj[e.target].push(e.source); // 无向图
    });
    // 排序邻接表，保证遍历顺序确定 (按 ID 或 Label 排序)
    Object.keys(adj).forEach(k => adj[k].sort((a,b) => a - b));

    const pushSnapshot = (activeNode, desc, highlightEdge = null) => {
      snapshots.push({
        activeNode,
        visited: new Set(visited),
        treeEdges: [...treeEdges],
        treeNodes: new Set(treeNodes),
        highlightEdge,
        desc
      });
    };

    // DFS 递归函数
    const dfs = (u, p = -1) => {
        visited.add(u);
        treeNodes.add(u);
        pushSnapshot(u, `访问节点 ${nodes[u].label}`, null);

        const neighbors = adj[u] || [];
        for (const v of neighbors) {
            if (v === p) continue; // 不回头走父节点

            if (!visited.has(v)) {
                // 发现新节点，(u, v) 是一条树边
                treeEdges.push({ source: u, target: v });
                pushSnapshot(u, `发现未访问邻居 ${nodes[v].label}，添加树边`, { source: u, target: v });

                dfs(v, u);

                // 回溯
                pushSnapshot(u, `从 ${nodes[v].label} 回溯到 ${nodes[u].label}`, null);
            } else {
                // 遇到已访问节点 (u, v) 是回边 (Back Edge)，忽略
                // 可以在这里加一个快照展示“探测到回路”
            }
        }
    };

    // 从第0个节点开始遍历 (假设图是连通的，或者只遍历连通分量)
    if (nodes.length > 0) {
        pushSnapshot(null, "准备开始 DFS", null);
        dfs(0);
        pushSnapshot(null, "DFS 遍历结束，生成树完成", null);
    }

    return snapshots;
  };

  // 初始化或图改变时重新计算
  useEffect(() => {
    const s = generateSteps();
    setSteps(s);
    setCurrentStep(0);
    setIsAuto(false);
  }, [nodes, edges]);

  // 自动播放
  useEffect(() => {
    let timer;
    if (isAuto && currentStep < steps.length - 1) {
      timer = setTimeout(() => setCurrentStep(c => c + 1), 1000);
    } else {
      setIsAuto(false);
    }
    return () => clearTimeout(timer);
  }, [isAuto, currentStep, steps]);

  const curState = steps[currentStep] || {
    activeNode: null, visited: new Set(), treeEdges: [], treeNodes: new Set(), desc: '初始化...'
  };

  // --- 图编辑逻辑 ---
  const addNode = () => {
    const id = nodes.length;
    const label = String.fromCharCode(65 + id);
    setNodes([...nodes, { id, label, x: 50 + Math.random()*250, y: 50 + Math.random()*250 }]);
  };

  const handleNodeClick = (id) => {
    if (!editMode) return;
    if (newEdgeStart === null) {
        setNewEdgeStart(id);
    } else {
        if (newEdgeStart !== id) {
            // 检查边是否存在
            const exists = edges.some(e =>
                (e.source === newEdgeStart && e.target === id) ||
                (e.source === id && e.target === newEdgeStart)
            );
            if (!exists) {
                setEdges([...edges, { source: newEdgeStart, target: id }]);
            }
        }
        setNewEdgeStart(null);
    }
  };

  const resetGraph = () => {
      setNodes(INITIAL_NODES);
      setEdges(INITIAL_EDGES);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: 'hidden', background: THEME.bg }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: 12, background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setEditMode(!editMode)} style={btnStyle(editMode ? THEME.nodeActive : THEME.border)}>
            {editMode ? '完成编辑' : '自定义图结构'}
        </button>

        {editMode && (
            <>
                <button onClick={addNode} style={btnStyle(THEME.border)}>+ 节点</button>
                <button onClick={() => setEdges([])} style={btnStyle(THEME.border)}>清空边</button>
                <button onClick={resetGraph} style={btnStyle(THEME.border)}>重置默认</button>
                <span style={{fontSize:12, color:'#8b949e'}}>点击两个节点连线</span>
            </>
        )}

        {!editMode && (
            <>
                <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep===0} style={btnStyle(THEME.edgeBase)}>上一步</button>
                <button onClick={() => setIsAuto(!isAuto)} style={btnStyle(THEME.nodeBase)}>
                    {isAuto ? '暂停' : '自动播放'}
                </button>
                <button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))} disabled={currentStep===steps.length-1} style={btnStyle(THEME.edgeBase)}>下一步</button>
                <div style={{ flex:1, textAlign:'right', color: THEME.text, fontSize: 13 }}>
                    {curState.desc}
                </div>
            </>
        )}
      </div>

      {/* 主体双面板 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 350 }}>

        {/* 左侧：原图遍历 */}
        <div style={{ position: 'relative', borderRight: `1px solid ${THEME.border}` }}>
            <div style={labelStyle}>1. 原图遍历 (Graph)</div>
            <svg width="100%" height="100%">
                {/* 绘制所有边 */}
                {edges.map((e, i) => {
                    const s = nodes[e.source];
                    const t = nodes[e.target];
                    const isTreeEdge = curState.treeEdges.some(te =>
                        (te.source === e.source && te.target === e.target) ||
                        (te.source === e.target && te.target === e.source)
                    );
                    const isHighlight = curState.highlightEdge && (
                        (curState.highlightEdge.source === e.source && curState.highlightEdge.target === e.target) ||
                        (curState.highlightEdge.source === e.target && curState.highlightEdge.target === e.source)
                    );

                    return (
                        <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                            stroke={isHighlight ? THEME.nodeActive : (isTreeEdge ? THEME.edgeTree : THEME.edgeBase)}
                            strokeWidth={isHighlight || isTreeEdge ? 3 : 1}
                        />
                    );
                })}
                {/* 绘制所有节点 */}
                {nodes.map(n => (
                    <g key={n.id} onClick={() => handleNodeClick(n.id)} style={{cursor: editMode?'pointer':'default'}}>
                        <circle cx={n.x} cy={n.y} r={NODE_R}
                            fill={n.id === curState.activeNode ? THEME.nodeActive : (curState.visited.has(n.id) ? THEME.nodeVisited : THEME.nodeBase)}
                            stroke="#fff" strokeWidth={2}
                        />
                        <text x={n.x} y={n.y} dy=".3em" textAnchor="middle" fill="#fff" fontWeight="bold">{n.label}</text>
                        {n.id === newEdgeStart && <circle cx={n.x} cy={n.y} r={NODE_R+4} stroke="#fff" fill="none" strokeDasharray="4,4" />}
                    </g>
                ))}
            </svg>
        </div>

        {/* 右侧：生成树 */}
        <div style={{ position: 'relative', background: '#010409' }}>
            <div style={labelStyle}>2. 生成树 (Spanning Tree)</div>
            <svg width="100%" height="100%">
                {/* 只绘制树边 */}
                <AnimatePresence>
                    {curState.treeEdges.map((e, i) => {
                        const s = nodes[e.source];
                        const t = nodes[e.target];
                        return (
                            <motion.line
                                key={`${e.source}-${e.target}`}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                                stroke={THEME.edgeTree} strokeWidth={3}
                            />
                        );
                    })}
                </AnimatePresence>
                {/* 只绘制已进入树的节点 */}
                {nodes.map(n => (
                    <motion.g key={n.id}
                        initial={{ opacity: 0.1, scale: 0.8 }}
                        animate={{
                            opacity: curState.treeNodes.has(n.id) ? 1 : 0.1,
                            scale: curState.treeNodes.has(n.id) ? 1 : 0.8
                        }}
                    >
                        <circle cx={n.x} cy={n.y} r={NODE_R}
                            fill={THEME.nodeBase} // 树里统一蓝色，或者用 visited 绿色
                            stroke="#fff" strokeWidth={2}
                        />
                        <text x={n.x} y={n.y} dy=".3em" textAnchor="middle" fill="#fff" fontWeight="bold">{n.label}</text>
                    </motion.g>
                ))}
            </svg>
        </div>

      </div>
    </div>
  );
};

// 样式
const btnStyle = (bg) => ({
  padding: '6px 12px', border: 'none', borderRadius: 4, background: bg, color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
});

const labelStyle = {
    position: 'absolute', top: 10, left: 10,
    background: 'rgba(0,0,0,0.6)', color: '#fff',
    padding: '4px 8px', borderRadius: 4, fontSize: 12,
    pointerEvents: 'none'
};

export default DFSGenerateTree;