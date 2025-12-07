import React, { useState } from 'react';
import { motion } from 'framer-motion';

// ================== 1. 深色主题配置 (复用风格) ==================
const THEME = {
  bg: '#0d1117',        // 全局背景
  panel: '#161b22',     // 面板背景
  border: '#30363d',    // 边框
  text: '#c9d1d9',      // 主文本
  textMuted: '#8b949e', // 辅助文本
  accent: '#58a6ff',    // 蓝色

  // 颜色定义 (参考教科书配色)
  orange: '#d29922',    // ivex / iLink 系统
  green: '#2ea043',     // jvex / jLink 系统
  blue: '#1f6feb',      // 顶点数据

  // 连线
  lineLogic: '#8b949e',
};

const DIMS = {
  vW: 110, vH: 34,      // 顶点表头尺寸
  aW: 120, aH: 64,      // 边节点尺寸
  nodeR: 24             // 逻辑圆节点半径
};

const AdjacencyMultilistDemo = () => {
  // ================== 2. 状态管理 ==================

  // 逻辑顶点
  const [vertices, setVertices] = useState([
    { id: 0, label: 'A', x: 100, y: 100 },
    { id: 1, label: 'B', x: 350, y: 100 },
    { id: 2, label: 'C', x: 225, y: 250 },
    { id: 3, label: 'D', x: 100, y: 400 },
    { id: 4, label: 'E', x: 350, y: 400 },
  ]);

  // 逻辑边 (无向图，通常存为 min->max，但这里为了演示 i/j 随便存)
  const [edges, setEdges] = useState([
    { u: 0, v: 1, id: '0-1' }, // A-B
    { u: 0, v: 2, id: '0-2' }, // A-C
    { u: 1, v: 2, id: '1-2' }, // B-C
    { u: 2, v: 3, id: '2-3' }, // C-D
    { u: 2, v: 4, id: '2-4' }, // C-E
  ]);

  // 存储结构：顶点表头位置
  const [multiHeads, setMultiHeads] = useState([
    { id: 0, x: 50, y: 50 },
    { id: 1, x: 50, y: 150 },
    { id: 2, x: 50, y: 250 },
    { id: 3, x: 50, y: 350 },
    { id: 4, x: 50, y: 450 },
  ]);

  // 存储结构：边节点位置 (Adjacency Multilist Edge Node)
  const [multiEdges, setMultiEdges] = useState([
    { id: '0-1', x: 250, y: 50 },
    { id: '0-2', x: 250, y: 120 }, // 错开摆放
    { id: '1-2', x: 400, y: 150 },
    { id: '2-3', x: 250, y: 350 },
    { id: '2-4', x: 400, y: 400 },
  ]);

  const [edgeInput, setEdgeInput] = useState({ u: 0, v: 1 });
  const [logs, setLogs] = useState(["初始化无向图与邻接多重表..."]);

  // ================== 3. 交互逻辑 ==================

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const addNode = () => {
    const newId = vertices.length > 0 ? Math.max(...vertices.map(v => v.id)) + 1 : 0;
    const label = String.fromCharCode(65 + (newId % 26));

    setVertices([...vertices, { id: newId, label, x: 50 + Math.random()*200, y: 50 + Math.random()*200 }]);

    const lastHeadY = multiHeads.length > 0 ? multiHeads[multiHeads.length-1].y : 20;
    setMultiHeads([...multiHeads, { id: newId, x: 50, y: lastHeadY + 100 }]);

    addLog(`添加顶点 ${label}，初始化 firstedge 为 NULL`);
  };

  const addEdge = () => {
    const { u, v } = edgeInput;
    const uId = Number(u);
    const vId = Number(v);

    if (uId === vId) return alert("无向图暂不支持自环");
    // 检查是否存在 (无向图 0-1 和 1-0 是同一条边)
    if (edges.find(e => (e.u === uId && e.v === vId) || (e.u === vId && e.v === uId))) return alert("边已存在");

    // 始终让 id 小的在前，方便管理 id，但数据域保留 u/v 输入顺序
    const edgeId = uId < vId ? `${uId}-${vId}` : `${vId}-${uId}`;
    setEdges([...edges, { u: uId, v: vId, id: edgeId }]);

    // 计算放置位置：放在 id 较小的那个顶点的行附近
    const headPos = multiHeads.find(h => h.id === uId);
    const existingRowEdges = edges.filter(e => e.u === uId || e.v === uId).length;
    const startX = headPos ? headPos.x + 180 + (existingRowEdges * 50) : 300;
    const startY = headPos ? headPos.y + (existingRowEdges * 30) : 100;

    setMultiEdges([...multiEdges, { id: edgeId, x: startX, y: startY }]);

    const uLabel = vertices.find(v => v.id === uId)?.label;
    const vLabel = vertices.find(v => v.id === vId)?.label;
    addLog(`添加边 (${uLabel}, ${vLabel}): 创建一个边节点，将其分别插入 ${uLabel} 和 ${vLabel} 的链表中`);
  };

  const updatePos = (setter, list, id, info) => {
    setter(list.map(item => item.id === id ? { ...item, x: item.x + info.offset.x, y: item.y + info.offset.y } : item));
  };

  // ================== 4. 核心渲染算法 ==================

  const renderLinks = () => {
    const links = [];

    // 遍历每一个顶点，画出它的一条链表
    vertices.forEach(vertex => {
      const headPos = multiHeads.find(h => h.id === vertex.id);
      if (!headPos) return;

      // 1. 找出所有与该顶点相连的边 (无向：u=id 或 v=id)
      const incidentEdges = edges.filter(e => e.u === vertex.id || e.v === vertex.id);

      // 模拟链表顺序：这里简单按 edgeID 排序，实际上取决于插入顺序
      // 为了演示效果，我们按添加顺序即可
      incidentEdges.sort((a,b) => a.id.localeCompare(b.id));

      // 起点：表头的 firstedge
      let startX = headPos.x + DIMS.vW;
      let startY = headPos.y + DIMS.vH / 2;
      let startAnchor = "right"; // 记录是从左边来还是右边来，优化曲线

      incidentEdges.forEach((edge, index) => {
        const edgeNode = multiEdges.find(n => n.id === edge.id);
        if (!edgeNode) return;

        // 判断当前顶点在边节点中是 i (左侧) 还是 j (右侧)
        // 注意：edge.u 不一定是 i，因为我们在 addEdge 时没有强制 u<v，但 edgeNode 显示时我们通常固定左边显示 u, 右边显示 v
        const isLeft = (edge.u === vertex.id);
        const isRight = (edge.v === vertex.id);

        // 目标端口坐标
        // 如果该顶点是这条边的左侧顶点(ivex)，连入左上(Data区)或左侧
        // 如果该顶点是这条边的右侧顶点(jvex)，连入右上(Data区)或右侧
        // 为了视觉清晰，我们统一连入各半区的“上方”
        let targetX, targetY;
        let color;

        if (isLeft) {
            targetX = edgeNode.x + DIMS.aW * 0.25; // 左半区中心
            targetY = edgeNode.y; // 顶部
            color = THEME.orange;
        } else {
            targetX = edgeNode.x + DIMS.aW * 0.75; // 右半区中心
            targetY = edgeNode.y; // 顶部
            color = THEME.green;
        }

        links.push(
          <PathLine key={`link-${vertex.id}-${index}`}
            d={getBezierPath(startX, startY, targetX, targetY)}
            color={color}
          />
        );

        // 更新下一次的起点：从当前边节点的 Link 域出发
        // 左半区 Link 在左下，右半区 Link 在右下
        if (isLeft) {
            startX = edgeNode.x + DIMS.aW * 0.25;
            startY = edgeNode.y + DIMS.aH;
        } else {
            startX = edgeNode.x + DIMS.aW * 0.75;
            startY = edgeNode.y + DIMS.aH;
        }
      });

      // 最后的 NULL
      links.push(
        <TextLabel key={`null-${vertex.id}`}
           x={startX} y={startY + 15} text="^"
           color={THEME.textMuted} vertical
        />
      );
    });

    return links;
  };

  // ================== 5. 组件界面 ==================
  return (
    <div style={{
      fontFamily: 'Consolas, monospace', display: 'flex', flexDirection: 'column', height: '100vh',
      background: THEME.bg, color: THEME.text, overflow: 'hidden', userSelect: 'none'
    }}>

      {/* 顶部控制栏 */}
      <div style={{ padding: '10px 20px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', gap: 15 }}>
        <h3 style={{ margin: 0, color: '#fff' }}>邻接多重表演示 <span style={{fontSize:12, fontWeight:'normal', color:THEME.textMuted}}>Adjacency Multilist</span></h3>
        <div style={{width:1, height:20, background:THEME.border}}></div>
        <button onClick={addNode} style={btnStyle(THEME.blue)}>+ 添加顶点</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0d1117', padding: '2px 8px', borderRadius: 4, border:`1px solid ${THEME.border}` }}>
          <select value={edgeInput.u} onChange={e => setEdgeInput({...edgeInput, u: e.target.value})} style={selectStyle}>
            {vertices.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
          <span style={{color:THEME.textMuted}}>—</span>
          <select value={edgeInput.v} onChange={e => setEdgeInput({...edgeInput, v: e.target.value})} style={selectStyle}>
            {vertices.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        <button onClick={addEdge} style={btnStyle(THEME.orange)}>添加无向边</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* 左侧：逻辑无向图 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${THEME.border}`, minWidth: 300 }}>
          <div style={panelHeaderStyle}>逻辑无向图 (Undirected Graph)</div>
          <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: '#0d1117' }}>
            <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
              {/* 无向连线，无箭头 */}
              {edges.map(e => {
                const s = vertices.find(v => v.id === e.u);
                const t = vertices.find(v => v.id === e.v);
                return s && t && (
                  <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={THEME.lineLogic} strokeWidth="2" />
                );
              })}
            </svg>
            {vertices.map(v => (
              <motion.div key={v.id}
                drag dragMomentum={false} onDragEnd={(e, i) => updatePos(setVertices, vertices, v.id, i)}
                initial={{ x: v.x - DIMS.nodeR, y: v.y - DIMS.nodeR }}
                style={{
                  position: 'absolute', width: DIMS.nodeR*2, height: DIMS.nodeR*2,
                  borderRadius: '50%', background: THEME.blue, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 4px rgba(31, 111, 235, 0.2)', cursor: 'move', fontWeight: 'bold', zIndex: 10
                }}
              >
                {v.label}
              </motion.div>
            ))}
          </div>
        </div>

        {/* 右侧：邻接多重表 */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', position: 'relative', background: '#010409' }}>
          <div style={panelHeaderStyle}>邻接多重表存储 (Adjacency Multilist)</div>
          <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
            <svg style={{ width: '2000px', height: '1500px', position: 'absolute' }}>
              <defs>
                 <marker id="arrow-common" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={THEME.textMuted} /></marker>
              </defs>
              {renderLinks()}
            </svg>

            {/* 1. 顶点表头 (Vertex Nodes) */}
            {vertices.map(v => {
              const pos = multiHeads.find(h => h.id === v.id);
              return pos && (
                <motion.div key={`head-${v.id}`}
                  drag dragMomentum={false} onDragEnd={(e, i) => updatePos(setMultiHeads, multiHeads, v.id, i)}
                  initial={{ x: pos.x, y: pos.y }}
                  style={{
                    position: 'absolute', width: DIMS.vW, height: DIMS.vH,
                    display: 'flex', border: `1px solid ${THEME.border}`, background: THEME.panel,
                    cursor: 'move', borderRadius: 4, overflow: 'hidden', zIndex: 10
                  }}
                >
                  <div style={{ width: 40, background: THEME.blue, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold' }}>
                    {v.label}
                  </div>
                  <div style={{ flex: 1, background: '#21262d', color: THEME.textMuted, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    firstedge
                  </div>
                </motion.div>
              );
            })}

            {/* 2. 边节点 (Edge Nodes) */}
            {edges.map(e => {
              const pos = multiEdges.find(ed => ed.id === e.id);
              const uLabel = vertices.find(v => v.id === e.u)?.label || e.u;
              const vLabel = vertices.find(v => v.id === e.v)?.label || e.v;

              return pos && (
                <motion.div key={`edge-${e.id}`}
                  drag dragMomentum={false} onDragEnd={(ev, i) => updatePos(setMultiEdges, multiEdges, e.id, i)}
                  initial={{ x: pos.x, y: pos.y }}
                  style={{
                    position: 'absolute', width: DIMS.aW, height: DIMS.aH,
                    border: `1px solid ${THEME.border}`, background: THEME.panel,
                    display: 'flex', flexDirection: 'column',
                    cursor: 'move', borderRadius: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontSize: 11, zIndex: 5
                  }}
                >
                  {/* 第一行: ivex | jvex */}
                  <div style={{ flex: 1, display: 'flex', borderBottom: `1px solid ${THEME.border}` }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.orange, background: 'rgba(210, 153, 34, 0.1)' }}>
                       <span style={{fontSize:9, opacity:0.6, marginRight:4}}>i:</span>{uLabel}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.green, borderLeft: `1px solid ${THEME.border}`, background: 'rgba(46, 160, 67, 0.1)' }}>
                       <span style={{fontSize:9, opacity:0.6, marginRight:4}}>j:</span>{vLabel}
                    </div>
                  </div>

                  {/* 第二行: ilink | jlink */}
                  <div style={{ flex: 1, display: 'flex' }}>
                    <div style={{ flex: 1, color: THEME.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      iLink
                    </div>
                    <div style={{ flex: 1, color: THEME.green, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid ${THEME.border}` }}>
                      jLink
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 6, fontSize: 12, pointerEvents:'none' }}>
                <div style={{color: THEME.orange, marginBottom:4}}>── iLink (连接所有与 i 相关的边)</div>
                <div style={{color: THEME.green}}>── jLink (连接所有与 j 相关的边)</div>
            </div>

          </div>
        </div>
      </div>

      {/* 底部说明 */}
      <div style={{ height: 160, borderTop: `1px solid ${THEME.border}`, background: THEME.panel, display: 'flex' }}>
        <div style={{ width: 400, borderRight: `1px solid ${THEME.border}`, padding: 15, overflow: 'auto' }}>
          <div style={{fontWeight:'bold', marginBottom:10, color:THEME.text}}>C++ Struct Definition</div>
          <pre style={{ margin: 0, fontSize: 11, lineHeight: 1.4, color: THEME.textMuted }}>
{`struct EBox {
  int ivex, jvex; // 该边依附的两个顶点
  EBox *ilink;    // `}<span style={{color:THEME.orange}}>iLink: 依附于 ivex 的下一条边</span>{`
  EBox *jlink;    // `}<span style={{color:THEME.green}}>jLink: 依附于 jvex 的下一条边</span>{`
  // InfoType info; // 权值等
};

struct VexBox {
  VertexType data;
  EBox *firstedge; // 指向第一条依附该顶点的边
};`}
          </pre>
        </div>
        <div style={{ flex: 1, padding: 15, overflow: 'auto' }}>
           <div style={{fontWeight:'bold', marginBottom:10, color:THEME.text}}>系统日志 (System Logs)</div>
           {logs.map((l, i) => <div key={i} style={{fontSize:12, marginBottom:4, color: i===0?THEME.text:THEME.textMuted}}>{l}</div>)}
        </div>
      </div>
    </div>
  );
};

// ================== 辅助函数 ==================

const PathLine = ({ d, color }) => (
  <path d={d} stroke={color} strokeWidth="1.5" fill="none" opacity="0.8" markerEnd="url(#arrow-common)" />
);

const TextLabel = ({ x, y, text, color, vertical }) => (
  <text x={x} y={y} fill={color} fontWeight="bold" transform={vertical ? `rotate(90, ${x}, ${y})` : ''} textAnchor="middle">{text}</text>
);

const getBezierPath = (x1, y1, x2, y2) => {
  const dy = Math.abs(y2 - y1);
  const cp1x = x1 + 50;
  const cp1y = y1;
  const cp2x = x2; // 从上方进入
  const cp2y = y2 - 40;

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
};

const btnStyle = (bg) => ({
  padding: '6px 12px', borderRadius: 4, border: 'none', background: bg, color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 12
});
const selectStyle = {
  background: '#0d1117', color: THEME.text, border: `1px solid ${THEME.border}`, borderRadius: 4, padding: '2px 5px', fontSize: 12
};
const panelHeaderStyle = {
  padding: '8px 15px', background: THEME.panel, borderBottom: `1px solid ${THEME.border}`, fontSize: 12, fontWeight: 'bold', color: THEME.textMuted
};

export default AdjacencyMultilistDemo;