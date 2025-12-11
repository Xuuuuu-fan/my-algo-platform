import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 1. 主题与配置 ==================
const THEME = {
    bg: '#0d1117',
    panel: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    nodeDefault: '#1f6feb',
    nodeCurrent: '#d29922', // 橙色
    nodeFound: '#2ea043',   // 绿色
    nodeNotFound: '#da3633', // 红色
    inputBg: '#010409',
    codeBg: '#161b22',
    codeHighlight: 'rgba(56, 139, 253, 0.2)',
    accent: '#58a6ff'
};

// ================== 2. 算法逻辑 ==================
const generateSequentialSearchSteps = (array, key) => {
    const steps = [];
    if (array.length === 0) {
        steps.push({ currentIndex: -1, foundIndex: -1, isFinished: true, description: "数组为空，查找结束。", highlightedCodeBlock: 'end' });
        return { steps };
    }
    steps.push({ currentIndex: -1, foundIndex: -1, isFinished: false, description: "初始化：准备从索引 0 开始查找...", highlightedCodeBlock: 'start' });
    for (let i = 0; i < array.length; i++) {
        steps.push({ currentIndex: i, foundIndex: -1, isFinished: false, description: `比较：检查索引 ${i} 的值 (${array[i]}) 是否等于 ${key}？`, highlightedCodeBlock: 'compare' });
        if (array[i] === key) {
            steps.push({ currentIndex: i, foundIndex: i, isFinished: true, description: `成功：在索引 ${i} 处找到目标值 ${key}！`, highlightedCodeBlock: 'found' });
            return { steps };
        }
    }
    steps.push({ currentIndex: array.length - 1, foundIndex: -1, isFinished: true, description: `结束：遍历完成，未找到目标值 ${key}。`, highlightedCodeBlock: 'notFound' });
    return { steps };
};

// ================== 3. 子组件 ==================

