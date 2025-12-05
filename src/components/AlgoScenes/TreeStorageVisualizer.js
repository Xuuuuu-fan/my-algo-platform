import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 通用样式
const CELL_W = 50;
const CELL_H = 40;

const TreeStorageVisualizer = ({ data, mode }) => {
  // data: 包含 nodes(逻辑树坐标), storage(存储结构数据)
  // mode: 'parent' | 'child' | 'cs' (Child-Sibling)

  // --- 1. 双亲表示法视图 (数组) ---
  const renderParentTable = () => (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
      <div style={{ border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden' }}>
        {/* 表头 */}
        <div style={{ display: 'flex', background: '#161b22', borderBottom: '1px solid #30363d' }}>
          <div style={{ width: CELL_W, padding: 8, textAlign: 'center', color: '#8b949e', fontSize: 12 }}>下标</div>
          <div style={{ width: CELL_W, padding: 8, textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>数据</div>
          <div style={{ width: CELL_W, padding: 8, textAlign: 'center', color: '#58a6ff', fontWeight: 'bold' }}>双亲</div>
        </div>
        {/* 数据行 */}
        {data.storage.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ display: 'flex', borderBottom: '1px solid #21262d', background: '#0d1117' }}
          >
            <div style={{ width: CELL_W, padding: 8, textAlign: 'center', color: '#8b949e', fontSize: 12 }}>{item.idx}</div>
            <div style={{ width: CELL_W, padding: 8, textAlign: 'center', color: '#fff' }}>{item.data}</div>
            <div style={{ width: CELL_W, padding: 8, textAlign: 'center', color: item.parent === -1 ? '#8b949e' : '#58a6ff' }}>
              {item.parent}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // --- 2. 孩子表示法视图 (数组 + 链表) ---
  const renderChildList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20, gap: 10 }}>
      {data.storage.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {/* 数组头结点 */}
          <div style={{
            display: 'flex', border: '1px solid #30363d', borderRadius: 4,
            background: '#161b22', marginRight: 10, width: 100
          }}>
            <div style={{ flex: 1, padding: 5, borderRight: '1px solid #30363d', textAlign: 'center', color:'#8b949e', fontSize:10 }}>
              {item.idx}<br/><span style={{color:'#fff', fontSize:14}}>{item.data}</span>
            </div>
            <div style={{ width: 30, background: '#21262d', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}></div>
            </div>
          </div>

          {/* 链表节点 */}
          {item.children.map((childIdx, ci) => (
            <React.Fragment key={childIdx}>
              {/* 箭头 */}
              <motion.div
                initial={{ width: 0 }} animate={{ width: 30 }}
                style={{ height: 2, background: '#8b949e', position: 'relative' }}
              >
                 <div style={{position:'absolute', right:0, top:-4, borderLeft:'6px solid #8b949e', borderTop:'5px solid transparent', borderBottom:'5px solid transparent'}}></div>
              </motion.div>

              {/* 孩子节点 */}
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                style={{
                  width: 40, height: 30, border: '1px solid #58a6ff', borderRadius: 4,
                  background: '#0d1117', color: '#58a6ff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}
              >
                {childIdx}
              </motion.div>
            </React.Fragment>
          ))}
          {/* 空指针 */}
          {item.children.length === 0 && <span style={{color:'#30363d', marginLeft: 10}}>^</span>}
        </motion.div>
      ))}
    </div>
  );

  // --- 3. 孩子兄弟表示法视图 (二叉树图) ---
  const renderCSGraph = () => (
    <svg width="100%" height="300" viewBox="0 0 600 300">
      <defs>
        <marker id="arrow-child" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#58a6ff" />
        </marker>
        <marker id="arrow-sibling" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#f69d50" />
        </marker>
      </defs>
      <AnimatePresence>
        {data.links.map((link, i) => {
          const s = data.nodes.find(n => n.id === link.source);
          const t = data.nodes.find(n => n.id === link.target);
          const isSibling = link.type === 'sibling';
          if (!s || !t) return null;
          return (
            <motion.line
              key={i}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke={isSibling ? '#f69d50' : '#58a6ff'}
              strokeWidth="2"
              strokeDasharray={isSibling ? "5,5" : "0"}
              markerEnd={isSibling ? "url(#arrow-sibling)" : "url(#arrow-child)"}
            />
          );
        })}
        {data.nodes.map((node) => (
          <motion.g key={node.id} initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <circle cx={node.x} cy={node.y} r={18} fill="#1f6feb" stroke="#fff" strokeWidth="2" />
            <text x={node.x} y={node.y} dy=".3em" textAnchor="middle" fill="white" fontWeight="bold">{node.val}</text>
          </motion.g>
        ))}
      </AnimatePresence>
    </svg>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: mode === 'cs' ? '1fr' : '1fr 1fr', gap: 20, padding: 20, background: '#010409', borderRadius: 8, border: '1px solid #30363d' }}>
      {/* 左侧：逻辑结构 (仅在非CS模式显示，作为对照) */}
      {mode !== 'cs' && (
        <div style={{ borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4 style={{ color: '#8b949e', marginBottom: 10 }}>逻辑结构 (树/森林)</h4>
          <svg width="100%" height="250" viewBox="0 0 300 250">
            {data.logicLinks.map((l, i) => {
               const s = data.logicNodes.find(n => n.id === l.source);
               const t = data.logicNodes.find(n => n.id === l.target);
               return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#30363d" strokeWidth="2" />;
            })}
            {data.logicNodes.map(n => (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r={15} fill="#2ea043" />
                <text x={n.x} y={n.y} dy=".3em" textAnchor="middle" fill="white" fontSize="12">{n.val}</text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* 右侧：存储结构 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h4 style={{ color: '#8b949e', marginBottom: 10 }}>
          {mode === 'parent' && '物理存储 (双亲表示法 - 数组)'}
          {mode === 'child' && '物理存储 (孩子表示法 - 链表)'}
          {mode === 'cs' && '二叉链表存储 (左孩子右兄弟)'}
        </h4>

        {mode === 'parent' && renderParentTable()}
        {mode === 'child' && renderChildList()}
        {mode === 'cs' && renderCSGraph()}

        {/* 图例 */}
        {mode === 'cs' && (
          <div style={{ display: 'flex', gap: 15, marginTop: 10, fontSize: 12, color: '#8b949e' }}>
            <span style={{color: '#58a6ff'}}>── 实线：左孩子 (First Child)</span>
            <span style={{color: '#f69d50'}}>--- 虚线：右兄弟 (Next Sibling)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeStorageVisualizer;