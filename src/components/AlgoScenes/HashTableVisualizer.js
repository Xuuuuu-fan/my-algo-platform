import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 内置 SVG 图标组件 (无需外部库) ---
const Icons = {
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  )
};

// --- 常量配置 ---
const TABLE_SIZE = 7;
const DELAY = 800;

// --- 颜色主题 ---
const COLORS = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  accent: '#1f6feb',
  success: '#2ea043',
  danger: '#da3633',
  warning: '#d29922',
  text: '#c9d1d9',
  codeBg: '#010409',
  highlight: '#388bfd26'
};

// --- 伪代码定义 ---
const CODE_Snippets = {
  INSERT: [
    { line: 1, text: "index = hash(key) % SIZE" },
    { line: 2, text: "head = table[index]" },
    { line: 3, text: "for node in head: // Check Duplicates" },
    { line: 4, text: "  if node.key == key: update val" },
    { line: 5, text: "new_node.next = head" },
    { line: 6, text: "table[index] = new_node" }
  ],
  SEARCH: [
    { line: 1, text: "index = hash(key) % SIZE" },
    { line: 2, text: "current = table[index]" },
    { line: 3, text: "while current is not null:" },
    { line: 4, text: "  if current.key == key: return Found" },
    { line: 5, text: "  current = current.next" },
    { line: 6, text: "return Not Found" }
  ],
  DELETE: [
    { line: 1, text: "index = hash(key) % SIZE" },
    { line: 2, text: "current = table[index]" },
    { line: 3, text: "while current:" },
    { line: 4, text: "  if current.key == key: remove node" },
    { line: 5, text: "  prev = current; current = current.next" },
    { line: 6, text: "return Done" }
  ]
};

