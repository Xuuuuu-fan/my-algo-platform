import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 样式常量 ---
const BOX_W = 50;
const BOX_H = 50;
const GAP = 10;
const START_X = 50;
const START_Y = 150;

// 颜色定义 (保持一致，新增 danger)
const COLORS = {
  bg: '#010409',
  boxBg: '#161b22',
  boxStroke: '#30363d',
  text: '#c9d1d9',
  textSub: '#8b949e',
  primary: '#1f6feb',
  success: '#2ea043',
  warning: '#d29922',   // 移动中
  danger: '#da3633',    // 删除/目标
  empty: '#0d1117'
};

const SeqListDeletion = ({ defaultCapacity = 8 }) => {
  // --- 初始化数据 ---
  const initData = () => {
    const arr = new Array(defaultCapacity).fill(null);
    // 初始化填满前5个数据
    [10, 20, 30, 40, 50].forEach((v, i) => arr[i] = { id: `init-${i}`, val: v, status: 'normal' });
    return arr;
  };

  // --- 状态管理 ---
  const [list, setList] = useState(initData);
  const [size, setSize] = useState(5);
  const [pointers, setPointers] = useState([]);
  const [message, setMessage] = useState("准备就绪");
  const [isAnimating, setIsAnimating] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(2); // 默认删除索引2

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // --- 重置功能 ---
  const handleReset = () => {
    setList(initData());
    setSize(5);
    setPointers([]);
    setMessage("数据已重置");
    setDeleteIdx(2);
  };

  // --- 核心删除逻辑 ---
  const handleDelete = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setPointers([]);

    // 1. 验证
    if (size === 0) {
      setMessage("错误：顺序表为空 (Underflow)");
      setIsAnimating(false);
      return;
    }
    if (deleteIdx < 0 || deleteIdx >= size) {
      setMessage(`错误：索引 ${deleteIdx} 不存在`);
      setIsAnimating(false);
      return;
    }

    // 2. 锁定目标
    setMessage(`定位索引 [${deleteIdx}] 的元素...`);
    setPointers([{ idx: deleteIdx, label: 'Target', color: COLORS.danger }]);

    // 高亮为红色
    setList(prev => prev.map((item, i) =>
      i === deleteIdx ? { ...item, status: 'target' } : item
    ));
    await sleep(800);

    // 3. 销毁元素 (制造空洞)
    setMessage(`删除元素 ${list[deleteIdx].val}`);
    setList(prev => {
      const next = [...prev];
      // 我们不立即把数组变短，而是先把这个位置变成“空”，保留对象结构以便后续动画
      next[deleteIdx] = { ...next[deleteIdx], val: '', status: 'empty-slot' };
      return next;
    });
    await sleep(800);

    // 4. 前移填补 (Shift Loop)
    // 逻辑：从 deleteIdx + 1 开始，将元素移动到 i - 1
    if (deleteIdx === size - 1) {
      setMessage("删除末尾元素，无需移动");
    } else {
      setMessage("开始前移元素填补空缺...");

      // 创建临时操作数组
      let currentList = [...list];

      for (let j = deleteIdx + 1; j < size; j++) {
        setPointers([
          { idx: j, label: 'j', color: COLORS.warning },
          { idx: j - 1, label: 'j-1', color: COLORS.success } // 目标位
        ]);
        setMessage(`将 list[${j}] 向前移至 list[${j-1}]`);

        // 视觉：源变色
        setList(prev => {
          const next = [...prev];
          if(next[j]) next[j] = { ...next[j], status: 'moving' };
          return next;
        });
        await sleep(600);

        // 逻辑：移动
        // 关键点：将 j 的对象 移动到 j-1，这样 Key 随之移动，Framer Motion 会产生滑动效果
        currentList[j - 1] = currentList[j];
        currentList[j] = null; // 原位置暂时置空 (或者设为占位符)

        setList([...currentList]);
        await sleep(600);
      }
    }

    // 5. 完成更新
    setMessage("更新顺序表长度 (Size--)");
    setSize(s => s - 1);
    setPointers([]);

    // 清理所有状态颜色
    setList(prev => {
      // 注意：此时 prev[size-1] 已经是空的或者是移动后留下的副本，我们需要确保 visuals 正确
      // 这里直接重新整理一遍数据，确保最后的空位是真正的 null
      const next = new Array(defaultCapacity).fill(null);
      for(let i=0; i < size - 1; i++) {
        if (prev[i]) next[i] = { ...prev[i], status: 'normal' };
      }
      return next;
    });

    setIsAnimating(false);
  };

  // --- 渲染辅助 ---
  const renderSlots = () => (
    list.map((_, i) => (
      <g key={`slot-${i}`} transform={`translate(${START_X + i * (BOX_W + GAP)}, ${START_Y})`}>
        <rect
          width={BOX_W} height={BOX_H} rx={6}
          fill={COLORS.empty}
          stroke={COLORS.boxStroke}
          strokeWidth="1.5"
          strokeDasharray={i >= size ? "4 2" : "0"}
        />
        <text x={BOX_W/2} y={BOX_H + 20} textAnchor="middle" fill={COLORS.textSub} fontSize="12">
          {i}
        </text>
      </g>
    ))
  );

  const renderElements = () => (
    list.map((item, i) => {
      // 这里的逻辑有点不同：如果 item 存在但 status 是 empty-slot (刚被删掉还没被覆盖)，我们不渲染实体
      if (!item || item.status === 'empty-slot') return null;

      let bgColor = COLORS.boxBg;
      let strokeColor = COLORS.boxStroke;
      let textColor = COLORS.text;

      if (item.status === 'target') {
        bgColor = '#da363322'; // 淡红
        strokeColor = COLORS.danger;
      } else if (item.status === 'moving') {
        bgColor = '#d2992222'; // 淡橙
        strokeColor = COLORS.warning;
      }

      return (
        <motion.g
          key={item.id} // 核心：Key 跟随数据对象移动
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, x: START_X + i * (BOX_W + GAP), y: START_Y }}
          exit={{ opacity: 0, scale: 0 }}
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

  const renderPointers = () => (
    pointers.map((p) => {
      // 计算 x 坐标
      const xPos = START_X + p.idx * (BOX_W + GAP) + BOX_W/2;
      return (
        <motion.g
          key={`ptr-${p.label}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, x: xPos, y: START_Y - 10 }}
          transition={{ duration: 0.3 }}
        >
          <path d="M0,0 L-5,-8 L5,-8 Z" fill={p.color} />
          <line x1="0" y1="-8" x2="0" y2="-25" stroke={p.color} strokeWidth="2" />
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
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* 顶部控制栏 */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${COLORS.boxStroke}`, display: 'flex', gap: '12px', alignItems: 'end' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ color: COLORS.textSub, fontSize: '11px', marginBottom: '4px' }}>删除索引 (Index)</label>
          <input
            type="number" value={deleteIdx} onChange={e => setDeleteIdx(+e.target.value)}
            style={{
              background: '#0d1117', border: `1px solid ${COLORS.boxStroke}`,
              color: COLORS.text, padding: '6px 8px', borderRadius: '4px', width: '80px'
            }}
          />
        </div>

        <button
          onClick={handleDelete} disabled={isAnimating}
          style={{
            height: '34px', padding: '0 16px',
            background: isAnimating ? COLORS.boxStroke : COLORS.danger,
            color: '#fff', border: 'none', borderRadius: '4px', cursor: isAnimating ? 'default' : 'pointer',
            fontWeight: 'bold', fontSize: '13px'
          }}
        >
          {isAnimating ? '删除中...' : '执行删除 (Delete)'}
        </button>

        <button
          onClick={handleReset} disabled={isAnimating}
          style={{
            height: '34px', padding: '0 12px', marginLeft: 'auto',
            background: 'transparent', border: `1px solid ${COLORS.boxStroke}`,
            color: COLORS.textSub, borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
          }}
        >
          ↺ 重置数据
        </button>
      </div>

      {/* 舞台区域 */}
      <div style={{ position: 'relative', height: '280px' }}>
        <svg width="100%" height="100%" viewBox="0 0 600 280">
          <text x="550" y="30" textAnchor="end" fill={COLORS.textSub} fontSize="12">
            Size: {size} / {defaultCapacity}
          </text>

          {renderSlots()}
          <AnimatePresence>
            {renderElements()}
            {renderPointers()}
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

export default SeqListDeletion;