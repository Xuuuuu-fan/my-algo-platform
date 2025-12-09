import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  nodeDef: '#1f6feb',    // 默认节点蓝
  nodeActive: '#d29922', // 当前遍历橙
  nodeVisit: '#2ea043',  // 已访问绿
  edgeDef: '#30363d',    // 默认边
  edgeTree: '#2ea043',   // 树边 (绿色高亮)
  text: '#c9d1d9',
  queueBg: '#21262d'
};

const NODE_R = 20;

// ================== 核心算法逻辑 ==================
// 自动计算树节点的坐标 (简单的层级布局)
const calculateTreeLayout = (treeNodes) => {
  const levels = {};
  // 1. 分层
  treeNodes.forEach(n => {
    if (!levels[n.level]) levels[n.level] = [];
    levels[n.level].push(n);
  });

  // 2. 计算坐标
  const layout = {};
  const width = 400; // 树容器宽度
  const levelHeight = 70;

  Object.keys(levels).forEach(lvl => {
    const nodesInLevel = levels[lvl];
    const segment = width / (nodesInLevel.length + 1);
    nodesInLevel.forEach((n, idx) => {
      layout[n.id] = {
        x: segment * (idx + 1),
        y: 40 + lvl * levelHeight
      };
    });
  });
  return layout;
};

const generateBFSSteps = (nodes, edges, startId) => {
  const steps = [];
  const adj = {};
  nodes.forEach(n => adj[n.id] = []);
  // 无向图
  edges.forEach(e => {
    adj[e.s].push(e.t);
    adj[e.t].push(e.s);
  });
  // 邻接表排序，保证遍历顺序一致
  Object.keys(adj).forEach(k => adj[k].sort((a,b) => a - b));

  const queue = [startId];
  const visited = new Set([startId]);
  const treeEdges = []; // 生成树的边
  const treeNodes = [{ id: startId, parent: null, level: 0 }]; // 生成树的节点元数据

  // 初始状态
  steps.push({
    active: startId,
    visited: Array.from(visited),
    queue: [...queue],
    treeEdges: [],
    treeNodes: [...treeNodes],
    desc: `从节点 ${startId} 开始 BFS`
  });

  while (queue.length > 0) {
    const curr = queue.shift();
    // 记录出队状态
    steps.push({
      active: curr,
      visited: Array.from(visited),
      queue: [...queue], // 此时 curr 已出队
      treeEdges: [...treeEdges],
      treeNodes: [...treeNodes],
      desc: `节点 ${curr} 出队，准备访问邻居`
    });

    const neighbors = adj[curr] || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);

        // 关键：记录树边和树节点层级
        treeEdges.push({ s: curr, t: next });
        const parentNode = treeNodes.find(n => n.id === curr);
        treeNodes.push({ id: next, parent: curr, level: parentNode.level + 1 });

        steps.push({
          active: curr,
          visited: Array.from(visited),
          queue: [...queue],
          treeEdges: [...treeEdges],
          treeNodes: [...treeNodes],
          desc: `发现邻居 ${next}，加入队列，边 (${curr}-${next}) 加入生成树`
        });
      }
    }
  }

  // 完成状态
  steps.push({
    active: null,
    visited: Array.from(visited),
    queue: [],
    treeEdges: [...treeEdges],
    treeNodes: [...treeNodes],
    desc: `BFS 遍历完成，生成树构建完毕`
  });

  return steps;
};