// 代码面板
const CodePanel = ({ highlightedBlock }) => {
    const codeBlocks = {
        start: `function sequentialSearch(array, key) {
  // 从索引 0 开始遍历
  for (let i = 0; i < array.length; i++) {`,
        compare: `    // 比较当前元素与 key
    if (array[i] === key) {`,
        found: `      // 找到，返回索引
      return i;
    }`,
        notFound: `  }
  // 遍历结束仍未找到
  return -1;
}`,
        end: `}`
    };
    return (
        <div style={{ background: THEME.codeBg, borderRadius: 8, padding: '20px', border: `1px solid ${THEME.border}`, fontFamily: 'monospace', fontSize: 13, color: THEME.textSecondary, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ marginTop: 0, marginBottom: 15, color: THEME.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 16, background: THEME.accent, display: 'block', borderRadius: 2 }}></span>
                算法逻辑
            </h4>
            <div style={{ flex: 1 }}>
                {Object.entries(codeBlocks).map(([key, code]) => (
                    <motion.div key={key} animate={{ backgroundColor: highlightedBlock === key ? THEME.codeHighlight : 'transparent', borderLeft: highlightedBlock === key ? `3px solid ${THEME.nodeCurrent}` : '3px solid transparent' }} style={{ margin: 0, padding: '4px 10px', borderRadius: 4, transition: 'background-color 0.2s', whiteSpace: 'pre-wrap' }}>
                        {code}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

// 箭头图标 SVG
const ArrowIcon = ({ color }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22L12 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 15L12 22L5 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

// ================== 4. 主组件 ==================
const SequentialSearchVisualizer = () => {
    const [arrayInput, setArrayInput] = useState('12, 45, 78, 23, 56, 89, 34, 91, 8');
    const [keyInput, setKeyInput] = useState('34');
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [speed, setSpeed] = useState(1.0);

    const array = useMemo(() => arrayInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)), [arrayInput]);
    const searchKey = useMemo(() => parseInt(keyInput.trim(), 10), [keyInput]);
    const currentStep = steps[currentStepIndex] || { currentIndex: -1, foundIndex: -1, isFinished: false, description: "准备就绪，请点击开始。", highlightedCodeBlock: null };

    // 自动滚动到底部 (如果代码很长)
    // 略，简单代码无需

    useEffect(() => {
        let timer;
        if (isAnimating && currentStepIndex < steps.length - 1) {
            timer = setTimeout(() => { setCurrentStepIndex(i => i + 1); }, (2.2 - speed) * 800);
        } else {
            setIsAnimating(false);
        }
        return () => clearTimeout(timer);
    }, [isAnimating, currentStepIndex, steps, speed]);

    const handleStart = () => {
        if (isNaN(searchKey)) { alert("请输入有效的查找数字！"); return; }
        const { steps: generatedSteps } = generateSequentialSearchSteps(array, searchKey);
        setSteps(generatedSteps); setCurrentStepIndex(0); setIsAnimating(true);
    };

    const handleRandomize = () => {
        const len = Math.floor(Math.random() * 6) + 5; // 5-10个元素
        const newArr = Array.from({ length: len }, () => Math.floor(Math.random() * 100));
        setArrayInput(newArr.join(', '));
        // 50% 概率选一个存在的数，50% 随机数
        const key = Math.random() > 0.5 ? newArr[Math.floor(Math.random() * len)] : Math.floor(Math.random() * 100);
        setKeyInput(key.toString());
        // 重置状态
        setSteps([]); setCurrentStepIndex(0); setIsAnimating(false);
    }

    const handlePauseResume = () => {
        if (steps.length === 0) { handleStart(); return; }
        setIsAnimating(prev => !prev);
    }

    const handleReset = () => {
        setIsAnimating(false); setSteps([]); setCurrentStepIndex(0);
    };

    const handleStepChange = (delta) => {
        setIsAnimating(false);
        setCurrentStepIndex(i => Math.max(0, Math.min(steps.length - 1, i + delta)));
    }

    const getNodeColor = (index) => {
        if (currentStep.isFinished) {
            if (currentStep.foundIndex === index) return THEME.nodeFound;
            if (currentStep.foundIndex === -1) return THEME.nodeNotFound; // 结束都没找到时，通常不高亮特定节点，或者可以全红
        }
        if (currentStep.currentIndex === index) return THEME.nodeCurrent;
        return THEME.nodeDefault;
    };

    return (
        <div style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', gap: 15, background: THEME.bg, borderRadius: 12, padding: '24px', height: '85vh', boxSizing: 'border-box', color: THEME.text }}>

            {/* 1. 顶部全局控制栏 */}
            <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 15, borderBottom: `1px solid ${THEME.border}`, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ marginRight: 'auto' }}>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>顺序查找演示</div>
                    <div style={{ fontSize: 12, color: THEME.textSecondary }}>{currentStep.description}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: 10, background: THEME.panel, padding: '4px 8px', borderRadius: 6, border: `1px solid ${THEME.border}` }}>
                        <span style={{ fontSize: 12, color: THEME.textSecondary, marginRight: 8 }}>速度</span>
                        <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={e => setSpeed(e.target.value)} style={{ width: 60, cursor: 'pointer' }} />
                    </div>
                    <button onClick={() => handleStepChange(-1)} disabled={steps.length === 0 || currentStepIndex === 0} style={btnStyle}>上一步</button>
                    <button onClick={() => handleStepChange(1)} disabled={steps.length === 0 || currentStepIndex === steps.length - 1} style={btnStyle}>下一步</button>
                    <button onClick={handlePauseResume} style={{ ...btnStyle, background: THEME.nodeFound, border: 'none', color: '#0d1117', fontWeight: 'bold', minWidth: 60 }}>
                        {steps.length > 0 && !currentStep.isFinished ? (isAnimating ? '暂停' : '继续') : '开始'}
                    </button>
                    <button onClick={handleReset} style={{ ...btnStyle, background: '#da3633', border: 'none', color: '#fff' }}>重置</button>
                </div>
            </div>

            {/* 2. 主体区域 */}
            <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden', flexWrap: 'wrap' }}>

                {/* 左侧：可视化区域 */}
                <div style={{ flex: '2 1 400px', background: THEME.panel, borderRadius: 12, padding: '20px', border: `1px solid ${THEME.border}`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {/* 输入区 */}
                    <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottom: `1px dashed ${THEME.border}` }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>数组</label>
                            <input type="text" value={arrayInput} onChange={e => setArrayInput(e.target.value)} disabled={steps.length > 0} style={{ ...inputStyle, flex: 1 }} />
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>查找</label>
                            <input type="text" value={keyInput} onChange={e => setKeyInput(e.target.value)} disabled={steps.length > 0} style={{ ...inputStyle, width: 50, textAlign: 'center' }} />
                        </div>
                        <button onClick={handleRandomize} disabled={steps.length > 0} style={{ ...btnStyle, fontSize: 11, marginLeft: 'auto' }}>🎲 随机数据</button>
                    </div>

                    {/* 动画区 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflowX: 'auto', overflowY: 'hidden' }}>

                        {/* 数组容器 */}
                        <div style={{ position: 'relative', padding: '60px 20px 20px', minWidth: 'min-content' }}> {/* padding top 给指针留空间 */}

                            {/* 移动的指针 */}
                            <AnimatePresence>
                                {currentStep.currentIndex !== -1 && !currentStep.isFinished && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0, x: currentStep.currentIndex * 70 + 20 }} // 70 = node width(50) + gap(10) + border(2*2) approx adjustment
                                        exit={{ opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        style={{ position: 'absolute', top: 0, left: 0, width: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <div style={{ fontSize: 11, color: THEME.nodeCurrent, fontWeight: 'bold', marginBottom: 2, whiteSpace: 'nowrap' }}>当前索引 {currentStep.currentIndex}</div>
                                        <ArrowIcon color={THEME.nodeCurrent} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* 元素列表 */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                {array.map((value, index) => {
                                    const stateColor = getNodeColor(index);
                                    const isTarget = currentStep.currentIndex === index || currentStep.foundIndex === index;
                                    return (
                                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <motion.div
                                                animate={{
                                                    backgroundColor: isTarget ? stateColor : 'transparent',
                                                    borderColor: stateColor,
                                                    scale: isTarget ? 1.1 : 1,
                                                    y: isTarget ? 5 : 0
                                                }}
                                                style={{
                                                    width: 50, height: 50, borderRadius: 10,
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                    color: isTarget ? '#fff' : THEME.text,
                                                    fontSize: 16, fontWeight: 'bold',
                                                    border: `2px solid ${THEME.nodeDefault}`,
                                                    boxShadow: isTarget ? `0 4px 12px ${stateColor}66` : 'none'
                                                }}
                                            >
                                                {value}
                                            </motion.div>
                                            <div style={{ marginTop: 8, fontSize: 11, color: THEME.textSecondary, fontFamily: 'monospace' }}>{index}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {array.length === 0 && <div style={{ color: THEME.textSecondary, fontStyle: 'italic' }}>数据为空，请生成或输入数据</div>}
                    </div>
                </div>

                {/* 右侧：代码面板 */}
                <div style={{ flex: '1 1 300px', minWidth: 300 }}>
                    <CodePanel highlightedBlock={currentStep.highlightedCodeBlock} />
                </div>
            </div>
        </div>
    );
};

// ================== 5. 样式对象 ==================
const btnStyle = {
    background: 'transparent',
    color: THEME.text,
    border: `1px solid ${THEME.border}`,
    padding: '6px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: '500',
    transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const inputStyle = {
    background: THEME.inputBg,
    border: `1px solid ${THEME.border}`,
    color: THEME.text,
    padding: '6px 10px',
    borderRadius: 6,
    outline: 'none',
    fontSize: 13,
    fontFamily: 'monospace'
};
const labelStyle = { fontSize: 12, color: THEME.textSecondary, marginRight: 8, fontWeight: '500' };
const inputGroupStyle = { display: 'flex', alignItems: 'center', flex: 1 };

export default SequentialSearchVisualizer;