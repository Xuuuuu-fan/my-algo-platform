import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 1. 主题与配置 ==================
const THEME = {
    bg: '#0d1117',
    panel: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    nodeDefault: '#1f6feb',
    nodeHighlight: '#d29922', // 橙色
    nodeFound: '#2ea043',     // 绿色
    nodeNotFound: '#da3633',   // 红色
    inputBg: '#010409',
    codeBg: '#161b22',
    codeHighlight: 'rgba(56, 139, 253, 0.2)',
    accent: '#58a6ff'
};

// ================== 2. 算法逻辑 ==================
const generateHashingSteps = (initialTable, keysToInsert, keyToSearch, tableSize, operation) => {
    const steps = [];
    let table = JSON.parse(JSON.stringify(initialTable)); // Deep copy

    if (operation === 'insert') {
        steps.push({ table, currentKey: null, hashIndex: -1, description: "准备插入所有元素...", highlightedCodeBlock: null });
        for (const key of keysToInsert) {
            steps.push({ table, currentKey: key, hashIndex: -1, description: `处理下一个键: ${key}`, highlightedCodeBlock: 'start' });
            const hashIndex = key % tableSize;
            steps.push({ table, currentKey: key, hashIndex, description: `计算哈希值: ${key} % ${tableSize} = ${hashIndex}`, highlightedCodeBlock: 'hash' });

            table[hashIndex].push(key);
            steps.push({ table: JSON.parse(JSON.stringify(table)), currentKey: key, hashIndex, isFinished: false, description: `将 ${key} 插入到桶 ${hashIndex}`, highlightedCodeBlock: 'insert' });
        }
        steps.push({ table, currentKey: null, hashIndex: -1, isFinished: true, description: "所有元素插入完毕！现在可以进行查找。", highlightedCodeBlock: 'end' });
        return { steps };
    }

    if (operation === 'search') {
        if (keyToSearch === null || isNaN(keyToSearch)) return { steps: [] };
        steps.push({ table, currentKey: keyToSearch, hashIndex: -1, searchPath: [], description: `准备查找键: ${keyToSearch}`, highlightedCodeBlock: 'start' });
        const hashIndex = keyToSearch % tableSize;
        steps.push({ table, currentKey: keyToSearch, hashIndex, searchPath: [], description: `计算哈希值: ${keyToSearch} % ${tableSize} = ${hashIndex}`, highlightedCodeBlock: 'hash' });

        const bucket = table[hashIndex];
        if (bucket.length === 0) {
            steps.push({ table, currentKey: keyToSearch, hashIndex, searchPath: [], isFinished: true, found: false, description: `桶 ${hashIndex} 为空，未找到 ${keyToSearch}。`, highlightedCodeBlock: 'not_found' });
            return { steps };
        }

        const searchPath = [];
        for (const val of bucket) {
            searchPath.push(val);
            steps.push({ table, currentKey: keyToSearch, hashIndex, searchPath: [...searchPath], description: `在桶 ${hashIndex} 中比较 ${val}...`, highlightedCodeBlock: 'compare' });
            if (val === keyToSearch) {
                steps.push({ table, currentKey: keyToSearch, hashIndex, searchPath: [...searchPath], isFinished: true, found: true, description: `成功找到键 ${keyToSearch}！`, highlightedCodeBlock: 'found' });
                return { steps };
            }
        }
        steps.push({ table, currentKey: keyToSearch, hashIndex, searchPath, isFinished: true, found: false, description: `遍历完桶 ${hashIndex}，未找到 ${keyToSearch}。`, highlightedCodeBlock: 'not_found' });
        return { steps };
    }

    return { steps: [] };
};

// ================== 3. 子组件 ==================
const CodePanel = ({ highlightedBlock }) => {
    // Simplified C-like representation of hash table operations
    const codeBlocks = {
        start: `// 查找或插入一个键
void processKey(HashTable* ht, int key) {`,
        hash: `    // 1. 计算哈希值
    int index = key % TABLE_SIZE;`,
        insert: `    // 2. 将键插入到对应链表的末尾
    insertNode(&(ht->table[index]), key);`,
        compare: `    // 在桶的链表中查找
    Node* current = ht->table[index];
    while (current != NULL) {
        if (current->data == key) {`,
        found: `            return current; // 找到
        }`,
        not_found: `        current = current->next;
    }
    return NULL; // 未找到`,
        end: `}`
    };

    return (
        <div style={{ background: THEME.codeBg, borderRadius: 8, padding: '20px', border: `1px solid ${THEME.border}`, fontFamily: 'monospace', fontSize: 13, color: THEME.textSecondary, height: '100%' }}>
            <h4 style={{ marginTop: 0, marginBottom: 15, color: THEME.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 16, background: THEME.accent, display: 'block', borderRadius: 2 }}></span>
                算法逻辑 (C 语言)
            </h4>
            {Object.entries(codeBlocks).map(([key, code]) => (
                <motion.div key={key} animate={{ backgroundColor: highlightedBlock === key ? THEME.codeHighlight : 'transparent', borderLeft: highlightedBlock === key ? `3px solid ${THEME.nodeHighlight}` : '3px solid transparent' }} style={{ margin: '2px 0', padding: '4px 10px', borderRadius: 4, transition: 'background-color 0.2s', whiteSpace: 'pre-wrap' }}>
                    {code}
                </motion.div>
            ))}
        </div>
    );
};

// ================== 4. 主组件 ==================
const HashSearchVisualizer = () => {
    const [arrayInput, setArrayInput] = useState('45, 12, 89, 34, 55, 91, 8, 25');
    const [keyInput, setKeyInput] = useState('91');
    const [tableSize, setTableSize] = useState(10);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [isBuilt, setIsBuilt] = useState(false); // Hash table is built?

    const keysToInsert = useMemo(() => arrayInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)), [arrayInput]);
    const searchKey = useMemo(() => parseInt(keyInput.trim(), 10), [keyInput]);

    const initialTable = useMemo(() => Array.from({ length: tableSize }, () => []), [tableSize]);
    const currentStep = steps[currentStepIndex] || { table: initialTable, description: "准备就绪", highlightedCodeBlock: null };
    const { table, currentKey, hashIndex, searchPath, isFinished, found } = currentStep;

    useEffect(() => {
        let timer;
        if (isAnimating && currentStepIndex < steps.length - 1) {
            timer = setTimeout(() => { setCurrentStepIndex(i => i + 1); }, (2.2 - speed) * 800);
        } else if (isAnimating && currentStepIndex >= steps.length - 1) {
            setIsAnimating(false);
        }
        return () => clearTimeout(timer);
    }, [isAnimating, currentStepIndex, steps.length, speed]);

    const handleInsert = () => {
        setIsBuilt(false);
        const { steps: generatedSteps } = generateHashingSteps(initialTable, keysToInsert, null, tableSize, 'insert');
        setSteps(generatedSteps);
        setCurrentStepIndex(0);
        setIsAnimating(true);
        // Mark as built after animation finishes
        const totalDuration = generatedSteps.length * ((2.2 - speed) * 800);
        setTimeout(() => setIsBuilt(true), totalDuration);
    };

    const handleSearch = () => {
        const { steps: generatedSteps } = generateHashingSteps(isBuilt ? table : initialTable, [], searchKey, tableSize, 'search');
        setSteps(generatedSteps);
        setCurrentStepIndex(0);
        setIsAnimating(true);
    };

    const handleReset = () => {
        setIsAnimating(false);
        setSteps([]);
        setCurrentStepIndex(0);
        setIsBuilt(false);
    };

    const handlePauseResume = () => {
        if (steps.length === 0 || currentStep.isFinished) return;
        setIsAnimating(prev => !prev);
    };

    const handleStepChange = (delta) => {
        setIsAnimating(false);
        setCurrentStepIndex(i => Math.max(0, Math.min(steps.length - 1, i + delta)));
    };

    const handleRandomize = () => {
        const len = Math.floor(Math.random() * 5) + 8; // 8-12 elements
        const newArr = Array.from({ length: len }, () => Math.floor(Math.random() * 100));
        setArrayInput(newArr.join(', '));
        const key = Math.random() > 0.5 ? newArr[Math.floor(Math.random() * len)] : Math.floor(Math.random() * 100);
        setKeyInput(key.toString());
        handleReset();
    }

    return (
        <div style={{ fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', gap: 15, background: THEME.bg, borderRadius: 12, padding: '24px', height: '90vh', color: THEME.text }}>

            {/* 1. 顶部全局控制栏 */}
            <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 15, borderBottom: `1px solid ${THEME.border}`, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ marginRight: 'auto' }}>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>散列查找演示 (链地址法)</div>
                    <div style={{ fontSize: 12, color: THEME.textSecondary }}>{currentStep.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: THEME.panel, padding: '4px 8px', borderRadius: 6 }}>
                        <span style={{ fontSize: 12, color: THEME.textSecondary, marginRight: 8 }}>速度</span>
                        <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={e => setSpeed(e.target.value)} style={{ width: 60 }} />
                    </div>
                    <button onClick={() => handleStepChange(-1)} disabled={steps.length === 0 || currentStepIndex === 0} style={btnStyle}>上一步</button>
                    <button onClick={handlePauseResume} disabled={steps.length === 0 || currentStep.isFinished} style={{ ...btnStyle, minWidth: 60, background: THEME.nodeHighlight, color: '#0d1117' }}>
                        {isAnimating ? '暂停' : '继续'}
                    </button>
                    <button onClick={() => handleStepChange(1)} disabled={steps.length === 0 || currentStepIndex === steps.length - 1} style={btnStyle}>下一步</button>
                    <button onClick={handleReset} style={{ ...btnStyle, background: THEME.nodeNotFound, color: '#fff' }}>重置</button>
                </div>
            </div>

            {/* 2. 主体区域 */}
            <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden' }}>

                {/* 左侧：可视化区域 */}
                <div style={{ flex: 3, background: THEME.panel, borderRadius: 12, padding: '20px', border: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' }}>

                    {/* 输入与控制 */}
                    <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center', paddingBottom: 20, borderBottom: `1px dashed ${THEME.border}` }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>待插入数据</label>
                            <input type="text" value={arrayInput} onChange={e => setArrayInput(e.target.value)} disabled={isBuilt || isAnimating} style={{ ...inputStyle, flex: 1 }} />
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>表大小</label>
                            <input type="number" min="5" max="20" value={tableSize} onChange={e => setTableSize(parseInt(e.target.value, 10))} disabled={isBuilt || isAnimating} style={{ ...inputStyle, width: 50 }} />
                        </div>
                        <button onClick={handleRandomize} disabled={isBuilt || isAnimating} style={{ ...btnStyle }}>🎲 随机</button>
                        <button onClick={handleInsert} disabled={isBuilt || isAnimating} style={{ ...btnStyle, background: THEME.nodeDefault, color: '#fff' }}>全部插入</button>
                    </div>
                    <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center', paddingTop: 20, marginBottom: 20 }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>待查找数据</label>
                            <input type="text" value={keyInput} onChange={e => setKeyInput(e.target.value)} disabled={!isBuilt || isAnimating} style={{ ...inputStyle, width: 60 }} />
                        </div>
                        <button onClick={handleSearch} disabled={!isBuilt || isAnimating} style={{ ...btnStyle, background: THEME.nodeFound, color: '#0d1117', fontWeight: 'bold' }}>查找</button>
                    </div>

                    {/* 动画区 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* 待处理区域 */}
                        <div style={{ position: 'relative', height: 60 }}>
                            <AnimatePresence>
                                {currentKey && !isFinished && (
                                    <motion.div
                                        key={currentKey}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                    >
                                        <div style={{ fontSize: 11, color: THEME.nodeHighlight }}>Current Key</div>
                                        <div style={nodeStyle(THEME.nodeHighlight, true)}>{currentKey}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* 哈希表 */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap', flex: 1, overflowY: 'auto', padding: '10px' }}>
                            {table.map((bucket, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <motion.div
                                        animate={{ backgroundColor: hashIndex === i ? THEME.codeHighlight : 'transparent' }}
                                        style={{ width: '100%', minHeight: 150, padding: '8px 4px', background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'background-color 0.3s' }}>
                                        {bucket.map((val, j) => {
                                            const isSearched = searchPath && searchPath.includes(val);
                                            const isLastSearched = isSearched && searchPath[searchPath.length - 1] === val;
                                            const isFound = isFinished && found && val === currentKey;
                                            const color = isFound ? THEME.nodeFound : isLastSearched ? THEME.nodeHighlight : isSearched ? THEME.nodeDefault : THEME.nodeDefault;
                                            return <motion.div key={j} layout transition={{ type: 'spring', stiffness: 300 }} style={nodeStyle(color, isLastSearched || isFound)}>{val}</motion.div>
                                        })}
                                    </motion.div>
                                    <div style={{ fontSize: 11, color: THEME.textSecondary }}>{i}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* 右侧：代码面板 */}
                <div style={{ flex: 2, minWidth: 350 }}>
                    <CodePanel highlightedBlock={currentStep.highlightedCodeBlock} />
                </div>
            </div>
        </div>
    );
};

// ================== 5. 样式对象 ==================
const btnStyle = { background: 'transparent', color: THEME.text, border: `1px solid ${THEME.border}`, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: '500', transition: 'all 0.2s' };
const inputStyle = { background: THEME.inputBg, border: `1px solid ${THEME.border}`, color: THEME.text, padding: '6px 10px', borderRadius: 6, outline: 'none', fontSize: 13, fontFamily: 'monospace' };
const labelStyle = { fontSize: 12, color: THEME.textSecondary, marginRight: 8, fontWeight: '500', whiteSpace: 'nowrap' };
const inputGroupStyle = { display: 'flex', alignItems: 'center' };
const nodeStyle = (color, isHighlighted) => ({
    width: 40, height: 40, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
    color: isHighlighted ? '#fff' : THEME.text,
    fontSize: 14, fontWeight: 'bold',
    border: `2px solid ${color}`,
    backgroundColor: isHighlighted ? color : 'transparent',
    boxShadow: isHighlighted ? `0 0 10px ${color}` : 'none',
    transition: 'all 0.3s'
});

export default HashSearchVisualizer;