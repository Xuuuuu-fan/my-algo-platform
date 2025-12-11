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

// --- Instrumentable Red-Black Tree Class for Visualization ---
class RedBlackTree {
    constructor() {
        this.NIL = { key: 'NIL', color: 'BLACK', left: null, right: null, parent: null };
        this.root = this.NIL;
    }

    cloneTree(node) {
        if (node === this.NIL || !node) return null;
        const newNode = { key: node.key, color: node.color };
        newNode.left = this.cloneTree(node.left);
        newNode.right = this.cloneTree(node.right);
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
        steps.push({ tree: this.cloneTree(this.root), path: [y.key], description: `左旋完成。` });
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
        steps.push({ tree: this.cloneTree(this.root), path: [x.key], description: `右旋完成。` });
    }

    // ... (insert and insertFixup methods from previous example remain the same)
    insert(key, steps) {
        const z = { key, color: 'RED', left: this.NIL, right: this.NIL, parent: this.NIL };
        let y = this.NIL; let x = this.root;
        while (x !== this.NIL) {
            y = x;
            if (z.key < x.key) x = x.left;
            else x = x.right;
        }
        z.parent = y;
        if (y === this.NIL) this.root = z;
        else if (z.key < y.key) y.left = z;
        else y.right = z;
        this.insertFixup(z, steps);
    }
    insertFixup(z, steps) {
        while (z.parent.color === 'RED') {
            if (z.parent === z.parent.parent.left) {
                const uncle = z.parent.parent.right;
                if (uncle.color === 'RED') {
                    z.parent.color = 'BLACK'; uncle.color = 'BLACK'; z.parent.parent.color = 'RED'; z = z.parent.parent;
                } else {
                    if (z === z.parent.right) { z = z.parent; this.leftRotate(z, steps); }
                    z.parent.color = 'BLACK'; z.parent.parent.color = 'RED'; this.rightRotate(z.parent.parent, steps);
                }
            } else {
                const uncle = z.parent.parent.left;
                if (uncle.color === 'RED') {
                    z.parent.color = 'BLACK'; uncle.color = 'BLACK'; z.parent.parent.color = 'RED'; z = z.parent.parent;
                } else {
                    if (z === z.parent.left) { z = z.parent; this.rightRotate(z, steps); }
                    z.parent.color = 'BLACK'; z.parent.parent.color = 'RED'; this.leftRotate(z.parent.parent, steps);
                }
            }
        }
        this.root.color = 'BLACK';
    }


    // --- DELETION LOGIC ---
    transplant(u, v) {
        if (u.parent === this.NIL) this.root = v;
        else if (u === u.parent.left) u.parent.left = v;
        else u.parent.right = v;
        v.parent = u.parent;
    }

    treeMinimum(node) {
        while (node.left !== this.NIL) node = node.left;
        return node;
    }

    findNode(key) {
        let node = this.root;
        while (node !== this.NIL && key !== node.key) {
            if (key < node.key) node = node.left;
            else node = node.right;
        }
        return node;
    }

    delete(key, steps) {
        const z = this.findNode(key);
        if (z === this.NIL) {
            steps.push({ tree: this.cloneTree(this.root), description: `未找到节点 ${key}，无法删除。`, isFinished: true });
            return;
        }

        steps.push({ tree: this.cloneTree(this.root), path: [z.key], description: `找到要删除的节点 ${key}。` });
        let y = z;
        let yOriginalColor = y.color;
        let x;

        if (z.left === this.NIL) {
            x = z.right;
            this.transplant(z, z.right);
        } else if (z.right === this.NIL) {
            x = z.left;
            this.transplant(z, z.left);
        } else {
            y = this.treeMinimum(z.right);
            yOriginalColor = y.color;
            x = y.right;
            if (y.parent === z) {
                x.parent = y;
            } else {
                this.transplant(y, y.right);
                y.right = z.right;
                y.right.parent = y;
            }
            this.transplant(z, y);
            y.left = z.left;
            y.left.parent = y;
            y.color = z.color;
        }

        steps.push({ tree: this.cloneTree(this.root), path: [x.key !== 'NIL' ? x.key : y.parent.key], description: `完成BST删除，现在检查是否需要修复。` });

        if (yOriginalColor === 'BLACK') {
            this.deleteFixup(x, steps);
        }
        steps.push({ tree: this.cloneTree(this.root), description: `删除操作完成。`, isFinished: true });
    }

