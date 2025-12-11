import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 配置常量 ---
const CONFIG = {
  BOX_SIZE: 50,
  GAP: 12,
  CAPACITY: 8,
  SPEED: 500, // 动画基础延迟(ms)
};

// --- 颜色主题 (GitHub Dark Style) ---
const THEME = {
  bg: '#0d1117',        // 外框背景
  panel: '#161b22',     // 控制栏背景
  border: '#30363d',    // 边框
  text: '#c9d1d9',      // 主文字
  textSub: '#8b949e',   // 辅助文字

  // 状态色
  idle: '#21262d',      // 普通盒子
  focus: '#1f6feb',     // 选中/指针 (蓝)
  success: '#2ea043',   // 成功/新增 (绿)
  warning: '#d29922',   // 移动中 (橙)
  danger: '#da3633',    // 删除/错误 (红)
  visited: '#484f58',   // 查过/排除 (灰)
};

const ArrayCRUD = () => {
  // --- 初始数据 ---
  const initList = () => [10, 20, 30, 40, 50].map((val, i) => ({
    id: `node-${Date.now()}-${i}`,
    val,
    status: 'idle' // idle | focus | success | warning | danger | visited
  }));

  // --- State ---
  const [list, setList] = useState(initList());
  const [size, setSize] = useState(5); // 逻辑长度
  const [mode, setMode] = useState('INSERT'); // 当前模式: INSERT | DELETE | UPDATE | SEARCH
  const [inputs, setInputs] = useState({ index: 2, value: 99 });
  const [pointers, setPointers] = useState([]); // 指针数组 { idx, label, color }
  const [msg, setMsg] = useState("请选择操作模式");
  const [isRunning, setIsRunning] = useState(false);

  // 辅助：睡眠
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // 切换模式时重置某些状态
  useEffect(() => {
    setPointers([]);
    setMsg(`已切换到: ${getModeName(mode)}`);
    setList(prev => prev.map(item => ({ ...item, status: 'idle' })));
  }, [mode]);

  const getModeName = (m) => {
    switch(m) {
      case 'INSERT': return '插入 (Insert)';
      case 'DELETE': return '删除 (Delete)';
      case 'UPDATE': return '修改 (Update)';
      case 'SEARCH': return '查找 (Search)';
      default: return '';
    }
  };

  // --- 核心操作逻辑 ---

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setPointers([]);
    setMsg("开始执行...");

    // 重置所有状态颜色
    setList(prev => prev.map(item => ({ ...item, status: 'idle' })));
    await sleep(300);

    try {
      switch (mode) {
        case 'INSERT': await runInsert(); break;
        case 'DELETE': await runDelete(); break;
        case 'UPDATE': await runUpdate(); break;
        case 'SEARCH': await runSearch(); break;
        default: break;
      }
    } catch (e) {
      setMsg(`错误: ${e.message}`);
    }

    setIsRunning(false);
  };

  // 1. 插入 (Insert) - O(n)
  const runInsert = async () => {
    const { index, value } = inputs;

    if (size >= CONFIG.CAPACITY) throw new Error("数组已满 (Overflow)");
    if (index < 0 || index > size) throw new Error("索引越界");

    setMsg(`准备在 Index [${index}] 插入 ${value}`);
    setPointers([{ idx: index, label: 'Target', color: THEME.focus }]);
    await sleep(CONFIG.SPEED);

    // 搬运循环
    let tempList = [...list];
    for (let j = size - 1; j >= index; j--) {
      setMsg(`元素后移: List[${j}] -> List[${j+1}]`);
      setPointers([
        { idx: index, label: 'Target', color: THEME.focus },
        { idx: j, label: 'j', color: THEME.warning }
      ]);

      // 视觉变色
      setList(prev => prev.map((item, i) => i === j ? { ...item, status: 'warning' } : item));
      await sleep(CONFIG.SPEED);

      // 逻辑移动
      // 关键：为了动画，新位置的数据如果不为空，要继承旧位置的ID；如果是空的，生成新ID
      // 这里简化：直接克隆对象，React Key 会处理位移
      tempList[j+1] = { ...tempList[j] };
      // 原位置暂留（或置空），这里保留副本视觉上更像复制
      setList([...tempList]);
      await sleep(CONFIG.SPEED);
    }

    // 插入
    setMsg(`插入新值 ${value}`);
    tempList[index] = { id: `new-${Date.now()}`, val: value, status: 'success' };
    setList([...tempList]);
    setSize(s => s + 1);
    setPointers([{ idx: index, label: 'Done', color: THEME.success }]);
    await sleep(CONFIG.SPEED);
    setMsg("插入完成");
  };

  // 2. 删除 (Delete) - O(n)
  const runDelete = async () => {
    const { index } = inputs;

    if (size === 0) throw new Error("数组为空");
    if (index < 0 || index >= size) throw new Error("索引越界");

    setMsg(`定位要删除的元素 Index [${index}]`);
    setPointers([{ idx: index, label: 'Delete', color: THEME.danger }]);
    setList(prev => prev.map((item, i) => i === index ? { ...item, status: 'danger' } : item));
    await sleep(CONFIG.SPEED * 1.5);

    setMsg("销毁元素...");
    setList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], val: '', status: 'idle', isHidden: true }; // 标记隐藏
      return copy;
    });
    await sleep(CONFIG.SPEED);

    // 搬运
    let tempList = [...list];
    // 注意：因为刚刚我们在 visual state 中把 index 隐藏了，但在逻辑 tempList 中我们需要正确处理数据
    // 重新同步 tempList 和当前的 visual list (忽略 isHidden 标记，单纯看数据流)

    for (let j = index + 1; j < size; j++) {
      setMsg(`元素前移: List[${j}] -> List[${j-1}]`);
      setPointers([
        { idx: j, label: 'j', color: THEME.warning },
        { idx: j-1, label: 'Target', color: THEME.focus }
      ]);

      // 视觉高亮
      setList(prev => prev.map((item, i) => i === j ? { ...item, status: 'warning' } : item));
      await sleep(CONFIG.SPEED);

      // 移动：将 j 的内容覆盖 j-1
      // 这里我们需要确保 key 跟着移动
      tempList[j-1] = tempList[j];
      tempList[j] = { ...tempList[j], id: `temp-${j}`, val: 0, status: 'idle', isHidden: true }; // 腾出的位置

      // 同步到视图，注意过滤掉刚刚被逻辑删除的 index 的视觉残留
      setList([...tempList]);
      await sleep(CONFIG.SPEED);
    }

    setSize(s => s - 1);
    setMsg("删除完成，长度 -1");
    // 清理最后的残余显示
    setList(prev => prev.slice(0, size-1).map(item => ({...item, status: 'idle', isHidden: false})).concat(new Array(CONFIG.CAPACITY - (size-1)).fill(null)));
  };

  // 3. 修改 (Update) - O(1)
  const runUpdate = async () => {
    const { index, value } = inputs;
    if (index < 0 || index >= size) throw new Error("索引越界");

    setMsg(`随机访问 Index [${index}] ...`);
    setPointers([{ idx: index, label: 'Access', color: THEME.focus }]);
    // 高亮
    setList(prev => prev.map((item, i) => i === index ? { ...item, status: 'focus' } : item));
    await sleep(CONFIG.SPEED * 1.5);

    setMsg(`写入新值: ${value}`);
    setList(prev => prev.map((item, i) => i === index ? { ...item, val: value, status: 'success' } : item));
    await sleep(CONFIG.SPEED);

    setMsg("修改完成 (O(1) 操作)");
  };

  // 4. 查找 (Search) - O(n)
  const runSearch = async () => {
    const { value } = inputs;
    setMsg(`开始线性查找值: ${value}`);

    let found = false;
    for (let i = 0; i < size; i++) {
      setMsg(`比较: List[${i}] (${list[i].val}) vs ${value}`);
      setPointers([{ idx: i, label: 'i', color: THEME.focus }]);

      // 正在检查
      setList(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'focus' } : item));
      await sleep(CONFIG.SPEED);

      if (list[i].val == value) {
        found = true;
        setMsg(`找到目标！在索引 [${i}]`);
        setList(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success' } : item));
        setPointers([{ idx: i, label: 'Found', color: THEME.success }]);
        break;
      } else {
        // 排除
        setList(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'visited' } : item));
      }
      await sleep(200);
    }

    if (!found) {
      setMsg("遍历结束，未找到目标值");
    }
  };

  // --- 渲染部分 ---

  // 获取盒子样式
  const getBoxStyle = (status) => {
    switch (status) {
      case 'focus': return { bg: '#1f6feb22', border: THEME.focus, scale: 1.1 };
      case 'success': return { bg: '#2ea04333', border: THEME.success, scale: 1.15 };
      case 'warning': return { bg: '#d2992222', border: THEME.warning, scale: 1.05 };
      case 'danger': return { bg: '#da363322', border: THEME.danger, scale: 0.9 };
      case 'visited': return { bg: '#161b22', border: '#21262d', text: '#484f58', scale: 1 };
      default: return { bg: THEME.panel, border: THEME.border, scale: 1 };
    }
  };

  return (
    <div style={{
      background: THEME.bg, padding: 20, borderRadius: 12,
      color: THEME.text, fontFamily: 'sans-serif', maxWidth: 700, margin: '0 auto',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    }}>
      {/* 1. 顶部 Tab 栏 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: `1px solid ${THEME.border}`, paddingBottom: 10 }}>
        {['INSERT', 'DELETE', 'UPDATE', 'SEARCH'].map(m => (
          <button
            key={m}
            onClick={() => !isRunning && setMode(m)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer',
              background: mode === m ? THEME.focus : 'transparent',
              color: mode === m ? '#fff' : THEME.textSub,
              fontWeight: 'bold', transition: 'all 0.2s'
            }}
          >
            {getModeName(m).split(' ')[0]}
          </button>
        ))}
      </div>

      {/* 2. 控制面板 */}
      <div style={{
        display: 'flex', gap: 15, alignItems: 'center', background: THEME.panel,
        padding: 15, borderRadius: 8, marginBottom: 30, height: 50
      }}>
        {/* 根据模式显示不同的输入框 */}
        {(mode === 'INSERT' || mode === 'UPDATE' || mode === 'DELETE') && (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label style={{fontSize: 10, color: THEME.textSub}}>索引 (Index)</label>
            <input
              type="number" value={inputs.index}
              onChange={e => setInputs({...inputs, index: +e.target.value})}
              style={inputStyle}
            />
          </div>
        )}

        {(mode === 'INSERT' || mode === 'UPDATE' || mode === 'SEARCH') && (
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label style={{fontSize: 10, color: THEME.textSub}}>数值 (Value)</label>
            <input
              type="number" value={inputs.value}
              onChange={e => setInputs({...inputs, value: +e.target.value})}
              style={inputStyle}
            />
          </div>
        )}

        <button
          onClick={handleRun} disabled={isRunning}
          style={{
            marginLeft: 'auto', padding: '0 24px', height: 36, borderRadius: 6,
            background: isRunning ? THEME.border : THEME.success, color: '#fff',
            border: 'none', cursor: isRunning ? 'wait' : 'pointer', fontWeight: 'bold'
          }}
        >
          {isRunning ? '运行中...' : '执 行'}
        </button>
      </div>

      {/* 3. 可视化舞台 */}
      <div style={{ position: 'relative', height: 180, border: `1px solid ${THEME.border}`, borderRadius: 8, marginBottom: 15 }}>
        <div style={{
          position: 'absolute', top: 20, right: 20,
          fontSize: 12, color: THEME.textSub
        }}>
          Size: {size} / {CONFIG.CAPACITY}
        </div>

        <svg width="100%" height="100%" viewBox={`0 0 ${700} 180`}>
          <g transform={`translate(50, 80)`}>
            {/* 3.1 渲染底座 (Slots) */}
            {Array.from({ length: CONFIG.CAPACITY }).map((_, i) => (
              <g key={i} transform={`translate(${i * (CONFIG.BOX_SIZE + CONFIG.GAP)}, 0)`}>
                <rect
                  width={CONFIG.BOX_SIZE} height={CONFIG.BOX_SIZE} rx={6}
                  fill="none" stroke={THEME.border} strokeWidth={1} strokeDasharray="4 2"
                />
                <text x={25} y={CONFIG.BOX_SIZE + 20} textAnchor="middle" fill={THEME.textSub} fontSize={12}>{i}</text>
              </g>
            ))}

            {/* 3.2 渲染数据元素 (AnimatePresence) */}
            <AnimatePresence>
              {list.map((item, i) => {
                if (!item || item.isHidden || i >= CONFIG.CAPACITY) return null; // 过滤
                const style = getBoxStyle(item.status);

                return (
                  <motion.g
                    key={item.id} // Key 绑定 ID，这是动画连贯的关键
                    layout // 开启布局动画
                    initial={{ opacity: 0, y: -30 }}
                    animate={{
                      opacity: 1,
                      x: i * (CONFIG.BOX_SIZE + CONFIG.GAP),
                      y: 0,
                      scale: style.scale
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <rect
                      width={CONFIG.BOX_SIZE} height={CONFIG.BOX_SIZE} rx={6}
                      fill={style.bg} stroke={style.border} strokeWidth={2}
                    />
                    <text
                      x={25} y={32} textAnchor="middle"
                      fill={style.text || THEME.text} fontWeight="bold" fontSize={16}
                    >
                      {item.val}
                    </text>
                  </motion.g>
                );
              })}
            </AnimatePresence>

            {/* 3.3 渲染指针 */}
            {pointers.map((p, i) => (
              <motion.g
                key={i}
                animate={{ x: p.idx * (CONFIG.BOX_SIZE + CONFIG.GAP) + 25 }}
                transition={{ duration: 0.3 }}
              >
                <path d="M0,-10 L-5,-18 L5,-18 Z" fill={p.color} />
                <rect x="-20" y="-40" width="40" height="20" rx="4" fill={p.color} />
                <text x="0" y="-26" textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">{p.label}</text>
              </motion.g>
            ))}
          </g>
        </svg>
      </div>

      {/* 4. 日志栏 */}
      <div style={{
        fontFamily: 'monospace', fontSize: 13, color: THEME.focus,
        background: '#00000033', padding: '8px 12px', borderRadius: 4
      }}>
        &gt; {msg}
      </div>
    </div>
  );
};

// 简单的输入框样式
const inputStyle = {
  background: '#0d1117', border: '1px solid #30363d', color: '#fff',
  padding: '4px 8px', borderRadius: 4, width: 70
};

export default ArrayCRUD;