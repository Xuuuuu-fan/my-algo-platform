import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 主题配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  nodeRaw: '#1f6feb',    // 初始节点蓝
  nodeActive: '#d29922', // 当前处理 (橙)
  nodeVisit: '#2ea043',  // 已访问 (绿)
  nodeCheck: '#a371f7',  // 正在检查邻居 (紫)
  edgeRaw: '#30363d',
  edgeTree: '#2ea043',   // 树枝颜色
  edgeCheck: '#a371f7',  // 扫描线
  queueItem: '#1f6feb'
};

const NODE_R = 20;

// ================== 初始数据 ==================
const INITIAL_NODES = [
  { id: 'A', x: 200, y: 50 },
  { id: 'B', x: 100, y: 150 },
  { id: 'C', x: 300, y: 150 },
  { id: 'D', x: 50, y: 250 },
  { id: 'E', x: 150, y: 250 },
  { id: 'F', x: 250, y: 250 },
  { id: 'G', x: 350, y: 250 },
];

const INITIAL_EDGES = [
  { u: 'A', v: 'B' }, { u: 'A', v: 'C' },
  { u: 'B', v: 'D' }, { u: 'B', v: 'E' },
  { u: 'C', v: 'F' }, { u: 'C', v: 'G' },
  { u: 'B', v: 'C' }, // 横向边 (非树边)
  { u: 'E', v: 'F' }  // 横向边
];

