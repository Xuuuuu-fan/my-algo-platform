import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================= 样式与配置 =================
const THEME = {
    bg: '#0f172a',
    panel: '#1e293b',
    text: '#e2e8f0',
    accent: '#3b82f6', // 蓝色
    highlight: '#eab308', // 黄色 (高亮当前操作节点)
    codeBg: '#020617',
    codeHighlight: 'rgba(59, 130, 246, 0.2)',
    nodeBase: '#475569',
    nodeInternal: '#64748b'
};

// 模拟 C++ 代码逻辑
const CODE_LINES = [
    "// 贪心策略：每次合并频率最小的两个节点",
    "void huffman() {",
    "  while (pq.size() > 1) {",
    "    Node* left = pq.top(); pq.pop();",
    "    Node* right = pq.top(); pq.pop();",
    "    Node* parent = new Node(left->w + right->w);",
    "    parent->left = left;",
    "    parent->right = right;",
    "    pq.push(parent);",
    "  }",
    "}"
];

// ================= 子组件：递归渲染树节点 =================
const TreeNode = ({ node, isRoot = true }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 4px' }}>
            {/* 节点本体 */}
            <motion.div
                layoutId={node.id} // 关键：Framer Motion 自动处理位置过渡
                initial={{ scale: 0 }}
                animate={{
                    scale: 1,
                    backgroundColor: node.status === 'active' ? THEME.highlight : (node.char ? THEME.accent : THEME.nodeInternal),
                    boxShadow: node.status === 'active' ? '0 0 15px #eab308' : 'none'
                }}
                transition={{ type: "spring", stiffness: 120 }}
                style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    color: '#fff', fontSize: '12px', fontWeight: 'bold',
                    position: 'relative', zIndex: 10,
                    border: '2px solid rgba(255,255,255,0.2)'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                    <span style={{ fontSize: '10px', opacity: 0.8 }}>{node.char || '#'}</span>
                    <span>{node.val}</span>
                </div>
            </motion.div>

            {/* 递归渲染子节点 */}
            {(node.left || node.right) && (
                <div style={{ display: 'flex', marginTop: '20px', position: 'relative' }}>
                    {/* 连线 (简单的 SVG 绘制) */}
                    <svg style={{ position: 'absolute', top: '-20px', left: 0, width: '100%', height: '20px', pointerEvents: 'none', zIndex: 0 }}>
                        {node.left && <line x1="50%" y1="0" x2="25%" y2="100%" stroke="#64748b" strokeWidth="2" />}
                        {node.right && <line x1="50%" y1="0" x2="75%" y2="100%" stroke="#64748b" strokeWidth="2" />}
                    </svg>

                    <div style={{ marginRight: '4px' }}>{node.left && <TreeNode node={node.left} isRoot={false} />}</div>
                    <div style={{ marginLeft: '4px' }}>{node.right && <TreeNode node={node.right} isRoot={false} />}</div>
                </div>
            )}
        </div>
    );
};

