import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 1. 主题与配置 ==================
// ... (这部分保持不变)
const THEME = {
    bg: '#0d1117',
    panel: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    nodeDefault: '#1f6feb',       // 默认蓝色
    nodeInRange: '#58a6ff',      // 范围内浅蓝色
    nodeMid: '#d29922',          // Mid指针橙色
    nodeFound: '#2ea043',         // 找到绿色
    nodeEliminated: '#30363d',    // 范围外灰色
    inputBg: '#010409',
    codeBg: '#161b22',
    codeHighlight: 'rgba(56, 139, 253, 0.2)',
    accent: '#58a6ff'
};

// ================== 2. 算法逻辑 ==================
// ... (这部分保持不变, 仍然使用JS驱动可视化)
const generateBinarySearchSteps = (sortedArray, key) => {
    const steps = [];
    const array = [...sortedArray];

    if (array.length === 0) {
        steps.push({ left: -1, right: -1, mid: -1, foundIndex: -1, isFinished: true, description: "数组为空，查找结束。", highlightedCodeBlock: 'end' });
        return { steps };
    }

    let left = 0;
    let right = array.length - 1;

    steps.push({ left, right, mid: -1, foundIndex: -1, isFinished: false, description: `初始化：设置 left=0, right=${right}。`, highlightedCodeBlock: 'init' });

    while (left <= right) {
        let mid = Math.floor(left + (right - left) / 2);
        steps.push({ left, right, mid, foundIndex: -1, isFinished: false, description: `计算中间索引 mid = ${mid}。`, highlightedCodeBlock: 'calc_mid' });

        steps.push({ left, right, mid, foundIndex: -1, isFinished: false, description: `比较：检查索引 ${mid} 的值 (${array[mid]}) 是否等于 ${key}？`, highlightedCodeBlock: 'compare' });

        if (array[mid] === key) {
            steps.push({ left, right, mid, foundIndex: mid, isFinished: true, description: `成功：在索引 ${mid} 处找到目标值 ${key}！`, highlightedCodeBlock: 'found' });
            return { steps };
        }

        if (array[mid] < key) {
            steps.push({ left, right, mid, foundIndex: -1, isFinished: false, description: `因为 ${array[mid]} < ${key}，所以目标值在右侧。更新 left = mid + 1。`, highlightedCodeBlock: 'go_right' });
            left = mid + 1;
        } else {
            steps.push({ left, right, mid, foundIndex: -1, isFinished: false, description: `因为 ${array[mid]} > ${key}，所以目标值在左侧。更新 right = mid - 1。`, highlightedCodeBlock: 'go_left' });
            right = mid - 1;
        }
        steps.push({ left, right, mid: -1, foundIndex: -1, isFinished: false, description: `更新查找范围：left=${left}, right=${right}。`, highlightedCodeBlock: 'init' });
    }

    steps.push({ left, right, mid: -1, foundIndex: -1, isFinished: true, description: `结束：left > right，查找范围为空，未找到目标值 ${key}。`, highlightedCodeBlock: 'not_found' });
    return { steps };
};


// ================== 3. 子组件 ==================

