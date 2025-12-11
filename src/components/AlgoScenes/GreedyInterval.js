import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ❌ 已移除 lucide-react 引用，使用原生字符代替

// ================= 样式配置 =================
const COLORS = {
    idle: '#94a3b8',      // 待处理 (灰色)
    current: '#3b82f6',   // 正在扫描 (蓝色)
    selected: '#22c55e',  // 选中 (绿色)
    rejected: '#ef4444',  // 冲突 (红色)
    line: '#eab308'       // 扫描线 (黄色)
};

const SCALE = 30; // 时间轴缩放比例 (1单位 = 30px)

const GreedyInterval = () => {
    // --- 状态管理 ---
    const [intervals, setIntervals] = useState([
        { id: 1, start: 1, end: 4, status: 'idle' },
        { id: 2, start: 3, end: 5, status: 'idle' },
        { id: 3, start: 0, end: 6, status: 'idle' },
        { id: 4, start: 5, end: 7, status: 'idle' },
        { id: 5, start: 3, end: 9, status: 'idle' },
        { id: 6, start: 5, end: 9, status: 'idle' },
        { id: 7, start: 6, end: 10, status: 'idle' },
        { id: 8, start: 8, end: 11, status: 'idle' },
    ]);

    const [inputStart, setInputStart] = useState('');
    const [inputEnd, setInputEnd] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [log, setLog] = useState("准备就绪：请点击“开始演示”或添加自定义区间。");
    const [lastEndTime, setLastEndTime] = useState(0);

    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // --- 核心算法逻辑 ---
    const runAlgorithm = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setLastEndTime(0);

        // 1. 重置状态
        const resetData = intervals.map(i => ({ ...i, status: 'idle' }));
        setIntervals(resetData);
        setLog("第一步：贪心策略要求我们将活动按【结束时间】升序排序...");

        await wait(1000);

        // 2. 排序动画
        const sorted = [...resetData].sort((a, b) => a.end - b.end);
        setIntervals(sorted);
        setLog("排序完成！现在的顺序是按结束时间从早到晚排列的。");

        await wait(1000);

        // 3. 贪心扫描
        let currentLastEnd = 0;
        let count = 0;

        for (let i = 0; i < sorted.length; i++) {
            if (!isMounted.current) return;

            updateStatus(i, 'current', sorted);
            setLog(`正在判断区间 [${sorted[i].start}, ${sorted[i].end}]...`);
            await wait(800);

            if (sorted[i].start >= currentLastEnd) {
                updateStatus(i, 'selected', sorted);
                setLog(`✅ 选中！因为它在 ${currentLastEnd} 之后开始，且结束最早。`);
                currentLastEnd = sorted[i].end;
                setLastEndTime(currentLastEnd);
                count++;
            } else {
                updateStatus(i, 'rejected', sorted);
                setLog(`❌ 冲突！它开始于 ${sorted[i].start}，但上一个活动结束于 ${currentLastEnd}。`);
            }
            await wait(800);
        }

        setLog(`演示结束！共选中 ${count} 个不冲突的活动。`);
        setIsRunning(false);
    };

    // --- 辅助函数 ---
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const updateStatus = (index, status, currentArr) => {
        const newArr = [...currentArr];
        newArr[index].status = status;
        setIntervals(newArr);
    };

    const addInterval = () => {
        const s = parseInt(inputStart);
        const e = parseInt(inputEnd);
        if (isNaN(s) || isNaN(e) || s >= e) {
            alert("请输入有效的开始和结束时间 (开始 < 结束)");
            return;
        }
        const newInterval = {
            id: Date.now(),
            start: s,
            end: e,
            status: 'idle'
        };
        setIntervals([...intervals, newInterval]);
        setInputStart('');
        setInputEnd('');
    };

    const removeInterval = (id) => {
        if (isRunning) return;
        setIntervals(intervals.filter(i => i.id !== id));
    };

    const generateRandom = () => {
        if (isRunning) return;
        const newItems = [];
        for (let i = 0; i < 6; i++) {
            const start = Math.floor(Math.random() * 10);
            const duration = Math.floor(Math.random() * 4) + 1;
            newItems.push({
                id: Date.now() + i,
                start: start,
                end: start + duration,
                status: 'idle'
            });
        }
        setIntervals(newItems);
        setLastEndTime(0);
        setLog("已生成随机数据");
    };

    const reset = () => {
        setIsRunning(false);
        setIntervals(intervals.map(i => ({ ...i, status: 'idle' })));
        setLastEndTime(0);
        setLog("已重置");
    };

    return (
        <div style={{
            background: '#0f172a',
            color: '#fff',
            padding: '20px',
            borderRadius: '12px',
            fontFamily: "'Inter', sans-serif",
            maxWidth: '800px',
            margin: '0 auto',
            border: '1px solid #1e293b'
        }}>
            {/* 标题区 */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>Greedy Activity Selector</h2>
                <p style={{ margin: '5px 0 0', color: '#94a3b8', fontSize: '14px' }}>
                    策略：总是优先选择<span style={{ color: COLORS.selected, fontWeight: 'bold' }}>结束时间最早</span>且不冲突的活动
                </p>
            </div>

            {/* 控制与输入区 */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center', background: '#1e293b', padding: '5px 10px', borderRadius: '6px' }}>
                    <input
                        placeholder="Start"
                        type="number"
                        value={inputStart}
                        onChange={e => setInputStart(e.target.value)}
                        style={inputStyle}
                    />
                    <span style={{ color: '#64748b' }}>-</span>
                    <input
                        placeholder="End"
                        type="number"
                        value={inputEnd}
                        onChange={e => setInputEnd(e.target.value)}
                        style={inputStyle}
                    />
                    {/* 使用纯文本 "+" 代替图标 */}
                    <button onClick={addInterval} style={iconBtnStyle} title="添加">
                        <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
                    </button>
                </div>

                <button onClick={generateRandom} disabled={isRunning} style={btnStyleSecondary}>
                    <span style={{ marginRight: 5 }}>🎲</span> 随机数据
                </button>

                <div style={{ flex: 1 }}></div>

                <button onClick={reset} disabled={isRunning} style={btnStyleSecondary}>
                    <span style={{ marginRight: 5, fontSize: '16px' }}>↺</span> 重置
                </button>
                <button onClick={runAlgorithm} disabled={isRunning} style={btnStylePrimary}>
                    <span style={{ marginRight: 5, fontSize: '12px' }}>▶</span> 开始演示
                </button>
            </div>

            {/* 可视化核心区域 */}
            <div style={{
                position: 'relative',
                height: '400px',
                background: '#020617',
                borderRadius: '8px',
                overflowX: 'auto',
                overflowY: 'auto',
                border: '1px solid #334155',
                padding: '20px'
            }}>
                {/* 时间刻度尺 */}
                <div style={{ position: 'absolute', top: 0, left: 20, height: '100%', width: '1px', background: '#334155', zIndex: 0 }}></div>
                {[...Array(16)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        left: 20 + i * SCALE,
                        top: 0,
                        height: '100%',
                        borderLeft: '1px dashed #1e293b',
                        color: '#475569',
                        fontSize: '12px',
                        paddingTop: '5px'
                    }}>
                        {i}
                    </div>
                ))}

                {/* 扫描线 */}
                <motion.div
                    animate={{ left: 20 + lastEndTime * SCALE }}
                    transition={{ type: "spring", stiffness: 100 }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        background: COLORS.line,
                        zIndex: 10,
                        boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)'
                    }}
                >
                    <div style={{
                        position: 'absolute', top: '-25px', left: '-50px', width: '100px',
                        textAlign: 'center', fontSize: '12px', color: COLORS.line, fontWeight: 'bold'
                    }}>
                        Time: {lastEndTime}
                    </div>
                </motion.div>

                {/* 区间列表 */}
                <div style={{ position: 'relative', zIndex: 1, marginTop: '20px' }}>
                    <AnimatePresence>
                        {intervals.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '10px',
                                    height: '36px'
                                }}
                            >
                                {/* 标签 */}
                                <div style={{ width: '30px', color: '#64748b', fontSize: '12px', textAlign: 'right', marginRight: '10px' }}>
                                    #{index + 1}
                                </div>

                                {/* 条形图 */}
                                <div style={{ position: 'relative', height: '100%', flex: 1 }}>
                                    <motion.div
                                        animate={{ backgroundColor: COLORS[item.status] }}
                                        style={{
                                            position: 'absolute',
                                            left: item.start * SCALE,
                                            width: (item.end - item.start) * SCALE,
                                            height: '24px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            color: item.status === 'idle' ? '#1e293b' : '#fff',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: item.status === 'selected' ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none'
                                        }}
                                    >
                                        [{item.start}, {item.end}]
                                    </motion.div>
                                </div>

                                {/* 删除按钮 (使用 × 字符) */}
                                {!isRunning && (
                                    <button onClick={() => removeInterval(item.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>
                                        ×
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* 日志区 */}
            <div style={{
                marginTop: '20px',
                padding: '15px',
                background: '#1e293b',
                borderRadius: '8px',
                borderLeft: `4px solid ${isRunning ? COLORS.current : COLORS.idle}`,
                fontFamily: 'monospace',
                fontSize: '14px',
                minHeight: '20px'
            }}>
                {log}
            </div>
        </div>
    );
};

// --- Styles ---
const inputStyle = {
    background: 'transparent', border: 'none', color: '#fff', width: '50px', textAlign: 'center', outline: 'none', fontFamily: 'inherit'
};

const iconBtnStyle = {
    background: '#3b82f6', border: 'none', borderRadius: '4px', width: '24px', height: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer'
};

const btnStylePrimary = {
    padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: 'bold', fontFamily: 'inherit'
};

const btnStyleSecondary = {
    padding: '8px 16px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '6px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', fontFamily: 'inherit'
};

export default GreedyInterval;