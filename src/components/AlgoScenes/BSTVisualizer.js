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
    nodeCurrent: '#d29922', // 橙色
    nodeFound: '#2ea043',   // 绿色
    nodePath: 'rgba(46, 160, 67, 0.6)', // 路径颜色
    inputBg: '#010409',
    codeBg: '#161b22',
    codeHighlight: 'rgba(56, 139, 253, 0.2)',
    accent: '#58a6ff'
};

// ================== 2. 算法与布局逻辑 ==================

// --- BST Node Class ---
class Node {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

// --- Step Generation ---
const generateBSTSteps = (keysToInsert, keyToSearch, operation) => {
    const steps = [];
    let root = null;
    const deepCloneTree = (node) => node ? JSON.parse(JSON.stringify(node)) : null;

    if (operation === 'insert') {
        steps.push({ tree: null, path: [], description: "开始构建二叉搜索树...", highlightedCodeBlock: null });
        for (const key of keysToInsert) {
            steps.push({ tree: deepCloneTree(root), path: [], currentKey: key, description: `准备插入键: ${key}`, highlightedCodeBlock: 'start_insert' });
            if (!root) {
                root = new Node(key);
                steps.push({ tree: deepCloneTree(root), path: [key], currentKey: key, description: `树为空，将 ${key} 设为根节点。`, highlightedCodeBlock: 'insert_root' });
                continue;
            }
            let current = root;
            const path = [];
            while (true) {
                path.push(current.value);
                steps.push({ tree: deepCloneTree(root), path: [...path], currentKey: key, description: `比较 ${key} 和当前节点 ${current.value}`, highlightedCodeBlock: 'compare' });
                if (key < current.value) {
                    if (current.left === null) {
                        current.left = new Node(key);
                        path.push(key);
                        steps.push({ tree: deepCloneTree(root), path: [...path], currentKey: key, description: `${key} < ${current.value}，在左侧空位插入 ${key}。`, highlightedCodeBlock: 'insert_left' });
                        break;
                    }
                    current = current.left;
                } else {
                    if (current.right === null) {
                        current.right = new Node(key);
                        path.push(key);
                        steps.push({ tree: deepCloneTree(root), path: [...path], currentKey: key, description: `${key} >= ${current.value}，在右侧空位插入 ${key}。`, highlightedCodeBlock: 'insert_right' });
                        break;
                    }
                    current = current.right;
                }
            }
        }
        steps.push({ tree: deepCloneTree(root), path: [], isFinished: true, description: "二叉搜索树构建完成！", highlightedCodeBlock: 'end' });
        return { steps };
    }

    if (operation === 'search') {
        root = keysToInsert; // For search, keysToInsert is the existing tree
        steps.push({ tree: deepCloneTree(root), path: [], currentKey: keyToSearch, description: `开始查找: ${keyToSearch}`, highlightedCodeBlock: 'start_search' });
        let current = root;
        const path = [];
        while (current) {
            path.push(current.value);
            steps.push({ tree: deepCloneTree(root), path: [...path], currentKey: keyToSearch, description: `比较 ${keyToSearch} 和当前节点 ${current.value}`, highlightedCodeBlock: 'compare' });
            if (keyToSearch === current.value) {
                steps.push({ tree: deepCloneTree(root), path: [...path], isFinished: true, found: true, description: `找到键 ${keyToSearch}！`, highlightedCodeBlock: 'found' });
                return { steps };
            }
            if (keyToSearch < current.value) {
                current = current.left;
            } else {
                current = current.right;
            }
        }
        steps.push({ tree: deepCloneTree(root), path: [...path], isFinished: true, found: false, description: `未找到键 ${keyToSearch}。`, highlightedCodeBlock: 'not_found' });
        return { steps };
    }
    return { steps: [] };
};

// --- Tree Layout Calculation ---
const getTreeLayout = (tree) => {
    if (!tree) return { nodes: [], edges: [] };
    const nodes = [];
    const edges = [];
    let x = 0;
    const NODE_WIDTH = 50;
    const H_GAP = 20;
    const V_GAP = 70;

    const assignX = (node) => {
        if (!node) return;
        assignX(node.left);
        node.x = x;
        x += NODE_WIDTH + H_GAP;
        assignX(node.right);
    };

    const assignPositions = (node, level, parentPos = null) => {
        if (!node) return;

        const pos = { value: node.value, x: node.x, y: level * V_GAP };
        nodes.push(pos);

        if (parentPos) {
            edges.push({ from: parentPos, to: pos });
        }

        assignPositions(node.left, level + 1, pos);
        assignPositions(node.right, level + 1, pos);
    };

    assignX(tree);
    assignPositions(tree, 0);

    return { nodes, edges };
};

// ================== 3. 子组件 ==================
const CodePanel = ({ highlightedBlock }) => {
    const codeBlocks = {
        start_insert: `Node* insert(Node* root, int key) {`,
        insert_root: `    if (root == NULL) {
        return createNode(key); // 创建根节点
    }`,
        compare: `    if (key < root->value) {`,
        insert_left: `        root->left = insert(root->left, key);`,
        insert_right: `    } else {
        root->right = insert(root->right, key);
    }
    return root;`,
        start_search: `Node* search(Node* root, int key) {`,
        found: `    if (root == NULL || root->value == key) {
        return root; // 找到或为空
    }`,
        not_found: `    if (key < root->value)
        return search(root->left, key);
    else
        return search(root->right, key);`,
        end: `}`
    };

    return (
        <div style={{ background: THEME.codeBg, borderRadius: 8, padding: '20px', border: `1px solid ${THEME.border}`, fontFamily: 'monospace', fontSize: 13, color: THEME.textSecondary, height: '100%' }}>
            <h4 style={{ marginTop: 0, marginBottom: 15, color: THEME.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 16, background: THEME.accent, display: 'block', borderRadius: 2 }}></span>
                算法逻辑 (C 语言)
            </h4>
            {Object.entries(codeBlocks).map(([key, code]) => (
                <motion.div key={key} animate={{ backgroundColor: highlightedBlock === key ? THEME.codeHighlight : 'transparent', borderLeft: highlightedBlock === key ? `3px solid ${THEME.nodeCurrent}` : '3px solid transparent' }} style={{ margin: '2px 0', padding: '4px 10px', borderRadius: 4, transition: 'background-color 0.2s', whiteSpace: 'pre-wrap' }}>
                    {code}
                </motion.div>
            ))}
        </div>
    );
};

// ================== 4. 主组件 ==================
const BSTVisualizer = () => {
    const [arrayInput, setArrayInput] = useState('50, 30, 70, 20, 40, 60, 80');
    const [keyInput, setKeyInput] = useState('60');
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [isBuilt, setIsBuilt] = useState(false);
    const [finalTree, setFinalTree] = useState(null);

    const keysToInsert = useMemo(() => arrayInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)), [arrayInput]);
    const searchKey = useMemo(() => parseInt(keyInput.trim(), 10), [keyInput]);

    const currentStep = steps[currentStepIndex] || { tree: null, path: [], description: "准备就绪" };
    const layout = useMemo(() => getTreeLayout(currentStep.tree), [currentStep.tree]);

    const containerRef = React.useRef(null);
    const treeWidth = layout.nodes.reduce((max, node) => Math.max(max, node.x), 0) + 50;

    useEffect(() => {
        let timer;
        if (isAnimating && currentStepIndex < steps.length - 1) {
            timer = setTimeout(() => { setCurrentStepIndex(i => i + 1); }, (2.2 - speed) * 800);
        } else if (isAnimating && currentStepIndex >= steps.length - 1) {
            setIsAnimating(false);
        }
        return () => clearTimeout(timer);
    }, [isAnimating, currentStepIndex, steps.length, speed]);

    const handleBuildTree = () => {
        const { steps: generatedSteps } = generateBSTSteps(keysToInsert, null, 'insert');
        setSteps(generatedSteps);
        setCurrentStepIndex(0);
        setIsAnimating(true);
        setIsBuilt(true);
        setFinalTree(generatedSteps[generatedSteps.length - 1].tree);
    };

    const handleSearch = () => {
        const { steps: generatedSteps } = generateBSTSteps(finalTree, searchKey, 'search');
        setSteps(generatedSteps);
        setCurrentStepIndex(0);
        setIsAnimating(true);
    };

    const handleReset = () => {
        setIsAnimating(false);
        setSteps([]);
        setCurrentStepIndex(0);
        setIsBuilt(false);
        setFinalTree(null);
    };

    const handlePauseResume = () => {
        if (steps.length === 0 || currentStep.isFinished) return;
        setIsAnimating(prev => !prev);
    };

    const handleStepChange = (delta) => {
        setIsAnimating(false);
        setCurrentStepIndex(i => Math.max(0, Math.min(steps.length - 1, i + delta)));
    };

    const getNodeColor = (nodeValue) => {
        const { path, isFinished, found } = currentStep;
        const isCurrent = path.length > 0 && path[path.length - 1] === nodeValue;

        if (isFinished && found && isCurrent) return THEME.nodeFound;
        if (isCurrent && !isFinished) return THEME.nodeCurrent;
        if (path.includes(nodeValue)) return THEME.nodePath;
        return THEME.nodeDefault;
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', gap: 15, background: THEME.bg, borderRadius: 12, padding: '24px', height: '90vh', color: THEME.text }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 15, borderBottom: `1px solid ${THEME.border}`, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ marginRight: 'auto' }}>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>二叉搜索树演示</div>
                    <div style={{ fontSize: 12, color: THEME.textSecondary }}>{currentStep.description}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: THEME.panel, padding: '4px 8px', borderRadius: 6 }}>
                        <span style={{ fontSize: 12, color: THEME.textSecondary, marginRight: 8 }}>速度</span>
                        <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={e => setSpeed(e.target.value)} style={{ width: 60 }} />
                    </div>
                    <button onClick={() => handleStepChange(-1)} disabled={steps.length === 0 || currentStepIndex === 0} style={btnStyle}>上一步</button>
                    <button onClick={handlePauseResume} disabled={steps.length === 0 || currentStep.isFinished} style={{ ...btnStyle, minWidth: 60, background: THEME.nodeCurrent, color: '#0d1117' }}>
                        {isAnimating ? '暂停' : '继续'}
                    </button>
                    <button onClick={() => handleStepChange(1)} disabled={steps.length === 0 || currentStepIndex === steps.length - 1} style={btnStyle}>下一步</button>
                    <button onClick={handleReset} style={{ ...btnStyle, background: THEME.nodeNotFound, color: '#fff' }}>重置</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 3, background: THEME.panel, borderRadius: 12, padding: '20px', border: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center', paddingBottom: 20, borderBottom: `1px dashed ${THEME.border}` }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>插入数据</label>
                            <input type="text" value={arrayInput} onChange={e => setArrayInput(e.target.value)} disabled={isBuilt} style={{ ...inputStyle, flex: 1 }} />
                        </div>
                        <button onClick={handleBuildTree} disabled={isBuilt} style={{ ...btnStyle, background: THEME.nodeDefault, color: '#fff' }}>构建树</button>
                    </div>
                    <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center', paddingTop: 20 }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>查找数据</label>
                            <input type="text" value={keyInput} onChange={e => setKeyInput(e.target.value)} disabled={!isBuilt || isAnimating} style={{ ...inputStyle, width: 60 }} />
                        </div>
                        <button onClick={handleSearch} disabled={!isBuilt || isAnimating} style={{ ...btnStyle, background: THEME.nodeFound, color: '#0d1117', fontWeight: 'bold' }}>查找</button>
                    </div>

                    {/* 动画区 */}
                    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'auto', paddingTop: '20px' }}>
                        <AnimatePresence>
                            <motion.div style={{ position: 'relative', width: treeWidth, height: '100%', margin: '0 auto' }}>
                                {/* 
                                    ==================================================
                                    ===                 代码修正部分                 ===
                                    ==================================================
                                    将所有 line 元素包裹在一个 SVG 元素中
                                */}
                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                                    {layout.edges.map((edge, i) => (
                                        <motion.line
                                            key={`line-${i}`}
                                            x1={edge.from.x + 25} y1={edge.from.y + 25}
                                            x2={edge.to.x + 25} y2={edge.to.y + 25}
                                            stroke={THEME.border} strokeWidth={2}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    ))}
                                </svg>

                                {/* Nodes */}
                                {layout.nodes.map((node) => (
                                    <motion.div
                                        key={node.value}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{
                                            opacity: 1, scale: 1,
                                            x: node.x, y: node.y,
                                            backgroundColor: getNodeColor(node.value) === THEME.nodeCurrent || getNodeColor(node.value) === THEME.nodeFound ? getNodeColor(node.value) : 'transparent',
                                            borderColor: getNodeColor(node.value),
                                            color: getNodeColor(node.value) === THEME.nodeCurrent || getNodeColor(node.value) === THEME.nodeFound ? '#fff' : THEME.text
                                        }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        style={nodeStyle}
                                    >
                                        {node.value}
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

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
const nodeStyle = {
    width: 50, height: 50, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
    fontSize: 14, fontWeight: 'bold',
    border: `2px solid`,
    position: 'absolute',
    color: THEME.text
};

export default BSTVisualizer;