import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 样式常量 (保持与参考代码一致的风格) ---
const BOX_W = 50;       // 数组元素宽度
const BOX_H = 50;       // 数组元素高度
const GAP = 10;         // 间隙
const START_X = 50;     // 起始X坐标
const START_Y = 150;    // 起始Y坐标

// 颜色定义
const COLORS = {
  bg: '#010409',        // 背景深黑
  boxBg: '#161b22',     // 盒子背景
  boxStroke: '#30363d', // 盒子边框
  text: '#c9d1d9',      // 默认文字
  textSub: '#8b949e',   // 辅助文字(索引)
  primary: '#1f6feb',   // 蓝色 (高亮/目标)
  success: '#2ea043',   // 绿色 (插入成功/新元素)
  warning: '#d29922',   // 橙色 (搬运中)
  error: '#da3633',     // 红色 (错误)
  empty: '#0d1117'      // 空格子背景
};

const SeqListInsertion = ({ defaultCapacity = 8 }) => {
  // --- 状态管理 ---
  // 数组数据：每个元素包含 { id, val, status }
  // status: 'normal' | 'moving' | 'target' | 'new'
  const [list, setList] = useState(() => {
    const arr = new Array(defaultCapacity).fill(null);
    [10, 20, 30, 40].forEach((v, i) => arr[i] = { id: i, val: v, status: 'normal' });
    return arr;
  });

  const [size, setSize] = useState(4);
  const [pointers, setPointers] = useState([]); // { idx, label, color }
  const [message, setMessage] = useState("准备就绪");
  const [isAnimating, setIsAnimating] = useState(false);

  // 输入控制
  const [insertIdx, setInsertIdx] = useState(2);
  const [insertVal, setInsertVal] = useState(99);

  // --- 辅助函数 ---
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- 核心算法逻辑 ---
  const handleInsert = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPointers([]);

    // 1. 边界检查
    if (size >= list.length) {
      setMessage("错误：顺序表已满 (Overflow)");
      setIsAnimating(false);
      return;
    }
    if (insertIdx < 0 || insertIdx > size) {
      setMessage("错误：索引越界");
      setIsAnimating(false);
      return;
    }

    // 2. 标记目标位置
    setMessage(`准备在索引 [${insertIdx}] 插入数值 ${insertVal}`);
    setPointers([{ idx: insertIdx, label: 'Target', color: COLORS.primary }]);

    // 高亮目标格子的边框
    setList(prev => prev.map((item, i) =>
      i === insertIdx ? { ...item, status: 'target' } : { ...item, status: 'normal' }
    ));
    await sleep(800);

    // 3. 搬运循环 (从后向前)
    setMessage("开始搬运元素 (Shift Element)...");

    // 我们不仅需要逻辑上的移动，还需要视觉上的移动
    // 克隆一份当前数据用于操作
    let currentList = [...list];

    for (let j = size - 1; j >= insertIdx; j--) {
      // 更新指针位置
      setPointers([
        { idx: insertIdx, label: 'Target', color: COLORS.primary },
        { idx: j, label: 'j', color: COLORS.warning } // 当前搬运源
      ]);

      setMessage(`将 list[${j}] (${currentList[j].val}) 向后移至 list[${j+1}]`);

      // 视觉状态更新：源设为moving
      setList(prev => {
        const next = [...prev];
        if (next[j]) next[j] = { ...next[j], status: 'moving' };
        return next;
      });
      await sleep(600);

      // 执行移动 (逻辑 + 视觉)
      // 在React中，为了让Framer Motion识别移动，我们需要交换位置或者更新Key
      // 这里为了简单直观，我们直接复制数据
      currentList[j + 1] = { ...currentList[j], id: Math.random() }; // 给新位置一个新ID以触发动画
      // (可选：清空旧位置，或者保留直到覆盖)
      // currentList[j] = null; // 顺序表逻辑通常是覆盖，但视觉上为了连贯可以先保留

      setList([...currentList]);
      await sleep(600);
    }

    // 4. 插入新元素
    setMessage(`插入新元素 ${insertVal}`);
    setPointers([{ idx: insertIdx, label: 'Insert', color: COLORS.success }]);

    // 更新数据
    currentList[insertIdx] = { id: 'new-' + Date.now(), val: insertVal, status: 'new' };
    setList([...currentList]);
    setSize(s => s + 1);

    await sleep(800);

    // 5. 完成
    setMessage("插入完成！");
    setPointers([]);
    setList(prev => prev.map(item => item ? { ...item, status: 'normal' } : null));
    setIsAnimating(false);
  };

  // --- 渲染部分 ---

  // 1. 渲染底座 (空的格子)
  const renderSlots = () => (
    list.map((_, i) => (
      <g key={`slot-${i}`} transform={`translate(${START_X + i * (BOX_W + GAP)}, ${START_Y})`}>
        {/* 格子背景 */}
        <rect
          width={BOX_W} height={BOX_H} rx={6}
          fill={COLORS.empty}
          stroke={COLORS.boxStroke}
          strokeWidth="1.5"
          strokeDasharray={i >= size ? "4 2" : "0"} // 空闲区域虚线
        />
        {/* 索引下标 */}
        <text x={BOX_W/2} y={BOX_H + 20} textAnchor="middle" fill={COLORS.textSub} fontSize="12">
          {i}
        </text>
      </g>
    ))
  );

  // 2. 渲染数据元素 (主要动画对象)
  const renderElements = () => (
    list.map((item, i) => {
      if (!item) return null;

      // 根据状态决定颜色
      let bgColor = COLORS.boxBg;
      let strokeColor = COLORS.boxStroke;
      let textColor = COLORS.text;

      if (item.status === 'moving') {
        bgColor = '#3fb95022'; // 淡绿/橙背景
        strokeColor = COLORS.warning;
      } else if (item.status === 'new') {
        bgColor = '#2ea04333';
        strokeColor = COLORS.success;
        textColor = '#fff';
      } else if (item.status === 'target') {
        strokeColor = COLORS.primary;
      }

      return (
        <motion.g
          key={item.id} // 必须有唯一key才能触发layout动画
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, x: START_X + i * (BOX_W + GAP), y: START_Y }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <rect
            width={BOX_W} height={BOX_H} rx={6}
            fill={bgColor}
            stroke={strokeColor}
            strokeWidth={item.status === 'normal' ? 1.5 : 2.5}
          />
          <text
            x={BOX_W/2} y={BOX_H/2} dy=".3em"
            textAnchor="middle"
            fill={textColor}
            fontWeight="bold"
            fontSize="16"
          >
            {item.val}
          </text>
        </motion.g>
      );
    })
  );

  // 3. 渲染指针 (Pointers)
  const renderPointers = () => (
    pointers.map((p, i) => {
      const xPos = START_X + p.idx * (BOX_W + GAP) + BOX_W/2;
      const yPos = START_Y - 10; // 盒子上方

      return (
        <motion.g
          key={`ptr-${p.label}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, x: xPos, y: yPos }}
          transition={{ duration: 0.3 }}
        >
          {/* 向下的箭头 */}
          <path d="M0,0 L-5,-8 L5,-8 Z" fill={p.color} />
          <line x1="0" y1="-8" x2="0" y2="-25" stroke={p.color} strokeWidth="2" />

          {/* 标签背景 */}
          <rect x="-20" y="-45" width="40" height="20" rx="4" fill={p.color} />
          <text x="0" y="-31" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
            {p.label}
          </text>
        </motion.g>
      );
    })
  );

  return (
    <div style={{
      width: '100%',
      background: COLORS.bg,
      borderRadius: '8px',
      overflow: 'hidden',
      border: `1px solid ${COLORS.boxStroke}`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    }}>
      {/* 顶部控制栏 */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${COLORS.boxStroke}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ color: COLORS.textSub, fontSize: '11px', marginBottom: '4px' }}>插入位置 Index</label>
          <input
            type="number" value={insertIdx} onChange={e => setInsertIdx(+e.target.value)}
            style={{ background: '#0d1117', border: `1px solid ${COLORS.boxStroke}`, color: COLORS.text, padding: '4px 8px', borderRadius: '4px', width: '60px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ color: COLORS.textSub, fontSize: '11px', marginBottom: '4px' }}>数值 Value</label>
          <input
            type="number" value={insertVal} onChange={e => setInsertVal(+e.target.value)}
            style={{ background: '#0d1117', border: `1px solid ${COLORS.boxStroke}`, color: COLORS.text, padding: '4px 8px', borderRadius: '4px', width: '60px' }}
          />
        </div>
        <button
          onClick={handleInsert} disabled={isAnimating}
          style={{
            marginTop: 'auto', height: '32px', padding: '0 16px',
            background: isAnimating ? COLORS.boxStroke : COLORS.success,
            color: '#fff', border: 'none', borderRadius: '4px', cursor: isAnimating ? 'default' : 'pointer',
            fontWeight: 'bold', fontSize: '13px'
          }}
        >
          {isAnimating ? '运行中...' : '开始插入 (Run)'}
        </button>

        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
           <div style={{ color: COLORS.textSub, fontSize: '12px' }}>Current Size: <span style={{color: COLORS.text}}>{size}</span> / {defaultCapacity}</div>
        </div>
      </div>

      {/* SVG 可视化区域 */}
      <div style={{ position: 'relative', height: '300px' }}>
        <svg width="100%" height="100%" viewBox="0 0 600 300">
          <defs>
            <marker id="arrow-ptr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={COLORS.primary} />
            </marker>
          </defs>

          {/* 渲染层级：底座 -> 元素 -> 指针 */}
          {renderSlots()}
          <AnimatePresence>
            {renderElements()}
            {renderPointers()}
          </AnimatePresence>

          {/* 状态日志显示在SVG内部底部 */}
          <text x="20" y="280" fill={COLORS.textSub} fontSize="14" style={{ fontFamily: 'monospace' }}>
            {`> ${message}`}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default SeqListInsertion;