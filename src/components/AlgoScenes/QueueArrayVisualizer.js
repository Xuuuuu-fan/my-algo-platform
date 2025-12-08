import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================= 配置常量 =================
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  accent: '#58a6ff',     // 蓝色
  headNode: '#6e7681',   // 头结点颜色 (灰色)
  node: '#1f6feb',       // 数据节点颜色
  success: '#2ea043',
  danger: '#da3633',
  text: '#c9d1d9',
  codeBg: '#0d1117'
};

// ================= C++ 代码片段 =================
const CODES = {
  withHead: {
    title: '带头结点 (With Head Node)',
    init: `// 初始化
void InitQueue(LinkQueue &Q) {
    Q.front = Q.rear = (LinkNode*)malloc(sizeof(LinkNode));
    Q.front->next = NULL;
}`,
    enqueue: `// 入队
void EnQueue(LinkQueue &Q, ElemType x) {
    LinkNode *s = (LinkNode *)malloc(sizeof(LinkNode));
    s->data = x; s->next = NULL;
    Q.rear->next = s;  // 尾插法
    Q.rear = s;        // 更新尾指针
}`,
    dequeue: `// 出队
bool DeQueue(LinkQueue &Q, ElemType &x) {
    if (Q.front == Q.rear) return false; // 空
    LinkNode *p = Q.front->next;
    x = p->data;
    Q.front->next = p->next; // 修改头结点的next
    if (Q.rear == p) Q.rear = Q.front; // 若原队列只有一个结点
    free(p);
    return true;
}`
  },
  noHead: {
    title: '不带头结点 (Without Head Node)',
    init: `// 初始化
void InitQueue(LinkQueue &Q) {
    Q.front = NULL;
    Q.rear = NULL;
}`,
    enqueue: `// 入队 (需特殊处理第一个元素)
void EnQueue(LinkQueue &Q, ElemType x) {
    LinkNode *s = (LinkNode *)malloc(sizeof(LinkNode));
    s->data = x; s->next = NULL;
    if (Q.front == NULL) { // 队列空
        Q.front = s;       // front 指向新结点
        Q.rear = s;        // rear 指向新结点
    } else {
        Q.rear->next = s;
        Q.rear = s;
    }
}`,
    dequeue: `// 出队 (需特殊处理最后一个元素)
bool DeQueue(LinkQueue &Q, ElemType &x) {
    if (Q.front == NULL) return false; // 空
    LinkNode *p = Q.front;
    x = p->data;
    Q.front = p->next; // front 后移
    if (Q.front == NULL) Q.rear = NULL; // 删空了
    free(p);
    return true;
}`
  }
};