// 代码面板 (已修改为C代码)
const CodePanel = ({ highlightedBlock }) => {
    const codeBlocks = {
        init: `int binarySearch(int arr[], int size, int key) {
    int left = 0;
    int right = size - 1;`,
        calc_mid: `
    while (left <= right) {
        int mid = left + (right - left) / 2;`,
        compare: `
        if (arr[mid] == key) {`,
        found: `            return mid; // 找到`,
        go_right: `        } else if (arr[mid] < key) {
            left = mid + 1; // 目标在右侧`,
        go_left: `        } else {
            right = mid - 1; // 目标在左侧
        }`,
        not_found: `    }
    return -1; // 未找到`,
        end: `}`
    };

    return (
        <div style={{ background: THEME.codeBg, borderRadius: 8, padding: '20px', border: `1px solid ${THEME.border}`, fontFamily: 'monospace', fontSize: 13, color: THEME.textSecondary, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ marginTop: 0, marginBottom: 15, color: THEME.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 16, background: THEME.accent, display: 'block', borderRadius: 2 }}></span>
                算法逻辑 (C 语言)
            </h4>
            <div style={{ flex: 1 }}>
                {Object.entries(codeBlocks).map(([key, code]) => (
                    <motion.div key={key} animate={{ backgroundColor: highlightedBlock === key ? THEME.codeHighlight : 'transparent', borderLeft: highlightedBlock === key ? `3px solid ${THEME.nodeMid}` : '3px solid transparent' }} style={{ margin: 0, padding: '4px 10px', borderRadius: 4, transition: 'background-color 0.2s', whiteSpace: 'pre-wrap' }}>
                        {code}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};


// 指针组件
// ... (这部分保持不变)
const Pointer = ({ label, color, xPosition }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0, x: xPosition }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{ position: 'absolute', top: 0, left: 0, width: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
        <div style={{ fontSize: 11, color, fontWeight: 'bold', marginBottom: 2, whiteSpace: 'nowrap' }}>{label}</div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22L12 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 15L12 22L5 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </motion.div>
);

const RangePointer = ({ label, color, xPosition }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, x: xPosition }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ position: 'absolute', bottom: -35, left: 0, width: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
    >
        <div style={{ fontSize: 12, color, fontWeight: 'bold', background: THEME.bg, padding: '1px 5px', borderRadius: 4 }}>{label}</div>
    </motion.div>
);


// ================== 4. 主组件 ==================
// ... (这部分保持不变)
const BinarySearchVisualizer = () => {
    const [arrayInput, setArrayInput] = useState('12, 45, 78, 23, 56, 89, 34, 91, 8');
    const [keyInput, setKeyInput] = useState('34');
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [speed, setSpeed] = useState(1.0);

    const sortedArray = useMemo(() => arrayInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)).sort((a, b) => a - b), [arrayInput]);
    const searchKey = useMemo(() => parseInt(keyInput.trim(), 10), [keyInput]);
    const currentStep = steps[currentStepIndex] || { left: -1, right: -1, mid: -1, foundIndex: -1, isFinished: false, description: "准备就绪，请点击开始。", highlightedCodeBlock: null };

    const elementWidth = 62;

    useEffect(() => {
        let timer;
        if (isAnimating && currentStepIndex < steps.length - 1) {
            timer = setTimeout(() => { setCurrentStepIndex(i => i + 1); }, (2.2 - speed) * 800);
        } else if (currentStepIndex >= steps.length - 1) {
            setIsAnimating(false);
        }
        return () => clearTimeout(timer);
    }, [isAnimating, currentStepIndex, steps, speed]);

    const handleStart = () => {
        if (isNaN(searchKey)) { alert("请输入有效的查找数字！"); return; }
        const { steps: generatedSteps } = generateBinarySearchSteps(sortedArray, searchKey);
        setSteps(generatedSteps); setCurrentStepIndex(0); setIsAnimating(true);
    };

    const handleRandomize = () => {
        const len = Math.floor(Math.random() * 8) + 8;
        const newArr = Array.from({ length: len }, () => Math.floor(Math.random() * 100));
        setArrayInput(newArr.join(', '));
        const key = Math.random() > 0.5 ? newArr[Math.floor(Math.random() * len)] : Math.floor(Math.random() * 100);
        setKeyInput(key.toString());
        handleReset();
    }

    const handlePauseResume = () => {
        if (steps.length === 0 || currentStep.isFinished) { handleStart(); return; }
        setIsAnimating(prev => !prev);
    }

    const handleReset = () => {
        setIsAnimating(false); setSteps([]); setCurrentStepIndex(0);
    };

    const handleStepChange = (delta) => {
        setIsAnimating(false);
        setCurrentStepIndex(i => Math.max(0, Math.min(steps.length - 1, i + delta)));
    }

    const getNodeStyle = (index) => {
        const { left, right, mid, foundIndex, isFinished } = currentStep;

        if (isFinished) {
            if (index === foundIndex) return { color: '#fff', bgColor: THEME.nodeFound, borderColor: THEME.nodeFound, scale: 1.1, y: -5, opacity: 1 };
            if (foundIndex !== -1) return { opacity: 0.4, borderColor: THEME.nodeEliminated };
            return { opacity: 1, borderColor: THEME.nodeEliminated };
        }

        const isInRange = index >= left && index <= right;
        if (index === mid) {
            return { color: '#fff', bgColor: THEME.nodeMid, borderColor: THEME.nodeMid, scale: 1.1, y: -5, opacity: 1 };
        }
        if (isInRange) {
            return { borderColor: THEME.nodeInRange, opacity: 1 };
        }

        return { borderColor: THEME.nodeEliminated, opacity: 0.4 };
    };

    return (
        <div style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', flexDirection: 'column', gap: 15, background: THEME.bg, borderRadius: 12, padding: '24px', height: '85vh', boxSizing: 'border-box', color: THEME.text }}>

            {/* 1. 顶部全局控制栏 */}
            <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 15, borderBottom: `1px solid ${THEME.border}`, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ marginRight: 'auto' }}>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>二分查找演示</div>
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
                    <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: `1px dashed ${THEME.border}` }}>
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
                    {steps.length === 0 && <div style={{ fontSize: 11, color: THEME.textSecondary, textAlign: 'center', marginBottom: 10 }}>⚠️ 注意：为确保算法正确，开始后数组将自动升序排序。</div>}


                    {/* 动画区 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflowX: 'auto', overflowY: 'hidden', padding: '20px' }}>
                        <div style={{ position: 'relative', padding: '60px 0 50px', minWidth: 'min-content' }}>
                            <AnimatePresence>
                                {currentStep.mid !== -1 && !currentStep.isFinished && (
                                    <Pointer label={`Mid: ${currentStep.mid}`} color={THEME.nodeMid} xPosition={currentStep.mid * elementWidth} />
                                )}
                            </AnimatePresence>

                            <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
                                <AnimatePresence>
                                    {currentStep.left !== -1 && sortedArray.length > 0 && !currentStep.isFinished && (
                                        <RangePointer label="L" color={THEME.textSecondary} xPosition={currentStep.left * elementWidth} />
                                    )}
                                </AnimatePresence>
                                <AnimatePresence>
                                    {currentStep.right !== -1 && sortedArray.length > 0 && !currentStep.isFinished && (
                                        <RangePointer label="R" color={THEME.textSecondary} xPosition={currentStep.right * elementWidth} />
                                    )}
                                </AnimatePresence>

                                {sortedArray.map((value, index) => {
                                    const { color = THEME.text, bgColor = 'transparent', borderColor = THEME.nodeDefault, scale = 1, y = 0, opacity = 1 } = getNodeStyle(index);
                                    return (
                                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <motion.div
                                                animate={{
                                                    backgroundColor: bgColor,
                                                    borderColor: borderColor,
                                                    scale: scale,
                                                    y: y,
                                                    opacity: opacity,
                                                    color: color
                                                }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                                style={{
                                                    width: 50, height: 50, borderRadius: 10,
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                    fontSize: 16, fontWeight: 'bold',
                                                    border: `2px solid`,
                                                    boxShadow: (index === currentStep.mid || index === currentStep.foundIndex) && currentStep.isFinished ? `0 4px 12px ${borderColor}66` : 'none'
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

                        {sortedArray.length === 0 && <div style={{ color: THEME.textSecondary, fontStyle: 'italic' }}>数据为空，请生成或输入数据</div>}
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
// ... (这部分保持不变)
const btnStyle = { background: 'transparent', color: THEME.text, border: `1px solid ${THEME.border}`, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: '500', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const inputStyle = { background: THEME.inputBg, border: `1px solid ${THEME.border}`, color: THEME.text, padding: '6px 10px', borderRadius: 6, outline: 'none', fontSize: 13, fontFamily: 'monospace' };
const labelStyle = { fontSize: 12, color: THEME.textSecondary, marginRight: 8, fontWeight: '500', whiteSpace: 'nowrap' };
const inputGroupStyle = { display: 'flex', alignItems: 'center', minWidth: '150px' };

export default BinarySearchVisualizer;