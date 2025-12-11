import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 1. 主题与配置 ==================
const THEME = {
    bg: '#0d1117',
    panel: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    nodeBlack: '#21262d',
    nodeRed: '#e06c75',
    nodeCurrent: '#d29922',
    nodeFound: '#2ea043',
    inputBg: '#010409',
    codeBg: '#161b22',
    codeHighlight: 'rgba(56, 139, 253, 0.2)',
    accent: '#58a6ff'
};

// ================== 2. 算法与布局逻辑 ==================

// --- Instrumentable Red-Black Tree Class ---
// This class performs the RBT logic and pushes visualization steps into an array.
class RedBlackTree {
    constructor() {
        this.NIL = { color: 'BLACK', left: null, right: null, parent: null, key: 'NIL' };
        this.root = this.NIL;
    }

    // Helper to deep clone the tree for a step snapshot
    cloneTree(node, parent = null) {
        if (node === this.NIL || !node) return null;
        const newNode = { key: node.key, color: node.color, parent };
        newNode.left = this.cloneTree(node.left, newNode);
        newNode.right = this.cloneTree(node.right, newNode);
        return newNode;
    }

    leftRotate(x, steps) {
        steps.push({ tree: this.cloneTree(this.root), path: [x.key], description: `围绕 ${x.key} 进行左旋...`, highlightedCodeBlock: 'left_rotate' });
        const y = x.right;
        x.right = y.left;
        if (y.left !== this.NIL) y.left.parent = x;
        y.parent = x.parent;
        if (x.parent === this.NIL) this.root = y;
        else if (x === x.parent.left) x.parent.left = y;
        else x.parent.right = y;
        y.left = x;
        x.parent = y;
        steps.push({ tree: this.cloneTree(this.root), path: [y.key], description: `左旋完成。`, highlightedCodeBlock: 'left_rotate' });
    }

    rightRotate(y, steps) {
        steps.push({ tree: this.cloneTree(this.root), path: [y.key], description: `围绕 ${y.key} 进行右旋...`, highlightedCodeBlock: 'right_rotate' });
        const x = y.left;
        y.left = x.right;
        if (x.right !== this.NIL) x.right.parent = y;
        x.parent = y.parent;
        if (y.parent === this.NIL) this.root = x;
        else if (y === y.parent.right) y.parent.right = x;
        else y.parent.left = x;
        x.right = y;
        y.parent = x;
        steps.push({ tree: this.cloneTree(this.root), path: [x.key], description: `右旋完成。`, highlightedCodeBlock: 'right_rotate' });
    }

    insert(key, steps) {
        const z = { key, color: 'RED', left: this.NIL, right: this.NIL, parent: this.NIL };
        let y = this.NIL;
        let x = this.root;
        const path = [];
        while (x !== this.NIL) {
            y = x;
            path.push(x.key);
            steps.push({ tree: this.cloneTree(this.root), path: [...path], currentKey: key, description: `比较 ${key} 和 ${x.key}...`, highlightedCodeBlock: 'bst_insert' });
            if (z.key < x.key) x = x.left;
            else x = x.right;
        }
        z.parent = y;
        if (y === this.NIL) this.root = z;
        else if (z.key < y.key) y.left = z;
        else y.right = z;

        path.push(z.key);
        steps.push({ tree: this.cloneTree(this.root), path, description: `像BST一样插入 ${key} (红色节点)。`, highlightedCodeBlock: 'bst_insert' });
        this.insertFixup(z, steps);
    }

