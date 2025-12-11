import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 样式常量 ---
const BOX_W = 50;
const BOX_H = 50;
const GAP = 10;
const START_X = 50;
const START_Y = 150;

// 颜色定义
const COLORS = {
  bg: '#010409',
  boxBg: '#161b22',
  boxStroke: '#30363d',
  text: '#c9d1d9',
  textSub: '#8b949e',
  primary: '#1f6feb',   // 正在检查 (Blue)
  success: '#2ea043',   // 找到了 (Green)
  visited: '#21262d',   // 查过但不匹配 (Dark Gray)
  error: '#da3633',     // 未找到
  empty: '#0d1117'
};

const SeqListSearchtwo = ({ defaultCapacity = 10 }) => {
  // --- 初始化随机数据 ---
  const initData = () => {
    // 生成一组无序的随机数
    const raw = Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10);
    return raw.map((v, i) => ({
      id: `item-${i}`,
      val: v,
      status: 'normal' // 'normal' | 'checking' | 'visited' | 'found'
    }));
  };

  // --- 状态管理 ---
  const [list, setList] = useState(initData());
  const [targetVal, setTargetVal] = useState(list[Math.floor(Math.random() * 4)].val); // 默认选一个存在的数
  const [pointer, setPointer] = useState(null); // 当前指针位置 { idx, label, color }
  const [message, setMessage] = useState("请输入数值进行查找");
  const [isAnimating, setIsAnimating] = useState(false);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- 重置 ---
  const handleReset = () => {
    const newData = initData();
    setList(newData);
    setTargetVal(newData[Math.floor(Math.random() * newData.length)].val);
    setPointer(null);
    setMessage("数据已重置");
    setIsAnimating(false);
  };

  // --- 查找核心逻辑 ---
  const handleSearch = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // 1. 重置所有状态为 normal
    setList(prev => prev.map(item => ({ ...item, status: 'normal' })));
    setMessage(`开始查找数值: ${targetVal}`);
    await sleep(500);

    let isFound = false;

    // 2. 线性扫描循环
    for (let i = 0; i < list.length; i++) {
      // 2.1 移动指针，标记当前正在检查
      setPointer({ idx: i, label: 'i', color: COLORS.primary });
      setList(prev => prev.map((item, idx) =>
        idx === i ? { ...item, status: 'checking' } : item
      ));

      setMessage(`比较: list[${i}] (${list[i].val}) == ${targetVal} ?`);
      await sleep(600);

      // 2.2 判断
      if (list[i].val === Number(targetVal)) {
        // --- 找到目标 ---
        isFound = true;
        setMessage(`成功！在索引 [${i}] 处找到数值 ${targetVal}`);

        setList(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'found' } : item
        ));
        setPointer({ idx: i, label: 'Found', color: COLORS.success });

        // 成功动画效果（可选：简短震动或放大）
        await sleep(200);
        break;
      } else {
        // --- 不匹配 ---
        // 将当前元素标记为 'visited' (变暗)
        setList(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'visited' } : item
        ));
      }

      // 循环间歇
      await sleep(200);
    }

    // 3. 处理未找到的情况
    if (!isFound) {
      setMessage(`遍历结束，未找到数值 ${targetVal}`);
      setPointer(null); // 移除指针
      // 可选：显示一个全局错误状态
    }

    setIsAnimating(false);
  };

  // --- 渲染辅助 ---
  const renderSlots = () => (
    Array.from({ length: defaultCapacity }).map((_, i) => (
      <g key={`slot-${i}`} transform={`translate(${START_X + i * (BOX_W + GAP)}, ${START_Y})`}>
        <rect
          width={BOX_W} height={BOX_H} rx={6}
          fill={COLORS.empty}
          stroke={COLORS.boxStroke}
          strokeWidth="1.5"
          strokeDasharray="4 2" // 虚线底座
        />
        <text x={BOX_W/2} y={BOX_H + 20} textAnchor="middle" fill={COLORS.textSub} fontSize="12">
          {i}
        </text>
      </g>
    ))
  );

  const renderElements = () => (
    list.map((item, i) => {
      let bgColor = COLORS.boxBg;
      let strokeColor = COLORS.boxStroke;
      let textColor = COLORS.text;
      let scale = 1;

      // 根据状态改变样式
      switch (item.status) {
        case 'checking':
          bgColor = '#1f6feb22'; // 淡蓝
          strokeColor = COLORS.primary;
          scale = 1.1; // 正在检查时稍微放大
          break;
        case 'found':
          bgColor = '#2ea04344'; // 绿色高亮
          strokeColor = COLORS.success;
          textColor = '#fff';
          scale = 1.15;
          break;
        case 'visited':
          bgColor = '#161b22';
          strokeColor = '#21262d'; // 变暗
          textColor = '#484f58';   // 文字变暗
          break;
        default:
          break;
      }

      return (
        <motion.g
          key={item.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, x: START_X + i * (BOX_W + GAP), y: START_Y, scale }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          <rect
            width={BOX_W} height={BOX_H} rx={6}
            fill={bgColor}
            stroke={strokeColor}
            strokeWidth={item.status === 'checking' || item.status === 'found' ? 2 : 1.5}
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

  const renderPointer = () => {
    if (!pointer) return null;
    const xPos = START_X + pointer.idx * (BOX_W + GAP) + BOX_W/2;

    return (
      <motion.g
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, x: xPos, y: START_Y - 15 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* 向下的箭头 */}
        <path d="M0,0 L-6,-8 L6,-8 Z" fill={pointer.color} />
        <line x1="0" y1="-8" x2="0" y2="-25" stroke={pointer.color} strokeWidth="2" />

        {/* 指针标签 */}
        <rect x="-24" y="-45" width="48" height="20" rx="4" fill={pointer.color} />
        <text x="0" y="-31" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
          {pointer.label}
        </text>
      </motion.g>
    );
  };

  return (
    <div style={{
      width: '100%',
      background: COLORS.bg,
      borderRadius: '8px',
      overflow: 'hidden',
      border: `1px solid ${COLORS.boxStroke}`,
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* 顶部控制栏 */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${COLORS.boxStroke}`, display: 'flex', gap: '12px', alignItems: 'end' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ color: COLORS.textSub, fontSize: '11px', marginBottom: '4px' }}>查找数值 (Target)</label>
          <input
            type="number" value={targetVal} onChange={e => setTargetVal(+e.target.value)}
            style={{
              background: '#0d1117', border: `1px solid ${COLORS.boxStroke}`,
              color: COLORS.text, padding: '6px 8px', borderRadius: '4px', width: '80px'
            }}
          />
        </div>

        <button
          onClick={handleSearch} disabled={isAnimating}
          style={{
            height: '34px', padding: '0 16px',
            background: isAnimating ? COLORS.boxStroke : COLORS.primary,
            color: '#fff', border: 'none', borderRadius: '4px', cursor: isAnimating ? 'default' : 'pointer',
            fontWeight: 'bold', fontSize: '13px'
          }}
        >
          {isAnimating ? '查找中...' : '开始查找 (Search)'}
        </button>

        <button
          onClick={handleReset} disabled={isAnimating}
          style={{
            height: '34px', padding: '0 12px', marginLeft: 'auto',
            background: 'transparent', border: `1px solid ${COLORS.boxStroke}`,
            color: COLORS.textSub, borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
          }}
        >
          🎲 随机重置
        </button>
      </div>

      {/* 舞台区域 */}
      <div style={{ position: 'relative', height: '280px' }}>
        <svg width="100%" height="100%" viewBox="0 0 600 280">
          {/* 右上角时间复杂度提示 */}
          <text x="580" y="30" textAnchor="end" fill={COLORS.textSub} fontSize="12" opacity="0.7">
            Time Complexity: O(n)
          </text>

          {renderSlots()}
          <AnimatePresence>
            {renderElements()}
            {renderPointer()}
          </AnimatePresence>

          {/* 底部日志 */}
          <text x="20" y="260" fill={COLORS.textSub} fontSize="14" style={{ fontFamily: 'monospace' }}>
            {`> ${message}`}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default SeqListSearchtwo;