// ================= 主组件 =================
const HuffmanVis = () => {
    // --- 状态 ---
    // Forest 存储当前的树集合（初始是所有叶子，最后剩一个根）
    const [forest, setForest] = useState([
        { id: 'a', char: 'a', val: 5, status: 'idle' },
        { id: 'b', char: 'b', val: 2, status: 'idle' },
        { id: 'c', char: 'c', val: 9, status: 'idle' },
        { id: 'd', char: 'd', val: 4, status: 'idle' },
    ]);

    const [inputChar, setInputChar] = useState('');
    const [inputVal, setInputVal] = useState('');
    const [activeLine, setActiveLine] = useState(-1); // 当前高亮代码行
    const [isRunning, setIsRunning] = useState(false);
    const [log, setLog] = useState("准备就绪。");

    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // --- 辅助函数 ---
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 核心算法逻辑 ---
    const runAlgorithm = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setActiveLine(1); // void huffman()
        setLog("算法开始...");

        // 深拷贝一份 forest 用于操作
        let currentForest = JSON.parse(JSON.stringify(forest));

        // 预处理：给每个节点分配唯一ID（防止React Key冲突）如果不带ID
        currentForest = currentForest.map((n, i) => ({ ...n, id: n.id || `node-${Date.now()}-${i}` }));
        setForest(currentForest);
        await wait(800);

        while (currentForest.length > 1) {
            if (!isMounted.current) return;

            setActiveLine(2); // while check
            setLog(`当前森林有 ${currentForest.length} 棵树，继续合并。`);
            await wait(800);

            // 1. 模拟优先队列：排序
            setLog("🔍 在优先队列中寻找频率最小的两个节点...");
            currentForest.sort((a, b) => a.val - b.val);
            setForest([...currentForest]); // 触发重排动画
            await wait(1000);

            // 2. 取出最小的两个
            const left = currentForest[0];
            const right = currentForest[1];

            // 高亮选中
            setActiveLine(3); // pop left
            left.status = 'active';
            setForest([...currentForest]);
            setLog(`找到最小节点: [${left.char || '组合'}: ${left.val}]`);
            await wait(800);

            setActiveLine(4); // pop right
            right.status = 'active';
            setForest([...currentForest]);
            setLog(`找到次小节点: [${right.char || '组合'}: ${right.val}]`);
            await wait(800);

            // 3. 移除这两个节点
            const remaining = currentForest.slice(2);

            // 4. 创建父节点
            setActiveLine(5); // new Node
            const newNode = {
                id: `group-${left.id}-${right.id}`,
                val: left.val + right.val,
                char: null, // 内部节点没有字符
                left: { ...left, status: 'idle' }, // 放入内部后取消高亮
                right: { ...right, status: 'idle' },
                status: 'active' // 新生节点高亮一下
            };
            setLog(`🛠️ 合并生成新节点: 权重 ${left.val} + ${right.val} = ${newNode.val}`);
            await wait(1000);

            setActiveLine(6); // parent->left
            setActiveLine(7); // parent->right
            await wait(200);

            // 5. 插入回队列
            setActiveLine(8); // push
            currentForest = [...remaining, newNode];
            setForest(currentForest);
            await wait(1000);

            // 取消高亮
            newNode.status = 'idle';
            setForest([...currentForest]);
        }

        setActiveLine(10); // end
        setLog("🎉 构建完成！森林中只剩一棵树，即为哈夫曼树。");
        setIsRunning(false);
    };

    // --- 交互操作 ---
    const addNode = () => {
        if (!inputChar || !inputVal) return;
        const val = parseInt(inputVal);
        if (isNaN(val)) return;

        setForest([...forest, {
            id: `leaf-${Date.now()}`,
            char: inputChar,
            val: val,
            status: 'idle'
        }]);
        setInputChar('');
        setInputVal('');
    };

    const reset = () => {
        setIsRunning(false);
        setActiveLine(-1);
        setForest([
            { id: 'a', char: 'a', val: 5, status: 'idle' },
            { id: 'b', char: 'b', val: 2, status: 'idle' },
            { id: 'c', char: 'c', val: 9, status: 'idle' },
            { id: 'd', char: 'd', val: 4, status: 'idle' },
        ]);
        setLog("已重置");
    };

    return (
        <div style={{
            background: THEME.bg, color: THEME.text, padding: '20px', borderRadius: '12px',
            fontFamily: "'Inter', sans-serif", border: '1px solid #334155', maxWidth: '900px', margin: '0 auto'
        }}>
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, color: THEME.accent }}>Huffman Coding Visualizer</h2>
                <p style={{ margin: '5px 0 0', opacity: 0.7, fontSize: '14px' }}>
                    贪心策略：构建最优二叉树，用于数据压缩。
                </p>
            </div>

            {/* 控制栏 */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '5px', background: THEME.panel, padding: '5px 10px', borderRadius: '6px', alignItems: 'center' }}>
                    <input
                        placeholder="字符"
                        value={inputChar}
                        onChange={e => setInputChar(e.target.value)}
                        style={{ ...inputStyle, width: '40px' }}
                        maxLength={1}
                    />
                    <span style={{ opacity: 0.5 }}>:</span>
                    <input
                        placeholder="频率"
                        type="number"
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        style={{ ...inputStyle, width: '50px' }}
                    />
                    <button onClick={addNode} style={btnStyleSecondary}>+</button>
                </div>
                <div style={{ flex: 1 }}></div>
                <button onClick={reset} disabled={isRunning} style={btnStyleSecondary}>↺ 重置</button>
                <button onClick={runAlgorithm} disabled={isRunning} style={btnStylePrimary}>▶ 开始构建</button>
            </div>

            {/* 主视图区域：分左右两栏 */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

                {/* 左侧：森林/树可视区域 */}
                <div style={{
                    background: '#020617', borderRadius: '8px', minHeight: '400px', padding: '20px',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'auto',
                    border: '1px solid #334155', position: 'relative'
                }}>
                    {/* 绝对定位的提示文字 */}
                    <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '12px', color: '#64748b' }}>
                        优先队列 (Priority Queue) / 森林
                    </div>

                    {/* 渲染森林中的每一棵树 */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', paddingBottom: '20px' }}>
                        <AnimatePresence>
                            {forest.map((node) => (
                                <motion.div
                                    key={node.id}
                                    layout // 开启布局动画，让重排丝般顺滑
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <TreeNode node={node} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* 右侧：代码 & 日志 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* 代码高亮区 */}
                    <div style={{
                        background: THEME.codeBg, padding: '15px', borderRadius: '8px',
                        fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6',
                        border: '1px solid #334155', overflow: 'hidden'
                    }}>
                        {CODE_LINES.map((line, idx) => (
                            <div
                                key={idx}
                                style={{
                                    backgroundColor: idx === activeLine ? THEME.codeHighlight : 'transparent',
                                    color: idx === activeLine ? '#fff' : '#64748b',
                                    paddingLeft: '5px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                {line}
                            </div>
                        ))}
                    </div>

                    {/* 日志区 */}
                    <div style={{
                        background: THEME.panel, padding: '10px', borderRadius: '8px', flex: 1,
                        borderLeft: `3px solid ${THEME.accent}`, fontSize: '13px', color: '#cbd5e1'
                    }}>
                        <strong>系统消息:</strong><br />
                        {log}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CSS Styles ---
const inputStyle = {
    background: 'transparent', border: 'none', color: '#fff', textAlign: 'center', outline: 'none', fontFamily: 'inherit'
};
const btnStylePrimary = {
    padding: '8px 16px', background: THEME.accent, color: '#fff', border: 'none', borderRadius: '6px',
    cursor: 'pointer', fontWeight: 'bold'
};
const btnStyleSecondary = {
    padding: '8px 12px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer'
};

export default HuffmanVis;