    insertFixup(z, steps) {
        while (z.parent.color === 'RED') {
            let uncle;
            if (z.parent === z.parent.parent.left) {
                uncle = z.parent.parent.right;
                if (uncle.color === 'RED') {
                    steps.push({ tree: this.cloneTree(this.root), path: [z.key, z.parent.key, uncle.key], description: `修复 Case 1: 叔叔 (${uncle.key}) 是红色，进行颜色翻转。`, highlightedCodeBlock: 'fixup_case1' });
                    z.parent.color = 'BLACK';
                    uncle.color = 'BLACK';
                    z.parent.parent.color = 'RED';
                    z = z.parent.parent;
                } else {
                    if (z === z.parent.right) {
                        steps.push({ tree: this.cloneTree(this.root), path: [z.key], description: `修复 Case 2: 叔叔是黑色 (三角)，左旋。`, highlightedCodeBlock: 'fixup_case2' });
                        z = z.parent;
                        this.leftRotate(z, steps);
                    }
                    steps.push({ tree: this.cloneTree(this.root), path: [z.key], description: `修复 Case 3: 叔叔是黑色 (直线)，颜色翻转并右旋。`, highlightedCodeBlock: 'fixup_case3' });
                    z.parent.color = 'BLACK';
                    z.parent.parent.color = 'RED';
                    this.rightRotate(z.parent.parent, steps);
                }
            } else { // Symmetric case
                uncle = z.parent.parent.left;
                if (uncle.color === 'RED') {
                    steps.push({ tree: this.cloneTree(this.root), path: [z.key, z.parent.key, uncle.key], description: `修复 Case 1: 叔叔 (${uncle.key}) 是红色，进行颜色翻转。`, highlightedCodeBlock: 'fixup_case1' });
                    z.parent.color = 'BLACK';
                    uncle.color = 'BLACK';
                    z.parent.parent.color = 'RED';
                    z = z.parent.parent;
                } else {
                    if (z === z.parent.left) {
                        steps.push({ tree: this.cloneTree(this.root), path: [z.key], description: `修复 Case 2: 叔叔是黑色 (三角)，右旋。`, highlightedCodeBlock: 'fixup_case2' });
                        z = z.parent;
                        this.rightRotate(z, steps);
                    }
                    steps.push({ tree: this.cloneTree(this.root), path: [z.key], description: `修复 Case 3: 叔叔是黑色 (直线)，颜色翻转并左旋。`, highlightedCodeBlock: 'fixup_case3' });
                    z.parent.color = 'BLACK';
                    z.parent.parent.color = 'RED';
                    this.leftRotate(z.parent.parent, steps);
                }
            }
        }
        if (this.root.color !== 'BLACK') {
            steps.push({ tree: this.cloneTree(this.root), path: [this.root.key], description: `根节点染黑。`, highlightedCodeBlock: 'root_black' });
            this.root.color = 'BLACK';
        }
    }
}


// --- Step Generation Wrapper ---
const generateRBTSteps = (keysToInsert) => {
    const steps = [];
    const rbt = new RedBlackTree();
    steps.push({ tree: null, path: [], description: "开始构建红黑树...", highlightedCodeBlock: null });

    for (const key of keysToInsert) {
        rbt.insert(key, steps);
    }

    steps.push({ tree: rbt.cloneTree(rbt.root), path: [], isFinished: true, description: "操作完成！", highlightedCodeBlock: null });
    return { steps };
};


// --- Tree Layout Calculation (same as BST) ---
const getTreeLayout = (tree) => {
    if (!tree) return { nodes: [], edges: [] };
    const nodes = [];
    const edges = [];
    let x = 0;
    const NODE_DIAMETER = 44;
    const H_GAP = 15;
    const V_GAP = 70;

    const assignX = (node) => {
        if (!node) return;
        assignX(node.left);
        node.x = x;
        x += NODE_DIAMETER + H_GAP;
        assignX(node.right);
    };

    const assignPositions = (node, level, parentPos = null) => {
        if (!node) return;
        const pos = { value: node.key, color: node.color, x: node.x, y: level * V_GAP };
        nodes.push(pos);
        if (parentPos) edges.push({ from: parentPos, to: pos });
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
        bst_insert: '1. 执行标准BST插入，新节点为红色',
        fixup_case1: '2. 修复 Case 1: 叔叔为红色\n   -> 翻转父、叔、祖父颜色',
        fixup_case2: '3. 修复 Case 2: 叔叔为黑色 (三角)\n   -> 旋转父节点',
        fixup_case3: '4. 修复 Case 3: 叔叔为黑色 (直线)\n   -> 翻转父/祖父颜色, 旋转祖父',
        left_rotate: '5. 左旋操作',
        right_rotate: '6. 右旋操作',
        root_black: '7. 确保根节点为黑色',
    };
    return (
        <div style={{ background: THEME.codeBg, borderRadius: 8, padding: '20px', border: `1px solid ${THEME.border}`, fontFamily: 'monospace', fontSize: 13, color: THEME.textSecondary, height: '100%' }}>
            <h4 style={{ marginTop: 0, marginBottom: 15, color: THEME.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 3, height: 16, background: THEME.accent, display: 'block', borderRadius: 2 }}></span>
                插入修复逻辑 (C-like)
            </h4>
            {Object.entries(codeBlocks).map(([key, code]) => (
                <motion.div key={key} animate={{ backgroundColor: highlightedBlock === key ? THEME.codeHighlight : 'transparent', borderLeft: highlightedBlock === key ? `3px solid ${THEME.nodeCurrent}` : '3px solid transparent' }} style={{ margin: '4px 0', padding: '6px 10px', borderRadius: 4, transition: 'background-color 0.2s', whiteSpace: 'pre-wrap' }}>
                    {code}
                </motion.div>
            ))}
        </div>
    );
};


