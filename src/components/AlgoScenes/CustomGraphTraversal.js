import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 样式配置 ==================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  nodeBase: '#1f6feb',    // 默认蓝
  nodeActive: '#f2cc60',  // 当前处理 (金)
  nodeVisited: '#2ea043', // 已访问 (绿)
  nodeQueue: '#d29922',   // 队列/栈中 (橙)
  edgeBase: '#30363d',
  edgeTree: '#2ea043',    // 树边
  edgeSkip: '#484f58',    // 非树边
  text: '#c9d1d9'
};

const NODE_R = 24;

// ================== 算法逻辑核心 ==================
const ALGORITHMS = {
  BFS: (nodes, links) => {
    const frames = [];
    const adj = getAdjacencyList(nodes, links);
    let nodeStatus = {}; // unvisited, queue, active, done
    let linkStatus = {}; // base, tree, skip
    let queue = [];
    let visited = new Set();

    // 初始化
    nodes.forEach(n => nodeStatus[n.id] = 'unvisited');
    links.forEach(l => linkStatus[getLinkId(l)] = 'base');

    const pushFrame = (desc, q) => {
      frames.push({
        nodeStatus: { ...nodeStatus },
        linkStatus: { ...linkStatus },
        structure: [...q], // queue
        desc
      });
    };

    // 遍历所有节点 (处理森林)
    for (let i = 0; i < nodes.length; i++) {
      const startId = nodes[i].id;
      if (!visited.has(startId)) {
        visited.add(startId);
        queue.push(startId);
        nodeStatus[startId] = 'queue';
        pushFrame(`🌱 发现未访问节点 ${startId}，开始新一轮 BFS`, queue);

        while (queue.length > 0) {
          const u = queue.shift();
          nodeStatus[u] = 'active';
          pushFrame(`节点 ${u} 出队`, queue);

          const neighbors = adj[u] || [];
          // 排序以保证演示的一致性
          neighbors.sort().forEach(v => {
            if (!visited.has(v)) {
              visited.add(v);
              nodeStatus[v] = 'queue';
              queue.push(v);
              linkStatus[getLinkId({source: u, target: v})] = 'tree';
              pushFrame(`发现邻居 ${v}，标记树边，入队`, queue);
            } else {
              // 检查是否已经是树边，如果不是，标记为非树边
              const lid = getLinkId({source: u, target: v});
              if (linkStatus[lid] !== 'tree') {
                 linkStatus[lid] = 'skip';
              }
            }
          });
          nodeStatus[u] = 'done';
          pushFrame(`节点 ${u} 处理完毕`, queue);
        }
      }
    }
    pushFrame("遍历结束", []);
    return frames;
  },

  DFS: (nodes, links) => {
    const frames = [];
    const adj = getAdjacencyList(nodes, links);
    let nodeStatus = {};
    let linkStatus = {};
    let stack = [];
    let visited = new Set();

    nodes.forEach(n => nodeStatus[n.id] = 'unvisited');
    links.forEach(l => linkStatus[getLinkId(l)] = 'base');

    const pushFrame = (desc, s) => {
      frames.push({
        nodeStatus: { ...nodeStatus },
        linkStatus: { ...linkStatus },
        structure: [...s], // stack
        desc
      });
    };

    // 递归辅助函数
    const dfsVisit = (u) => {
      nodeStatus[u] = 'active';
      visited.add(u);
      stack.push(u);
      pushFrame(`访问节点 ${u}，入栈`, stack);

      const neighbors = adj[u] || [];
      neighbors.sort().forEach(v => {
        if (!visited.has(v)) {
          linkStatus[getLinkId({source: u, target: v})] = 'tree';
          pushFrame(`深入邻居 ${v}`, stack);
          dfsVisit(v);
          // 回溯
          nodeStatus[u] = 'active'; // 恢复当前节点状态为活跃
          pushFrame(`回溯到节点 ${u}`, stack);
        } else {
           const lid = getLinkId({source: u, target: v});
           if (linkStatus[lid] !== 'tree') linkStatus[lid] = 'skip';
        }
      });

      nodeStatus[u] = 'done';
      stack.pop();
      pushFrame(`节点 ${u} 所有路径探索完毕，出栈`, stack);
    };

    for (let i = 0; i < nodes.length; i++) {
      if (!visited.has(nodes[i].id)) {
        pushFrame(`🌱 发现未访问节点 ${nodes[i].id}，开始新一轮 DFS`, stack);
        dfsVisit(nodes[i].id);
      }
    }
    pushFrame("遍历结束", []);
    return frames;
  }
};

// 工具：生成邻接表
const getAdjacencyList = (nodes, links) => {
  const adj = {};
  nodes.forEach(n => adj[n.id] = []);
  links.forEach(l => {
    if (!adj[l.source]) adj[l.source] = [];
    if (!adj[l.target]) adj[l.target] = [];
    adj[l.source].push(l.target);
    adj[l.target].push(l.source); // 无向图
  });
  return adj;
};

