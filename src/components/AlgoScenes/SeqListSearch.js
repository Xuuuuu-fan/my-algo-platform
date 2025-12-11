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
  primary: '#1f6feb',   // 蓝色
  success: '#2ea043',   // 绿色 (Found)
  checking: '#d29922',  // 橙色 (Checking)
  mismatch: '#da3633',  // 红色 (Mismatch)
  visited: '#21262d',   // 灰色 (已检查)
  empty: '#0d1117'
};

const SeqListSearch = ({ defaultCapacity = 10 }) => {
  // --- 初始化数据 ---
  const initData = () => {
    const arr = new Array(defaultCapacity).fill(null);
    // 生成随机有序或无序数据皆可，这里用无序数据演示通用性
    const raw = [12, 45, 7, 99, 23, 56, 8, 30];
    raw.forEach((v, i) => {
      arr[i] = { id: i, val: v, status: 'normal' }; // status: normal | checking | found | mismatch | visited
    });
    return { data: arr, size: raw.length };
  };

  const [state, setState] = useState(initData());
  const [targetVal, setTargetVal] = useState(23);
  const [pointer, setPointer] = useState(null); // { idx, color, label }
  const [message, setMessage] = useState("输入目标值开始查找");
  const [isAnimating, setIsAnimating] = useState(false);

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- 重置 ---
  const handleReset = () => {
    setState(initData());
    setPointer(null);
    setMessage("数据已重置");
    setIsAnimating(false);
  };

  // --- 查找逻辑 ---
  const handleSearch = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPointer(null);

    // 1. 重置所有元素颜色
    setState(prev => ({
      ...prev,
      data: prev.data.map(item => item ? { ...item, status: 'normal' } : null)
    }));
    await sleep(300);

    const { data, size } = state;
    let found = false;

    // 2. 遍历循环
    for (let i = 0; i < size; i++) {
      const currentVal = data[i].val;

      // Update Pointer
      setPointer({ idx: i, color: COLORS.checking, label: `Is ${currentVal} == ${targetVal}?` });
      setMessage(`正在检查索引 [${i}] : 数值 ${currentVal}`);

      // Highlight Checking
      updateStatus(i, 'checking');
      await sleep(700);

      // Compare
      if (currentVal === targetVal) {
        // FOUND
        updateStatus(i, 'found');
        setPointer({ idx: i, color: COLORS.success, label: 'FOUND!' });
        setMessage(`查找成功！目标 ${targetVal} 在索引 [${i}]`);
        found = true;
        await sleep(200); // 稍微停顿展示成功状态
        break; // 退出循环
      } else {
        // MISMATCH
        updateStatus(i, 'mismatch');
        await sleep(400); // 展示红色错误短暂时间
        updateStatus(i, 'visited'); // 变为暗色表示已检查
      }
    }

    if (!found) {
      setPointer(null);
      setMessage(`查找结束：未找到数值 ${targetVal} (Return -1)`);
    }

    setIsAnimating(false);
  };

  // 辅助：更新单个元素状态
  const updateStatus = (idx, status) => {
    setState(prev => {
      const nextData = [...prev.data];
      if (nextData[idx]) {
        nextData[idx] = { ...nextData[idx], status };
      }
      return { ...prev, data: nextData };
    });
  };

  // --- 渲染部分 ---
  const renderSlots = () => (
    state.data.map((_, i) => (
      <g key={`slot-${i}`} transform={`translate(${START_X + i * (BOX_W + GAP)}, ${START_Y})`}>
        <rect
          width={BOX_W} height={BOX_H} rx={6}
          fill={COLORS.empty}
          stroke={COLORS.boxStroke}
          strokeWidth="1.5"
          strokeDasharray={i >= state.size ? "4 2" : "0"}
        />
        <text x={BOX_W/2} y={BOX_H + 20} textAnchor="middle" fill={COLORS.textSub} fontSize="12">
          {i}
        </text>
      </g>
    ))
  );

  const renderElements = () => (
    state.data.map((item, i) => {
      if (!item) return null;

      let bgColor = COLORS.boxBg;
      let strokeColor = COLORS.boxStroke;
      let textColor = COLORS.text;
      let scale = 1;

      switch (item.status) {
        case 'checking':
          bgColor = '#d2992222'; // 淡橙
          strokeColor = COLORS.checking;
          scale = 1.1;
          break;
        case 'found':
          bgColor = '#2ea04333'; // 淡绿
          strokeColor = COLORS.success;
          textColor = '#fff';
          scale = 1.2;
          break;
        case 'mismatch':
          bgColor = '#da363322'; // 淡红
          strokeColor = COLORS.mismatch;
          break;
        case 'visited':
          textColor = '#484f58'; // 变暗
          strokeColor = '#21262d';
          break;
        default: // normal
          break;
      }

      return (
        <motion.g
          key={item.id}
          animate={{
            scale: scale,
            x: START_X + i * (BOX_W + GAP),
            y: START_Y
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* 元素主体 */}
          <rect
            width={BOX_W} height={BOX_H} rx={6}
            fill={bgColor}
            stroke={strokeColor}
            strokeWidth={item.status === 'normal' || item.status === 'visited' ? 1.5 : 3}
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
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <path d="M0,0 L-6,-8 L6,-8 Z" fill={pointer.color} />
        <line x1="0" y1="-8" x2="0" y2="-30" stroke={pointer.color} strokeWidth="2" />

        {/* 动态标签 */}
        <rect x="-60" y="-50" width="120" height="24" rx="4" fill={pointer.color} />
        <text x="0" y="-34" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
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
          <label style={{ color: COLORS.textSub, fontSize: '11px', marginBottom: '4px' }}>查找目标 (Target)</label>
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
          ↺ 重置
        </button>
      </div>

      {/* 舞台区域 */}
      <div style={{ position: 'relative', height: '280px' }}>
        <svg width="100%" height="100%" viewBox="0 0 650 280">
          <defs>
             {/* 可以在这里添加滤镜效果 */}
          </defs>

          <text x="630" y="30" textAnchor="end" fill={COLORS.textSub} fontSize="12">
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

export default SeqListSearch;