// ================= 主组件 =================
const QueueLinkedVisualizer = () => {
  // mode: 'withHead' | 'noHead'
  const [mode, setMode] = useState('withHead');

  // 链表数据: [{id, val, isHead}]
  // 如果是带头结点模式，初始有一个 dummy node
  const [nodes, setNodes] = useState([{ id: 'head', val: 'HEAD', isHead: true }]);

  const [inputValue, setInputValue] = useState('');
  const [nextId, setNextId] = useState(1);
  const [activeCode, setActiveCode] = useState('init'); // 'init', 'enqueue', 'dequeue'

  // 切换模式时重置
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setActiveCode('init');
    setNextId(1);
    if (newMode === 'withHead') {
      setNodes([{ id: 'head', val: 'HEAD', isHead: true }]);
    } else {
      setNodes([]);
    }
  };

  // 入队
  const handleEnqueue = () => {
    if (!inputValue) return;
    setActiveCode('enqueue');

    const newNode = { id: nextId, val: inputValue, isHead: false };
    setNodes([...nodes, newNode]);
    setNextId(nextId + 1);
    setInputValue('');
  };

  // 出队
  const handleDequeue = () => {
    setActiveCode('dequeue');

    if (mode === 'withHead') {
      // 带头结点：删除 index 1 的元素 (index 0 是 head)
      if (nodes.length <= 1) return; // 只有头结点=空
      const newNodes = nodes.filter((_, idx) => idx !== 1);
      setNodes(newNodes);
    } else {
      // 不带头结点：删除 index 0
      if (nodes.length === 0) return;
      const newNodes = nodes.slice(1);
      setNodes(newNodes);
    }
  };

  // 计算 Front 和 Rear 指向谁
  // 返回 node 的 id
  const getPointers = () => {
    if (mode === 'withHead') {
      // Front 始终指向 Head
      const frontId = nodes[0]?.id;
      // Rear 指向最后一个
      const rearId = nodes[nodes.length - 1]?.id;
      return { frontId, rearId };
    } else {
      // Front 指向第一个有效数据
      const frontId = nodes.length > 0 ? nodes[0].id : null;
      // Rear 指向最后一个
      const rearId = nodes.length > 0 ? nodes[nodes.length - 1].id : null;
      return { frontId, rearId };
    }
  };

  const { frontId, rearId } = getPointers();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'sans-serif' }}>

      {/* 顶部控制栏 */}
      <div style={{
        padding: 15, background: THEME.panel,
        border: `1px solid ${THEME.border}`, borderRadius: 8,
        display: 'flex', gap: 15, alignItems: 'center', flexWrap: 'wrap'
      }}>
        {/* 模式切换 */}
        <div style={{ display: 'flex', background: '#0d1117', padding: 4, borderRadius: 6, border: `1px solid ${THEME.border}` }}>
          <button
            onClick={() => handleModeChange('withHead')}
            style={toggleBtnStyle(mode === 'withHead')}
          >
            带头结点
          </button>
          <button
            onClick={() => handleModeChange('noHead')}
            style={toggleBtnStyle(mode === 'noHead')}
          >
            不带头结点
          </button>
        </div>

        <div style={{ width: 1, height: 20, background: THEME.border }}></div>

        {/* 操作区 */}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Value"
          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #555', background: '#0d1117', color: 'white', width: 80 }}
          onKeyDown={e => e.key === 'Enter' && handleEnqueue()}
        />
        <button onClick={handleEnqueue} style={{ ...btnStyle, background: THEME.success }}>入队</button>
        <button onClick={handleDequeue} style={{ ...btnStyle, background: THEME.danger }}>出队</button>
      </div>

      {/* 主体区域：左右分栏 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* 左侧：可视化区 */}
        <div style={{
          background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8,
          padding: 20, minHeight: 300, display: 'flex', alignItems: 'center', overflowX: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, paddingLeft: 20 }}>
            <AnimatePresence mode='popLayout'>
              {nodes.map((node, i) => (
                <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>

                  {/* 节点主体 */}
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.5, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{ position: 'relative', margin: '0 10px' }}
                  >
                    {/* 节点方块 */}
                    <div style={{
                      width: 50, height: 50,
                      background: node.isHead ? THEME.headNode : THEME.node,
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 'bold', border: `2px solid #fff`,
                      position: 'relative'
                    }}>
                      {node.isHead ? 'H' : node.val}

                      {/* 指针域示意 */}
                      <div style={{
                        position: 'absolute', right: 0, top: 0, bottom: 0, width: 15,
                        borderLeft: '1px solid rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.1)'
                      }} />
                    </div>

                    {/* Front 指针 */}
                    {node.id === frontId && (
                      <motion.div
                        layoutId="front"
                        style={{ position: 'absolute', top: -30, left: 0, right: 0, textAlign: 'center', color: THEME.success, fontWeight: 'bold', fontSize: 12 }}
                      >
                        Front ▼
                      </motion.div>
                    )}

                    {/* Rear 指针 */}
                    {node.id === rearId && (
                      <motion.div
                        layoutId="rear"
                        style={{ position: 'absolute', bottom: -30, left: 0, right: 0, textAlign: 'center', color: THEME.danger, fontWeight: 'bold', fontSize: 12 }}
                      >
                        ▲ Rear
                      </motion.div>
                    )}
                  </motion.div>

                  {/* 箭头 (除了最后一个) */}
                  {i < nodes.length - 1 && (
                    <motion.div
                      layout
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 30, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      style={{ height: 2, background: '#8b949e', position: 'relative' }}
                    >
                       <div style={{position:'absolute', right:0, top:-3, borderLeft:'6px solid #8b949e', borderTop:'4px solid transparent', borderBottom:'4px solid transparent'}}></div>
                    </motion.div>
                  )}
                </div>
              ))}
            </AnimatePresence>

            {nodes.length === 0 && (
              <div style={{ color: '#666', fontStyle: 'italic', paddingLeft: 20 }}>
                NULL (空队列) <br/>
                <span style={{ fontSize: 12 }}>Front = NULL, Rear = NULL</span>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：代码区 */}
        <div style={{ background: THEME.panel, border: `1px solid ${THEME.border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', background: '#21262d', borderBottom: `1px solid ${THEME.border}`, fontSize: 13, color: THEME.text, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>{CODES[mode].title}</span>
            <span style={{ color: THEME.accent }}>
              {activeCode === 'init' && '初始化'}
              {activeCode === 'enqueue' && '入队操作'}
              {activeCode === 'dequeue' && '出队操作'}
            </span>
          </div>

          <div style={{ padding: 15, background: THEME.codeBg, flex: 1, overflow: 'auto', fontFamily: 'Consolas, monospace', fontSize: 13, color: '#c9d1d9' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {CODES[mode][activeCode]}
            </pre>
          </div>

          <div style={{ padding: 10, borderTop: `1px solid ${THEME.border}`, fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>
            {mode === 'withHead' ? (
              <>
                ℹ️ <b>特点：</b> 无论队列是否为空，<code>front</code> 指针始终指向头结点。<br/>
                ✅ <b>优势：</b> 入队/出队无需判断队列是否为空，代码统一。
              </>
            ) : (
              <>
                ℹ️ <b>特点：</b> 队列为空时，<code>front</code> 和 <code>rear</code> 均为 NULL。<br/>
                ⚠️ <b>注意：</b> 第一个元素入队和最后一个元素出队时，需单独处理指针。
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// 样式
const btnStyle = {
  padding: '5px 12px', border: 'none', borderRadius: 4, color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: 13
};

const toggleBtnStyle = (isActive) => ({
  padding: '5px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12,
  background: isActive ? '#1f6feb' : 'transparent',
  color: isActive ? '#fff' : '#8b949e',
  fontWeight: isActive ? 'bold' : 'normal',
  transition: '0.2s'
});

export default QueueLinkedVisualizer;