// ================== 4. 主组件 ==================
const RBTVisualizer = () => {
    const [arrayInput, setArrayInput] = useState('10, 85, 15, 70, 20, 60, 30, 6');
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [isBuilt, setIsBuilt] = useState(false);

    const keysToInsert = useMemo(() => arrayInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)), [arrayInput]);
    const currentStep = steps[currentStepIndex] || { tree: null, path: [], description: "准备就绪" };
    const layout = useMemo(() => getTreeLayout(currentStep.tree), [currentStep.tree]);
    const treeWidth = layout.nodes.reduce((max, node) => Math.max(max, node.x), 0) + 50;

    useEffect(() => {
        let timer;
        if (isAnimating && currentStepIndex < steps.length - 1) {
            timer = setTimeout(() => setCurrentStepIndex(i => i + 1), (2.2 - speed) * 900);
        } else if (isAnimating) {
            setIsAnimating(false);
        }
        return () => clearTimeout(timer);
    }, [isAnimating, currentStepIndex, steps.length, speed]);

    const handleBuildTree = () => {
        const { steps } = generateRBTSteps(keysToInsert);
        setSteps(steps);
        setCurrentStepIndex(0);
        setIsAnimating(true);
        setIsBuilt(true);
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
    }
    const handleStepChange = (delta) => {
        setIsAnimating(false);
        setCurrentStepIndex(i => Math.max(0, Math.min(steps.length - 1, i + delta)));
    };

    const getNodeStyle = (node) => {
        const isCurrent = currentStep.path.length > 0 && currentStep.path[currentStep.path.length - 1] === node.value;
        const color = node.color === 'RED' ? THEME.nodeRed : THEME.nodeBlack;
        const borderColor = isCurrent ? THEME.nodeCurrent : color;
        return {
            borderColor,
            backgroundColor: color,
            color: node.color === 'RED' ? 'black' : 'white',
            boxShadow: isCurrent ? `0 0 15px ${THEME.nodeCurrent}` : 'none',
        };
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', gap: 15, background: THEME.bg, borderRadius: 12, padding: '24px', height: '90vh', color: THEME.text }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 15, borderBottom: `1px solid ${THEME.border}`, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ marginRight: 'auto' }}>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>红黑树插入演示</div>
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
                    <button onClick={handleReset} style={{ ...btnStyle, background: THEME.nodeRed, color: '#fff' }}>重置</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 3, background: THEME.panel, borderRadius: 12, padding: '20px', border: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center', paddingBottom: 20, borderBottom: `1px dashed ${THEME.border}` }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>插入数据</label>
                            <input type="text" value={arrayInput} onChange={e => setArrayInput(e.target.value)} disabled={isBuilt} style={{ ...inputStyle, flex: 1 }} />
                        </div>
                        <button onClick={handleBuildTree} disabled={isBuilt} style={{ ...btnStyle, background: THEME.accent, color: '#0d1117' }}>构建树</button>
                    </div>

                    <div style={{ flex: 1, position: 'relative', overflow: 'auto', paddingTop: '20px' }}>
                        <AnimatePresence>
                            <motion.div style={{ position: 'relative', width: treeWidth, height: '100%', margin: '0 auto' }}>
                                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                                    {layout.edges.map((edge, i) => (
                                        <motion.line key={`line-${i}`} x1={edge.from.x + 22} y1={edge.from.y + 22} x2={edge.to.x + 22} y2={edge.to.y + 22} stroke={THEME.border} strokeWidth={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
                                    ))}
                                </svg>
                                {layout.nodes.map((node) => (
                                    <motion.div
                                        key={node.value}
                                        layout
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1, x: node.x, y: node.y, ...getNodeStyle(node) }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        style={nodeBaseStyle}
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
const nodeBaseStyle = {
    width: 44, height: 44, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
    fontSize: 14, fontWeight: 'bold', border: `2px solid`, position: 'absolute'
};

export default RBTVisualizer;