// 工具：生成唯一的边 ID (始终按字母顺序排序，保证 A-B 和 B-A 是同一个 ID)
const getLinkId = (l) => {
  return [l.source, l.target].sort().join('-');
};

// ================== 主组件 ==================
const CustomGraphTraversal = () => {
  const containerRef = useRef(null);

  // 1. 图数据状态
  const [nodes, setNodes] = useState([
    { id: 'A', x: 150, y: 100 }, { id: 'B', x: 250, y: 200 }, { id: 'C', x: 50, y: 200 }
  ]);
  const [links, setLinks] = useState([
    { source: 'A', target: 'B' }, { source: 'A', target: 'C' }, { source: 'B', target: 'C' }
  ]);

  // 2. 交互状态
  const [mode, setMode] = useState('edit'); // 'edit' | 'run'
  const [algoType, setAlgoType] = useState('BFS'); // 'BFS' | 'DFS'
  const [selectedNode, setSelectedNode] = useState(null); // 用于连线
  const [frames, setFrames] = useState([]);
  const [curStep, setCurStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 3. 交互逻辑
  const addNode = () => {
    if (nodes.length >= 10) return alert("节点太多啦，最多10个！");
    const id = String.fromCharCode(65 + nodes.length); // A, B, C...
    // 随机位置，但保持在可视区域内
    const x = 50 + Math.random() * 400;
    const y = 50 + Math.random() * 250;
    setNodes([...nodes, { id, x, y }]);
  };

  const handleNodeClick = (id) => {
    if (mode === 'run') return;

    if (selectedNode === null) {
      setSelectedNode(id);
    } else {
      if (selectedNode === id) {
        setSelectedNode(null); // 取消选择
      } else {
        // 添加连线 (避免重复)
        const exists = links.some(l =>
          (l.source === selectedNode && l.target === id) ||
          (l.source === id && l.target === selectedNode)
        );
        if (!exists) {
          setLinks([...links, { source: selectedNode, target: id }]);
        }
        setSelectedNode(null);
      }
    }
  };

  const handleNodeDrag = (id, info) => {
    if (mode === 'run') return;
    const newNodes = nodes.map(n => {
      if (n.id === id) {
        return { ...n, x: n.x + info.offset.x, y: n.y + info.offset.y };
      }
      return n;
    });
    setNodes(newNodes);
  };

  // 双击删除
  const deleteNode = (id) => {
    if (mode === 'run') return;
    setNodes(nodes.filter(n => n.id !== id));
    setLinks(links.filter(l => l.source !== id && l.target !== id));
    setSelectedNode(null);
  };

  // 运行算法
  const runAlgo = () => {
    setMode('run');
    setIsPlaying(true);
    const generatedFrames = ALGORITHMS[algoType](nodes, links);
    setFrames(generatedFrames);
    setCurStep(0);
  };

  const resetEdit = () => {
    setMode('edit');
    setIsPlaying(false);
    setCurStep(0);
    setFrames([]);
    setSelectedNode(null);
  };

  // 自动播放
  useEffect(() => {
    let timer;
    if (isPlaying && curStep < frames.length - 1) {
      timer = setTimeout(() => setCurStep(s => s + 1), 1000);
    } else {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, curStep, frames]);

  // 获取当前帧数据
  const currentFrame = frames[curStep] || { nodeStatus: {}, linkStatus: {}, structure: [], desc: '准备就绪' };

  return (
    <div style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: 15 }}>

      {/* 顶部工具栏 */}
      <div style={{ background: THEME.panel, padding: 12, borderRadius: 8, border: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={algoType}
            onChange={e => {setAlgoType(e.target.value); resetEdit();}}
            disabled={mode === 'run'}
            style={selectStyle}
          >
            <option value="BFS">BFS (广度优先)</option>
            <option value="DFS">DFS (深度优先)</option>
          </select>

          {mode === 'edit' ? (
            <>
              <button onClick={addNode} style={btnStyle(THEME.edgeBase)}>+ 节点</button>
              <button onClick={() => setLinks([])} style={btnStyle(THEME.edgeBase)}>清空连线</button>
              <button onClick={() => {setNodes([]); setLinks([])}} style={btnStyle(THEME.edgeBase)}>清空画布</button>
              <div style={{fontSize:12, color: '#8b949e', marginLeft: 10}}>
                💡 点击两个节点连线，拖拽移动，双击删除
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setCurStep(Math.max(0, curStep-1))} disabled={isAnimating} style={btnStyle(THEME.edgeBase)}>◀</button>
              <button onClick={() => setIsPlaying(!isPlaying)} style={btnStyle(THEME.nodeActive)}>
                {isPlaying ? '暂停' : '播放'}
              </button>
              <button onClick={() => setCurStep(Math.min(frames.length-1, curStep+1))} disabled={isAnimating} style={btnStyle(THEME.edgeBase)}>▶</button>
            </>
          )}
        </div>

        <div>
          {mode === 'edit' ? (
            <button onClick={runAlgo} style={btnStyle(THEME.nodeVisited)}>开始生成森林 ▶</button>
          ) : (
            <button onClick={resetEdit} style={btnStyle(THEME.edgeBase)}>✏️ 返回编辑</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 15, height: 450 }}>

        {/* 左侧：画布区域 */}
        <div ref={containerRef} style={{ background: '#010409', borderRadius: 8, border: `1px solid ${THEME.border}`, position: 'relative', overflow: 'hidden' }}>
          <svg width="100%" height="100%" style={{ pointerEvents: 'none' }}>
            {/* 连线 */}
            {links.map((l, i) => {
              const s = nodes.find(n => n.id === l.source);
              const t = nodes.find(n => n.id === l.target);
              if (!s || !t) return null;

              let stroke = THEME.edgeBase;
              let width = 2;
              let dash = '0';

              if (mode === 'run') {
                const status = currentFrame.linkStatus[getLinkId(l)];
                if (status === 'tree') { stroke = THEME.edgeTree; width = 4; }
                else if (status === 'skip') { stroke = THEME.edgeSkip; dash = '5,5'; }
              }

              return (
                <motion.line
                  key={i}
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={stroke} strokeWidth={width} strokeDasharray={dash}
                  initial={false} animate={{ stroke, strokeWidth: width }}
                />
              );
            })}

            {/* 正在连线的虚线 (编辑模式) */}
            {selectedNode && mode === 'edit' && (
               // 这里需要复杂的鼠标跟随，为简化，仅在节点变色体现选中状态
               null
            )}
          </svg>

          {/* 节点 */}
          {nodes.map(n => {
            let bg = THEME.nodeBase;
            if (mode === 'edit') {
              if (selectedNode === n.id) bg = THEME.nodeActive;
            } else {
              const status = currentFrame.nodeStatus[n.id];
              if (status === 'queue') bg = THEME.nodeQueue;
              if (status === 'active') bg = THEME.nodeActive;
              if (status === 'done') bg = THEME.nodeVisited;
            }

            return (
              <motion.div
                key={n.id}
                drag={mode === 'edit'}
                dragMomentum={false}
                dragConstraints={containerRef}
                onDragEnd={(e, info) => handleNodeDrag(n.id, info)}
                onClick={() => handleNodeClick(n.id)}
                onDoubleClick={() => deleteNode(n.id)}
                animate={{
                  x: n.x - NODE_R,
                  y: n.y - NODE_R,
                  scale: (mode==='run' && currentFrame.nodeStatus[n.id]==='active') ? 1.2 : 1
                }}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: NODE_R * 2, height: NODE_R * 2,
                  borderRadius: '50%', background: bg,
                  border: '2px solid #fff', color: '#fff', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: mode === 'edit' ? 'grab' : 'default',
                  zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                {n.id}
              </motion.div>
            );
          })}
        </div>

        {/* 右侧：辅助结构 (队列/栈) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

          <div style={{ flex: 1, background: THEME.panel, borderRadius: 8, border: `1px solid ${THEME.border}`, padding: 15, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 10px 0', color: THEME.text, fontSize: 14 }}>
              {algoType === 'BFS' ? '辅助队列 (Queue)' : '辅助栈 (Stack)'}
            </h4>

            <div style={{
              flex: 1, border: `2px dashed ${THEME.border}`, borderRadius: 6,
              padding: 10, background: '#0d1117', overflowY: 'auto',
              display: 'flex', flexDirection: algoType === 'BFS' ? 'column' : 'column-reverse', // 栈从底部堆积
              gap: 5, justifyContent: 'flex-start'
            }}>
              <AnimatePresence>
                {currentFrame.structure.length === 0 && <div style={{textAlign:'center', color:'#444', fontSize:12, marginTop: 20}}>Empty</div>}

                {currentFrame.structure.map((id, index) => (
                  <motion.div
                    key={`${id}-${index}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    style={{
                      padding: '8px', background: THEME.nodeQueue, borderRadius: 4,
                      color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 14
                    }}
                  >
                    {id}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 5 }}>
              {algoType === 'BFS' ? 'Front ↑ ... Rear ↓' : 'Top ↑ ... Bottom ↓'}
            </div>
          </div>

          <div style={{ height: 100, background: '#161b22', borderRadius: 8, border: `1px solid ${THEME.border}`, padding: 12, fontSize: 13, color: THEME.text, display: 'flex', alignItems: 'center' }}>
            {currentFrame.desc}
          </div>

        </div>
      </div>
    </div>
  );
};

const btnStyle = (bg) => ({
  padding: '6px 12px', borderRadius: 4, border: 'none', background: bg, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
});

const selectStyle = {
  padding: '6px', borderRadius: 4, background: '#0d1117', color: '#fff', border: `1px solid ${THEME.border}`
};

export default CustomGraphTraversal;