const BFSGeneratorVisualizer = () => {
  const containerRef = useRef(null);

  // 图数据
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);

  // 编辑状态
  const [edgeInput, setEdgeInput] = useState({ u: 'A', v: 'B' });

  // 动画状态
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAuto, setIsAuto] = useState(false);

  // ================== 核心算法：生成 BFS 步骤 ==================
  const generateBFS = () => {
    const startNodeId = nodes[0].id; // 默认第一个为起点
    const newSteps = [];

    // 邻接表构建
    const adj = {};
    nodes.forEach(n => adj[n.id] = []);
    edges.forEach(e => {
        if(adj[e.u]) adj[e.u].push(e.v);
        if(adj[e.v]) adj[e.v].push(e.u); // 无向图
    });
    // 对邻居排序，保证遍历顺序确定
    Object.keys(adj).forEach(k => adj[k].sort());

    // BFS 状态
    let queue = [startNodeId];
    let visited = new Set([startNodeId]);
    let treeEdges = []; // 生成树的边
    let treeNodes = [{ id: startNodeId, parent: null, level: 0 }]; // 生成树的节点布局信息

    // 初始帧
    newSteps.push({
        activeNode: null, checkingNode: null, queue: [...queue], visited: new Set(visited), treeEdges: [], treeNodes: [...treeNodes],
        msg: `初始化：将起点 ${startNodeId} 加入队列`
    });

    while (queue.length > 0) {
        const u = queue.shift();

        // 帧：取出队头
        newSteps.push({
            activeNode: u, checkingNode: null, queue: [...queue], visited: new Set(visited), treeEdges: [...treeEdges], treeNodes: [...treeNodes],
            msg: `从队列取出节点 ${u}，准备访问邻居`
        });

        const neighbors = adj[u] || [];
        for (const v of neighbors) {
            // 帧：检查邻居
            newSteps.push({
                activeNode: u, checkingNode: v, queue: [...queue], visited: new Set(visited), treeEdges: [...treeEdges], treeNodes: [...treeNodes],
                msg: `检查 ${u} 的邻居 ${v}...`
            });

            if (!visited.has(v)) {
                visited.add(v);
                queue.push(v);

                // 加入生成树边
                treeEdges.push({ u, v });

                // 计算树节点坐标 (简单的层级布局)
                const parentNode = treeNodes.find(n => n.id === u);
                const level = parentNode ? parentNode.level + 1 : 0;
                treeNodes.push({ id: v, parent: u, level });

                // 帧：发现新节点
                newSteps.push({
                    activeNode: u, checkingNode: v, queue: [...queue], visited: new Set(visited), treeEdges: [...treeEdges], treeNodes: [...treeNodes],
                    msg: `💡 发现未访问节点 ${v}！加入队列，并加入生成树`
                });
            }
        }
    }

    // 结束帧
    newSteps.push({
        activeNode: null, checkingNode: null, queue: [], visited: new Set(visited), treeEdges: [...treeEdges], treeNodes: [...treeNodes],
        msg: "队列为空，BFS 遍历结束，生成树构建完成。"
    });

    return newSteps;
  };

  // ================== 辅助：计算树形图坐标 ==================
  // 将扁平的 treeNodes 转换为带有 x,y 的节点列表
  const getTreeLayout = (treeNodes) => {
      // 1. 按层级分组
      const levels = {};
      treeNodes.forEach(n => {
          if(!levels[n.level]) levels[n.level] = [];
          levels[n.level].push(n);
      });

      const layoutNodes = [];
      const width = 350; // 右侧面板宽度
      const levelHeight = 80;

      // 2. 计算坐标
      Object.keys(levels).forEach(lvl => {
          const nodesInLevel = levels[lvl];
          const count = nodesInLevel.length;
          const segment = width / (count + 1);

          nodesInLevel.forEach((n, idx) => {
              layoutNodes.push({
                  id: n.id,
                  x: segment * (idx + 1),
                  y: 50 + n.level * levelHeight
              });
          });
      });
      return layoutNodes;
  };

  // ================== 控制逻辑 ==================
  const handleStart = () => {
      const s = generateBFS();
      setSteps(s);
      setCurrentStep(0);
      setIsAuto(true);
  };

  const handleReset = () => {
      setIsAuto(false);
      setCurrentStep(-1);
      setSteps([]);
  };

  const next = () => setCurrentStep(p => Math.min(p + 1, steps.length - 1));
  const prev = () => setCurrentStep(p => Math.max(p - 1, 0));

  useEffect(() => {
      let timer;
      if (isAuto && currentStep < steps.length - 1) {
          timer = setTimeout(next, 1000);
      } else {
          setIsAuto(false);
      }
      return () => clearTimeout(timer);
  }, [isAuto, currentStep, steps]);

  // 获取当前状态
  const curState = steps[currentStep] || {
      activeNode: null, checkingNode: null, queue: [], visited: new Set(), treeEdges: [], treeNodes: [], msg: '准备就绪'
  };

  const treeLayoutNodes = getTreeLayout(curState.treeNodes);

  // ================== 图编辑 ==================
  const addNode = () => {
      const id = String.fromCharCode(65 + nodes.length);
      setNodes([...nodes, { id, x: 50 + Math.random()*200, y: 50 + Math.random()*200 }]);
      handleReset();
  };
  const addEdge = () => {
      if(edgeInput.u === edgeInput.v) return;
      // 避免重复
      if(edges.some(e => (e.u===edgeInput.u && e.v===edgeInput.v) || (e.u===edgeInput.v && e.v===edgeInput.u))) return;
      setEdges([...edges, { u: edgeInput.u, v: edgeInput.v }]);
      handleReset();
  };
  const updateNodePos = (id, info) => {
      setNodes(nodes.map(n => n.id === id ? { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y } : n));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', border: `1px solid ${THEME.border}`, borderRadius: 8, background: THEME.bg, overflow: 'hidden' }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: 12, background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={addNode} style={btnStyle}>+ 节点</button>
        <div style={{display:'flex', gap:5, alignItems:'center', background: THEME.bg, padding: '2px 8px', borderRadius:4, border:`1px solid ${THEME.border}`}}>
            <select style={selStyle} value={edgeInput.u} onChange={e=>setEdgeInput({...edgeInput, u:e.target.value})}>{nodes.map(n=><option key={n.id}>{n.id}</option>)}</select>
            <span style={{color:'#666'}}>-</span>
            <select style={selStyle} value={edgeInput.v} onChange={e=>setEdgeInput({...edgeInput, v:e.target.value})}>{nodes.map(n=><option key={n.id}>{n.id}</option>)}</select>
            <button onClick={addEdge} style={{...btnStyle, padding: '2px 8px', fontSize:12}}>连线</button>
        </div>
        <div style={{flex:1}}></div>
        <button onClick={handleStart} style={{...btnStyle, background: THEME.nodeVisit}}>开始 BFS</button>
        <button onClick={prev} disabled={currentStep<=0} style={btnStyle}>上一步</button>
        <button onClick={next} disabled={currentStep>=steps.length-1} style={btnStyle}>下一步</button>
        <button onClick={handleReset} style={btnStyle}>重置</button>
      </div>

      {/* 主体区域：双图并列 */}
      <div style={{ display: 'flex', height: 400 }}>

        {/* 左侧：原图 (Graph) */}
        <div ref={containerRef} style={{ flex: 1, position: 'relative', borderRight: `1px solid ${THEME.border}` }}>
            <div style={labelStyle}>原始图结构 (Graph)</div>
            <svg width="100%" height="100%">
                {/* 连线 */}
                {edges.map((e, i) => {
                    const u = nodes.find(n => n.id === e.u);
                    const v = nodes.find(n => n.id === e.v);
                    if(!u || !v) return null;

                    // 判断是否是当前正在检查的边
                    const isChecking = (curState.activeNode === e.u && curState.checkingNode === e.v) || (curState.activeNode === e.v && curState.checkingNode === e.u);
                    // 判断是否是生成树的边
                    const isTreeEdge = curState.treeEdges.some(te => (te.u===e.u && te.v===e.v) || (te.u===e.v && te.v===e.u));

                    return (
                        <motion.line
                            key={i}
                            x1={u.x} y1={u.y} x2={v.x} y2={v.y}
                            stroke={isChecking ? THEME.edgeCheck : (isTreeEdge ? THEME.edgeTree : THEME.edgeRaw)}
                            strokeWidth={isTreeEdge || isChecking ? 3 : 1.5}
                            animate={{ strokeDasharray: isChecking ? "5,5" : "0" }}
                        />
                    );
                })}
            </svg>
            {/* 节点 */}
            {nodes.map(n => {
                const isActive = curState.activeNode === n.id;
                const isVisited = curState.visited.has(n.id);
                const isChecking = curState.checkingNode === n.id;

                let bg = THEME.nodeRaw;
                if (isActive) bg = THEME.nodeActive;
                else if (isChecking) bg = THEME.nodeCheck;
                else if (isVisited) bg = THEME.nodeVisit;

                return (
                    <motion.div
                        key={n.id}
                        drag dragMomentum={false} dragConstraints={containerRef}
                        onDragEnd={(e, info) => updateNodePos(n.id, info)}
                        animate={{ backgroundColor: bg, scale: isActive ? 1.2 : 1 }}
                        style={{
                            position: 'absolute', left: n.x - NODE_R, top: n.y - NODE_R,
                            width: NODE_R*2, height: NODE_R*2, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 'bold', cursor: 'move',
                            border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                        }}
                    >
                        {n.id}
                    </motion.div>
                );
            })}
        </div>

        {/* 右侧：生成树 (Tree) */}
        <div style={{ flex: 1, position: 'relative', background: '#090c10' }}>
            <div style={labelStyle}>广度优先生成树 (BFS Tree)</div>
            <svg width="100%" height="100%">
                <AnimatePresence>
                    {/* 树枝 */}
                    {curState.treeEdges.map((e, i) => {
                        const u = treeLayoutNodes.find(n => n.id === e.u);
                        const v = treeLayoutNodes.find(n => n.id === e.v);
                        if(!u || !v) return null;
                        return (
                            <motion.line
                                key={`tree-edge-${i}`}
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                x1={u.x} y1={u.y} x2={v.x} y2={v.y}
                                stroke={THEME.edgeTree} strokeWidth={2}
                            />
                        );
                    })}
                    {/* 树节点 */}
                    {treeLayoutNodes.map(n => (
                        <motion.g key={`tree-node-${n.id}`} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <circle cx={n.x} cy={n.y} r={18} fill={THEME.nodeVisit} stroke="#fff" strokeWidth="2" />
                            <text x={n.x} y={n.y} dy=".3em" textAnchor="middle" fill="#fff" fontWeight="bold">{n.id}</text>
                        </motion.g>
                    ))}
                </AnimatePresence>
            </svg>
            {treeLayoutNodes.length === 0 && (
                <div style={{position:'absolute', top:'50%', width:'100%', textAlign:'center', color:'#666'}}>
                    点击左上角「开始 BFS」生成树
                </div>
            )}
        </div>

      </div>

      {/* 底部：队列与日志 */}
      <div style={{ padding: 15, background: '#161b22', borderTop: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* 队列可视化 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
            <span style={{ color: '#8b949e', fontSize: 13, fontWeight: 'bold' }}>Queue:</span>
            <div style={{ display: 'flex', gap: 5, padding: '4px 10px', background: '#0d1117', borderRadius: 4, border: `1px solid ${THEME.border}`, minWidth: 200, alignItems:'center' }}>
                <AnimatePresence>
                    {curState.queue.map(id => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0 }}
                            style={{
                                width: 28, height: 28, background: THEME.queueItem, borderRadius: 4,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: 12, fontWeight: 'bold'
                            }}
                        >
                            {id}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {curState.queue.length === 0 && <span style={{color:'#444', fontSize:12}}>Empty</span>}
            </div>
        </div>

        {/* 消息日志 */}
        <div style={{ fontSize: 13, color: THEME.text }}>
            💬 <span style={{color: THEME.nodeActive}}>{curState.msg}</span>
        </div>
      </div>

    </div>
  );
};

// 样式
const btnStyle = {
  padding: '5px 12px', background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: 4, cursor: 'pointer', fontSize: 13
};
const selStyle = {
    background: '#0d1117', color: '#c9d1d9', border: 'none', borderRadius: 3, padding: '2px'
};
const labelStyle = {
    position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 12, pointerEvents: 'none'
};

export default BFSGeneratorVisualizer;