    deleteFixup(x, steps) {
        while (x !== this.root && x.color === 'BLACK') {
            let w; // Sibling
            if (x === x.parent.left) {
                w = x.parent.right;
                steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复中... 当前节点 ${x.key}, 兄弟是 ${w.key}` });

                if (w.color === 'RED') { // Case 1
                    steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复 Case 1: 兄弟 ${w.key} 是红色。`, highlightedCodeBlock: 'del_fix_case1' });
                    w.color = 'BLACK';
                    x.parent.color = 'RED';
                    this.leftRotate(x.parent, steps);
                    w = x.parent.right;
                }
                if (w.left.color === 'BLACK' && w.right.color === 'BLACK') { // Case 2
                    steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复 Case 2: 兄弟 ${w.key} 是黑色，其子节点都是黑色。`, highlightedCodeBlock: 'del_fix_case2' });
                    w.color = 'RED';
                    x = x.parent;
                } else {
                    if (w.right.color === 'BLACK') { // Case 3
                        steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复 Case 3: 兄弟 ${w.key} 是黑色，近子节点是红色。`, highlightedCodeBlock: 'del_fix_case3' });
                        w.left.color = 'BLACK';
                        w.color = 'RED';
                        this.rightRotate(w, steps);
                        w = x.parent.right;
                    }
                    // Case 4
                    steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复 Case 4: 兄弟 ${w.key} 是黑色，远子节点是红色。`, highlightedCodeBlock: 'del_fix_case4' });
                    w.color = x.parent.color;
                    x.parent.color = 'BLACK';
                    w.right.color = 'BLACK';
                    this.leftRotate(x.parent, steps);
                    x = this.root;
                }
            } else { // Symmetric case
                w = x.parent.left;
                steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复中... 当前节点 ${x.key}, 兄弟是 ${w.key}` });

                if (w.color === 'RED') { // Case 1
                    steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复 Case 1: 兄弟 ${w.key} 是红色。`, highlightedCodeBlock: 'del_fix_case1' });
                    w.color = 'BLACK';
                    x.parent.color = 'RED';
                    this.rightRotate(x.parent, steps);
                    w = x.parent.left;
                }
                if (w.right.color === 'BLACK' && w.left.color === 'BLACK') { // Case 2
                    steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复 Case 2: 兄弟 ${w.key} 是黑色，其子节点都是黑色。`, highlightedCodeBlock: 'del_fix_case2' });
                    w.color = 'RED';
                    x = x.parent;
                } else {
                    if (w.left.color === 'BLACK') { // Case 3
                        steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复 Case 3: 兄弟 ${w.key} 是黑色，近子节点是红色。`, highlightedCodeBlock: 'del_fix_case3' });
                        w.right.color = 'BLACK';
                        w.color = 'RED';
                        this.leftRotate(w, steps);
                        w = x.parent.left;
                    }
                    // Case 4
                    steps.push({ tree: this.cloneTree(this.root), path: [x.key, w.key], description: `修复 Case 4: 兄弟 ${w.key} 是黑色，远子节点是红色。`, highlightedCodeBlock: 'del_fix_case4' });
                    w.color = x.parent.color;
                    x.parent.color = 'BLACK';
                    w.left.color = 'BLACK';
                    this.rightRotate(x.parent, steps);
                    x = this.root;
                }
            }
        }
        if (x) x.color = 'BLACK';
        steps.push({ tree: this.cloneTree(this.root), path: [x.key], description: `修复完成，将节点 ${x.key} 染黑。` });
    }
}


// --- Step Generation Wrapper ---
const generateRBTSteps = (keysToInsert, keyToDelete, operation, initialTree) => {
    const steps = [];
    const rbt = new RedBlackTree();

    if (operation === 'insert') {
        steps.push({ tree: null, path: [], description: "开始构建红黑树..." });
        for (const key of keysToInsert) {
            rbt.insert(key, steps);
            steps.push({ tree: rbt.cloneTree(rbt.root), path: [], description: `插入 ${key} 后修复完成。` });
        }
        steps.push({ tree: rbt.cloneTree(rbt.root), path: [], isFinished: true, description: "构建完成！" });
    } else if (operation === 'delete') {
        if (!initialTree) return { steps: [] };
        // This is a simplified way to reload the tree state. A robust solution might serialize/deserialize.
        const tempRbt = new RedBlackTree();
        const tempKeys = [];
        const inorderTraversal = (node) => {
            if (!node || node.key === 'NIL') return;
            inorderTraversal(node.left);
            tempKeys.push(node.key);
            inorderTraversal(node.right);
        }
        inorderTraversal(initialTree);
        for (const key of tempKeys) tempRbt.insert(key, []);
        rbt.root = tempRbt.root;

        steps.push({ tree: rbt.cloneTree(rbt.root), description: `准备删除节点 ${keyToDelete}...` });
        rbt.delete(keyToDelete, steps);
    }
    return { steps };
};


// ... (getTreeLayout, CodePanel, and other components remain largely the same, but CodePanel is updated)

// ================== 3. 子组件 ==================
const CodePanel = ({ isDeleteMode }) => {
    const insertBlocks = { /* ... from previous example ... */ };
    const deleteBlocks = {
        del_fix_case1: 'Case 1: 兄弟 w 是红色\n-> 翻转 w 和父节点颜色, 旋转父节点',
        del_fix_case2: 'Case 2: 兄弟 w 黑色, 其子节点全黑\n-> 将 w 染红, 问题上移',
        del_fix_case3: 'Case 3: 兄弟 w 黑色, 近子节点红\n-> 翻转 w 和子节点颜色, 旋转 w',
        del_fix_case4: 'Case 4: 兄弟 w 黑色, 远子节点红\n-> 翻转颜色, 旋转父节点, 结束',
        left_rotate: '左旋操作',
        right_rotate: '右旋操作',
    };
    const codeBlocks = isDeleteMode ? deleteBlocks : insertBlocks; // Simplified for this example
    const title = isDeleteMode ? "删除修复逻辑 (C-like)" : "插入修复逻辑 (C-like)";

    return (
        <div style={{ background: THEME.codeBg, borderRadius: 8, padding: '20px', border: `1px solid ${THEME.border}`, fontFamily: 'monospace', fontSize: 13, color: THEME.textSecondary, height: '100%' }}>
            <h4 style={{ marginTop: 0, marginBottom: 15, color: THEME.text }}>{title}</h4>
            {Object.entries(codeBlocks).map(([key, code]) => (
                <motion.div key={key} style={{ margin: '4px 0', padding: '6px 10px', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                    {code}
                </motion.div>
            ))}
        </div>
    );
};

// ... (The rest of the main component and styles need to be updated for the new workflow)
// ================== 4. 主组件 ==================
const RBTVisualizer = () => {
    const [arrayInput, setArrayInput] = useState('41, 38, 31, 12, 19, 8');
    const [deleteKeyInput, setDeleteKeyInput] = useState('38');
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [speed, setSpeed] = useState(1.0);
    const [isBuilt, setIsBuilt] = useState(false);
    const [finalTree, setFinalTree] = useState(null); // Store tree state after build
    const [operationMode, setOperationMode] = useState('insert');

    const keysToInsert = useMemo(() => arrayInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n)), [arrayInput]);
    const keyToDelete = useMemo(() => parseInt(deleteKeyInput.trim(), 10), [deleteKeyInput]);

    const currentStep = steps[currentStepIndex] || { tree: null, path: [], description: "准备就绪" };
    const layout = useMemo(() => getTreeLayout(currentStep.tree), [currentStep.tree]);
    const treeWidth = layout.nodes.reduce((max, node) => Math.max(max, node.x), 0) + 50;

    useEffect(() => {
        let timer;
        if (isAnimating && currentStepIndex < steps.length - 1) {
            timer = setTimeout(() => setCurrentStepIndex(i => i + 1), (2.2 - speed) * 1000);
        } else if (isAnimating) {
            setIsAnimating(false);
        }
        return () => clearTimeout(timer);
    }, [isAnimating, currentStepIndex, steps.length, speed]);

    const handleBuildTree = () => {
        setOperationMode('insert');
        const { steps } = generateRBTSteps(keysToInsert, null, 'insert');
        setSteps(steps);
        const finalStep = steps[steps.length - 1];
        if (finalStep) setFinalTree(finalStep.tree);
        setCurrentStepIndex(0);
        setIsAnimating(true);
        setIsBuilt(true);
    };

    const handleDelete = () => {
        if (isNaN(keyToDelete)) { alert("请输入有效的删除数字！"); return; }
        setOperationMode('delete');
        const { steps } = generateRBTSteps(null, keyToDelete, 'delete', finalTree);
        setSteps(steps);
        const finalStep = steps[steps.length - 1];
        if (finalStep) setFinalTree(finalStep.tree); // Update tree state after deletion
        setCurrentStepIndex(0);
        setIsAnimating(true);
    };

    const handleReset = () => {
        setIsAnimating(false); setSteps([]); setCurrentStepIndex(0);
        setIsBuilt(false); setFinalTree(null); setOperationMode('insert');
    };

    const handlePauseResume = () => setIsAnimating(prev => !prev);
    const handleStepChange = (delta) => {
        setIsAnimating(false);
        setCurrentStepIndex(i => Math.max(0, Math.min(steps.length - 1, i + delta)));
    };

    // ... ( getNodeStyle and other helpers are similar to previous example )
    const getNodeStyle = (node) => {
        const isCurrent = currentStep.path && currentStep.path.includes(node.value);
        const color = node.color === 'RED' ? THEME.nodeRed : THEME.nodeBlack;
        const borderColor = isCurrent ? THEME.nodeCurrent : color;
        return {
            borderColor, backgroundColor: color,
            color: node.color === 'RED' ? 'black' : 'white',
            boxShadow: isCurrent ? `0 0 15px ${THEME.nodeCurrent}` : 'none',
        };
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', gap: 15, background: THEME.bg, borderRadius: 12, padding: '24px', height: '90vh', color: THEME.text }}>
            <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 15, borderBottom: `1px solid ${THEME.border}`, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ marginRight: 'auto' }}>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>红黑树插入与删除演示</div>
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
                    <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'center', paddingTop: 20 }}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>删除数据</label>
                            <input type="text" value={deleteKeyInput} onChange={e => setDeleteKeyInput(e.target.value)} disabled={!isBuilt || isAnimating} style={{ ...inputStyle, width: 60 }} />
                        </div>
                        <button onClick={handleDelete} disabled={!isBuilt || isAnimating} style={{ ...btnStyle, background: THEME.nodeRed, color: '#fff' }}>删除</button>
                    </div>

                    <div style={{ flex: 1, position: 'relative', overflow: 'auto', paddingTop: '20px' }}>
                        <AnimatePresence>
                            {/* ... Layout and rendering logic ... */}
                        </AnimatePresence>
                    </div>
                </div>
                <div style={{ flex: 2, minWidth: 350 }}>
                    <CodePanel isDeleteMode={operationMode === 'delete'} />
                </div>
            </div>
        </div>
    );
}

// ... (Styles and other components)
export default RBTVisualizer;