const HashTableVisualizer = () => {
  // --- State ---
  const [table, setTable] = useState(Array.from({ length: TABLE_SIZE }, () => []));
  const [inputKey, setInputKey] = useState(15);

  // 动画控制状态
  const [activeLine, setActiveLine] = useState(-1);
  const [activeBucket, setActiveBucket] = useState(-1);
  const [activeNode, setActiveNode] = useState(null);
  const [mode, setMode] = useState('INSERT');
  const [log, setLog] = useState("准备就绪");
  const [isAnimating, setIsAnimating] = useState(false);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- 核心算法 ---

  const resetVisuals = () => {
    setActiveLine(-1);
    setActiveBucket(-1);
    setActiveNode(null);
  };

  // 1. 插入算法
  const handleInsert = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setMode('INSERT');
    resetVisuals();

    const key = parseInt(inputKey);
    if (isNaN(key)) { setLog("请输入有效数字"); setIsAnimating(false); return; }

    setActiveLine(1);
    const index = key % TABLE_SIZE;
    setLog(`计算哈希: ${key} % ${TABLE_SIZE} = ${index}`);
    await sleep(DELAY);

    setActiveLine(2);
    setActiveBucket(index);
    setLog(`定位到 Bucket [${index}]`);
    await sleep(DELAY);

    let bucket = [...table[index]];
    let found = false;

    if (bucket.length > 0) {
      setLog("发生哈希冲突，遍历链表检查重复...");
      for (let i = 0; i < bucket.length; i++) {
        setActiveLine(3);
        setActiveNode({ bucketIdx: index, nodeIdx: i, status: 'checking' });
        await sleep(DELAY/2);

        setActiveLine(4);
        setLog(`比较: ${bucket[i].key} == ${key} ?`);
        if (bucket[i].key === key) {
          found = true;
          setLog("Key 已存在，更新值");
          setActiveNode({ bucketIdx: index, nodeIdx: i, status: 'found' });
          await sleep(DELAY);
          break;
        }
        await sleep(DELAY/2);
      }
    }

    if (!found) {
      setActiveLine(5);
      setLog("未找到重复 Key，创建新节点");
      await sleep(DELAY/2);

      setActiveLine(6);
      setTable(prev => {
        const newTable = [...prev];
        newTable[index] = [...newTable[index], { key, val: key, id: Date.now() }];
        return newTable;
      });
      setLog(`插入成功: Key ${key} 放入 Bucket [${index}]`);
      await sleep(DELAY);
    }

    resetVisuals();
    setIsAnimating(false);
  };

  // 2. 查找算法
  const handleSearch = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setMode('SEARCH');
    resetVisuals();

    const key = parseInt(inputKey);
    setActiveLine(1);
    const index = key % TABLE_SIZE;
    setLog(`计算哈希: ${key} % ${TABLE_SIZE} = ${index}`);
    await sleep(DELAY);

    setActiveLine(2);
    setActiveBucket(index);
    await sleep(DELAY);

    const bucket = table[index];
    let found = false;

    for (let i = 0; i < bucket.length; i++) {
      setActiveLine(3);
      setActiveNode({ bucketIdx: index, nodeIdx: i, status: 'checking' });
      await sleep(DELAY);

      setActiveLine(4);
      if (bucket[i].key === key) {
        found = true;
        setActiveNode({ bucketIdx: index, nodeIdx: i, status: 'found' });
        setLog(`找到 Key ${key} !`);
        await sleep(DELAY * 1.5);
        break;
      }
      setActiveLine(5);
    }

    if (!found) {
      setActiveLine(6);
      setLog(`遍历结束，未找到 Key ${key}`);
      await sleep(DELAY);
    }

    resetVisuals();
    setIsAnimating(false);
  };

  // 3. 删除算法
  const handleDelete = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setMode('DELETE');
    resetVisuals();

    const key = parseInt(inputKey);
    setActiveLine(1);
    const index = key % TABLE_SIZE;
    setLog(`删除: 定位 Bucket [${index}]`);
    await sleep(DELAY);

    setActiveLine(2);
    setActiveBucket(index);
    await sleep(DELAY);

    const bucket = table[index];
    let foundIdx = -1;

    for (let i = 0; i < bucket.length; i++) {
      setActiveLine(3);
      setActiveNode({ bucketIdx: index, nodeIdx: i, status: 'checking' });
      await sleep(DELAY);

      setActiveLine(4);
      if (bucket[i].key === key) {
        foundIdx = i;
        setActiveNode({ bucketIdx: index, nodeIdx: i, status: 'danger' });
        setLog(`找到 Key ${key}，准备删除`);
        await sleep(DELAY);
        break;
      }
      setActiveLine(5);
    }

    if (foundIdx !== -1) {
      setTable(prev => {
        const newTable = [...prev];
        newTable[index] = newTable[index].filter((_, i) => i !== foundIdx);
        return newTable;
      });
      setLog("删除成功");
    } else {
      setActiveLine(6);
      setLog("未找到 Key，无法删除");
    }

    await sleep(DELAY);
    resetVisuals();
    setIsAnimating(false);
  };

  // --- 渲染组件 ---

  return (
    <div style={{
      display: 'flex', gap: 20, padding: 20, background: COLORS.bg, color: COLORS.text,
      fontFamily: 'system-ui, sans-serif', borderRadius: 12, minHeight: 600,
      flexWrap: 'wrap' // 适应小屏幕
    }}>

      {/* 左侧：控制区 + 可视化区 */}
      <div style={{ flex: 2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 顶部控制栏 */}
        <div style={{
          background: COLORS.panel, padding: 15, borderRadius: 8, border: `1px solid ${COLORS.border}`,
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap'
        }}>
          <input
            type="number"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            style={{
              background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: 'white',
              padding: '8px 12px', borderRadius: 4, width: 80
            }}
          />
          <ActionButton onClick={handleInsert} disabled={isAnimating} icon={<Icons.Plus />} label="插入" color={COLORS.accent} />
          <ActionButton onClick={handleSearch} disabled={isAnimating} icon={<Icons.Search />} label="查找" color={COLORS.success} />
          <ActionButton onClick={handleDelete} disabled={isAnimating} icon={<Icons.Trash />} label="删除" color={COLORS.danger} />

          <div style={{ marginLeft: 'auto', fontSize: 14, color: COLORS.warning, minWidth: 100, textAlign: 'right' }}>
            {log}
          </div>
        </div>

        {/* 可视化舞台 */}
        <div style={{ flex: 1, background: COLORS.panel, borderRadius: 8, padding: 20, border: `1px solid ${COLORS.border}`, overflowY: 'auto' }}>
          {table.map((bucket, bIdx) => (
            <div key={bIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 15, minHeight: 50 }}>

              {/* 桶索引 (Bucket Index) */}
              <motion.div
                animate={{
                  scale: activeBucket === bIdx ? 1.1 : 1,
                  borderColor: activeBucket === bIdx ? COLORS.accent : COLORS.border,
                  backgroundColor: activeBucket === bIdx ? 'rgba(31, 111, 235, 0.2)' : COLORS.bg
                }}
                style={{
                  width: 50, height: 50, border: `2px solid ${COLORS.border}`, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', marginRight: 15, flexShrink: 0, position: 'relative'
                }}
              >
                <span style={{ fontSize: 12, position: 'absolute', top: -10, color: '#8b949e' }}>idx</span>
                {bIdx}
              </motion.div>

              {/* 链表节点 (Linked List Nodes) */}
              <AnimatePresence>
                {bucket.map((node, nIdx) => {
                  let borderColor = COLORS.border;
                  let bg = COLORS.panel;

                  if (activeNode && activeNode.bucketIdx === bIdx && activeNode.nodeIdx === nIdx) {
                    if (activeNode.status === 'checking') { borderColor = COLORS.warning; bg = 'rgba(210, 153, 34, 0.1)'; }
                    if (activeNode.status === 'found') { borderColor = COLORS.success; bg = 'rgba(46, 160, 67, 0.2)'; }
                    if (activeNode.status === 'danger') { borderColor = COLORS.danger; bg = 'rgba(218, 54, 51, 0.2)'; }
                  }

                  return (
                    <motion.div
                      key={node.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.5 }}
                      animate={{ opacity: 1, x: 0, scale: 1, borderColor, backgroundColor: bg }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      {/* 箭头 (使用内置SVG) */}
                      <div style={{ margin: '0 5px', color: COLORS.border, display: 'flex' }}>
                         <Icons.ArrowRight />
                      </div>

                      {/* 数据节点 */}
                      <div style={{
                        width: 46, height: 46, borderRadius: '50%', border: `2px solid ${borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: bg, fontSize: 14, fontWeight: 'bold'
                      }}>
                        {node.key}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {bucket.length === 0 && (
                <div style={{ color: '#484f58', fontSize: 12, marginLeft: 10 }}>NULL</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：代码跟踪区 */}
      <div style={{ flex: 1, minWidth: 250, background: COLORS.codeBg, borderRadius: 8, border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 15px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: 'bold', fontSize: 14, color: COLORS.text }}>
          Pseudocode ({mode})
        </div>
        <div style={{ padding: 15, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8 }}>
          {CODE_Snippets[mode].map((snippet) => (
            <motion.div
              key={snippet.line}
              animate={{
                backgroundColor: activeLine === snippet.line ? COLORS.highlight : 'transparent',
                color: activeLine === snippet.line ? COLORS.text : '#8b949e',
                x: activeLine === snippet.line ? 5 : 0
              }}
              style={{ padding: '2px 8px', borderRadius: 4 }}
            >
              <span style={{ display: 'inline-block', width: 20, opacity: 0.5 }}>{snippet.line}</span>
              {snippet.text}
            </motion.div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: 15, fontSize: 12, color: '#8b949e', borderTop: `1px solid ${COLORS.border}` }}>
          当前哈希函数: <br/>
          <code style={{color: COLORS.accent}}>index = key % {TABLE_SIZE}</code>
        </div>
      </div>

    </div>
  );
};

// 通用按钮组件
const ActionButton = ({ onClick, disabled, icon, label, color }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: disabled ? 'transparent' : color,
      color: disabled ? '#484f58' : 'white',
      border: disabled ? '1px solid #30363d' : 'none',
      padding: '6px 12px', borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 500, fontSize: 13, transition: 'all 0.2s'
    }}
  >
    {icon} {label}
  </button>
);

export default HashTableVisualizer;