// ================== 组件实现 ==================
const BFSForestVisualizer = () => {
  // 图编辑状态
  const [nodes, setNodes] = useState([
    { id: 0, label: 'A', x: 200, y: 50 },
    { id: 1, label: 'B', x: 120, y: 150 },
    { id: 2, label: 'C', x: 280, y: 150 },
    { id: 3, label: 'D', x: 80, y: 250 },
    { id: 4, label: 'E', x: 180, y: 250 },
    { id: 5, label: 'F', x: 320, y: 250 },
  ]);
  const [edges, setEdges] = useState([
    { s: 0, t: 1 }, { s: 0, t: 2 },
    { s: 1, t: 3 }, { s: 1, t: 4 }, { s: 1, t: 2 }, // B-C 是一条横向边，BFS中不会成为树边
    { s: 2, t: 5 }, { s: 4, t: 5 }  // E-F 也是横向边
  ]);

  // 交互状态
  const [selectedNode, setSelectedNode] = useState(null); // 用于连线
  const [isAnimating, setIsAnimating] = useState(false);
  const [steps, setSteps] = useState([]);
  const [curStepIdx, setCurStepIdx] = useState(0);

  // 获取当前帧数据
  const curStep = steps[curStepIdx] || {
    active: null, visited: [], queue: [], treeEdges: [], treeNodes: [], desc: '请配置图结构并点击开始'
  };

  // 自动根据 treeNodes 计算树视图坐标
  const treeLayout = calculateTreeLayout(curStep.treeNodes);

  // --- 动画控制 ---
  useEffect(() => {
    let timer;
    if (isAnimating && curStepIdx < steps.length - 1) {
      timer = setTimeout(() => setCurStepIdx(c => c + 1), 1200);
    } else {
      setIsAnimating(false);
    }
    return () => clearTimeout(timer);
  }, [isAnimating, curStepIdx, steps]);

  const handleStart = () => {
    const s = generateBFSSteps(nodes, edges, 0); // 默认从节点 0 开始
    setSteps(s);
    setCurStepIdx(0);
    setIsAnimating(true);
  };

  const handleReset = () => {
    setIsAnimating(false);
    setSteps([]);
    setCurStepIdx(0);
  };

  // --- 图编辑操作 ---
  const handleNodeClick = (id) => {
    if (isAnimating) return;
    if (selectedNode === null) {
      setSelectedNode(id);
    } else {
      if (selectedNode !== id) {
        // Toggle edge
        const exists = edges.find(e => (e.s === selectedNode && e.t === id) || (e.s === id && e.t === selectedNode));
        if (exists) {
          setEdges(edges.filter(e => e !== exists));
        } else {
          setEdges([...edges, { s: selectedNode, t: id }]);
        }
      }
      setSelectedNode(null);
    }
  };

  const handleDrag = (id, info) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: 20, background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 20 }}>

      {/* 顶部标题与控制 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.border}`, paddingBottom: 15 }}>
        <div>
          <h3 style={{ margin: 0, color: '#fff' }}>广度优先生成树 (BFS Spanning Tree)</h3>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: '#8b949e' }}>
            {isAnimating ? curStep.desc : '点击两个节点可添加/删除连线，拖动节点调整布局'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleStart} disabled={isAnimating} style={btnStyle(THEME.nodeVisit)}>开始遍历</button>
          <button onClick={handleReset} style={btnStyle(THEME.border)}>重置</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

        {/* === 左侧：原图视图 === */}
        <div style={{ flex: 1, minWidth: 300, background: '#010409', borderRadius: 8, position: 'relative', height: 350, overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
          <div style={labelStyle}>Original Graph</div>
          <svg width="100%" height="100%">
            {/* 边 */}
            {edges.map((e, i) => {
              const s = nodes.find(n => n.id === e.s);
              const t = nodes.find(n => n.id === e.t);
              // 判断是否是生成树的边
              const isTreeEdge = curStep.treeEdges.find(te => (te.s === e.s && te.t === e.t) || (te.s === e.t && te.t === e.s));
              return (
                <motion.line
                  key={i}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={isTreeEdge ? THEME.edgeTree : THEME.edgeDef}
                  strokeWidth={isTreeEdge ? 3 : 1}
                  initial={false}
                  animate={{ stroke: isTreeEdge ? THEME.edgeTree : THEME.edgeDef, strokeWidth: isTreeEdge ? 3 : 1 }}
                />
              );
            })}

            {/* 节点 */}
            {nodes.map(n => {
              const isVisited = curStep.visited.includes(n.id);
              const isActive = curStep.active === n.id;
              const isSelected = selectedNode === n.id;

              return (
                <motion.g
                  key={n.id}
                  drag dragMomentum={false}
                  onDragEnd={(_, info) => handleDrag(n.id, info)}
                  onClick={() => handleNodeClick(n.id)}
                  style={{ cursor: isAnimating ? 'default' : 'pointer' }}
                >
                  <motion.circle
                    cx={n.x} cy={n.y} r={NODE_R}
                    fill={isActive ? THEME.nodeActive : (isVisited ? THEME.nodeVisit : THEME.nodeDef)}
                    stroke="#fff"
                    strokeWidth={isSelected ? 3 : 0} // 选中时加粗白边
                    animate={{ scale: isActive ? 1.2 : 1 }}
                  />
                  <text x={n.x} y={n.y} dy=".3em" textAnchor="middle" fill="#fff" fontWeight="bold" pointerEvents="none">
                    {n.label}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* === 右侧：生成树视图 === */}
        <div style={{ flex: 1, minWidth: 300, background: '#010409', borderRadius: 8, position: 'relative', height: 350, overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
          <div style={labelStyle}>BFS Spanning Tree</div>
          <svg width="100%" height="100%">
            <AnimatePresence>
              {/* 树边 */}
              {curStep.treeEdges.map((e, i) => {
                // 注意：这里需要用 treeLayout 的坐标，而不是原图坐标
                const sPos = treeLayout[e.s];
                const tPos = treeLayout[e.t];
                if (!sPos || !tPos) return null;

                return (
                  <motion.line
                    key={`tree-edge-${e.s}-${e.t}`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    x1={sPos.x} y1={sPos.y} x2={tPos.x} y2={tPos.y}
                    stroke={THEME.edgeTree} strokeWidth={2}
                  />
                );
              })}

              {/* 树节点 */}
              {curStep.treeNodes.map(tn => {
                const pos = treeLayout[tn.id];
                const nodeInfo = nodes.find(n => n.id === tn.id);
                if (!pos) return null;

                return (
                  <motion.g
                    key={`tree-node-${tn.id}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <circle cx={pos.x} cy={pos.y} r={NODE_R} fill={THEME.nodeVisit} stroke="#fff" strokeWidth={2} />
                    <text x={pos.x} y={pos.y} dy=".3em" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize={12}>
                      {nodeInfo.label}
                    </text>
                    {/* 层级标记 */}
                    <text x={pos.x + 25} y={pos.y} dy=".3em" fill="#666" fontSize={10}>L{tn.level}</text>
                  </motion.g>
                );
              })}
            </AnimatePresence>
          </svg>
        </div>

      </div>

      {/* 底部：辅助队列 */}
      <div style={{ background: THEME.panel, padding: 15, borderRadius: 8, border: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', gap: 15 }}>
        <div style={{ color: '#8b949e', fontSize: 13, fontWeight: 'bold' }}>辅助队列 (Queue):</div>
        <div style={{ flex: 1, display: 'flex', gap: 8, background: THEME.queueBg, padding: 8, borderRadius: 6, minHeight: 40, overflowX: 'auto' }}>
          <AnimatePresence>
            {curStep.queue.map((nodeId) => (
              <motion.div
                key={`q-${nodeId}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0, width: 0 }}
                style={{
                  width: 30, height: 30, borderRadius: 4,
                  background: THEME.nodeDef, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12
                }}
              >
                {nodes.find(n => n.id === nodeId)?.label}
              </motion.div>
            ))}
          </AnimatePresence>
          {curStep.queue.length === 0 && <span style={{fontSize:12, color:'#555', alignSelf:'center'}}>Empty</span>}
        </div>
      </div>

    </div>
  );
};

const btnStyle = (bg) => ({
  background: bg, color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13
});

const labelStyle = {
  position: 'absolute', top: 10, left: 10, color: '#8b949e', fontSize: 12, fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 4
};

export default BFSForestVisualizer;