import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ================== 1. 样式与主题配置 ==================
const THEME = {
    bg: '#0d1117',
    panel: '#161b22',
    border: '#30363d',
    nodeLeaf: '#1f6feb',
    nodeInternal: '#8957e5',
    nodeSelect: '#d29922',
    nodeMerged: '#2ea043',
    edge: '#484f58',
    edgeLabel: '#8b949e',
    text: '#c9d1d9',
    codeBg: '#0d1117',
    codeHighlight: 'rgba(56, 139, 253, 0.2)'
};
const NODE_R = 24;
const LEAF_SPACING = NODE_R * 3.5;

// ================== 2. 核心算法与布局逻辑 ==================
const calculateTreeLayout = (node, layout, leafPositions) => {
    if (!node) return layout;
    const levelHeight = 100;
    if (!node.left && !node.right) {
        const pos = leafPositions[node.id];
        layout[node.id] = { id: node.id, x: pos.x, y: pos.y, level: 0 };
        return layout;
    }
    calculateTreeLayout(node.left, layout, leafPositions);
    calculateTreeLayout(node.right, layout, leafPositions);
    const leftPos = layout[node.left.id];
    const rightPos = layout[node.right.id];
    if (!leftPos || !rightPos) return layout;
    const currentLevel = 1 + Math.max(leftPos.level, rightPos.level);
    layout[node.id] = { id: node.id, x: (leftPos.x + rightPos.x) / 2, y: Math.min(leftPos.y, rightPos.y) - levelHeight, level: currentLevel };
    return layout;
};

const generateHuffmanSteps = (initialForest) => {
    const steps = [];
    let nodeIdCounter = Math.max(0, ...initialForest.map(n => n.id)) + 1;
    let forest = initialForest.map(n => ({ ...n, left: null, right: null }));
    if (forest.length <= 1) {
        steps.push({ nodesInStep: forest, forest: [], tree: forest[0] || null, desc: "节点数不足，无法构建。", highlightedCodeBlock: 'done' });
        return { steps, finalTree: forest[0] || null };
    }
    steps.push({ nodesInStep: [...forest], forest: [...forest].sort((a, b) => a.freq - b.freq), selected: [], desc: "1. 森林初始化 (按权值排序)", highlightedCodeBlock: 'init' });
    let currentNodes = [...forest];
    while (forest.length > 1) {
        forest.sort((a, b) => a.freq - b.freq || a.id - b.id);
        const left = forest.shift();
        const right = forest.shift();
        steps.push({ nodesInStep: [...currentNodes], forest: [...forest], selected: [left.id, right.id], desc: `2. 选中权值最小的节点: ${left.freq} 和 ${right.freq}`, highlightedCodeBlock: 'select' });
        const parent = { id: nodeIdCounter++, char: null, freq: left.freq + right.freq, left, right };
        currentNodes.push(parent); // Add parent for the next step
        steps.push({ nodesInStep: [...currentNodes], forest: [...forest, parent].sort((a, b) => a.freq - b.freq), selected: [left.id, right.id], mergedNode: parent, desc: `3. 合并为新节点 (权值 ${parent.freq}) 并放回森林`, highlightedCodeBlock: 'merge' });
        currentNodes = currentNodes.filter(n => n.id !== left.id && n.id !== right.id);
        forest.push(parent);
    }
    const finalTree = forest[0];
    steps.push({ nodesInStep: flattenTree(finalTree), forest: [], tree: finalTree, selected: [], desc: "4. 构建完成", highlightedCodeBlock: 'done' });
    return { steps, finalTree };
};

const generateCodes = (tree) => {
    const codes = {};
    const traverse = (node, code) => {
        if (!node) return;
        if (node.char && !node.left && !node.right) {
            codes[node.char] = code || '0'; return;
        }
        traverse(node.left, code + '0');
        traverse(node.right, code + '1');
    };
    traverse(tree, '');
    return codes;
};

const flattenTree = (node) => {
    if (!node) return [];
    const nodes = [{ ...node, leftId: node.left?.id, rightId: node.right?.id }];
    return nodes.concat(flattenTree(node.left)).concat(flattenTree(node.right));
};

// ================== 3. 子组件 ==================
const CodePanel = ({ highlightedBlock }) => {
    const codeBlocks = {
        init: `// 1. 初始化
function Huffman(nodes) {
  let forest = [...nodes];
  forest.sort((a,b) => a.weight - b.weight);`,
        select: `  // 2. 循环构建
  while (forest.length > 1) {
    // 取出最小的两个
    const min1 = forest.shift();
    const min2 = forest.shift();`,
        merge: `    // 3. 合并并放回
    const parent = {
      weight: min1.weight + min2.weight,
      left: min1, right: min2
    };
    forest.push(parent);
    forest.sort((a,b) => a.weight - b.weight);
  }`,
        done: `  // 4. 结束
  return forest[0]; 
}`
    };
    return (
        <div style={{ background: THEME.codeBg, borderRadius: 8, padding: '15px', border: `1px solid ${THEME.border}`, fontFamily: 'monospace', fontSize: 13, color: '#8b949e', height: '100%', overflowY: 'auto' }}>
            <h4 style={{ marginTop: 0, color: THEME.text }}>算法伪代码</h4>
            {Object.entries(codeBlocks).map(([key, code]) => (
                <motion.div key={key} animate={{ backgroundColor: highlightedBlock === key ? THEME.codeHighlight : 'transparent' }} style={{ margin: 0, padding: '8px 10px', borderRadius: 5, transition: 'background-color 0.3s', whiteSpace: 'pre-wrap' }}>
                    {code}
                </motion.div>
            ))}
        </div>
    );
};

const EdgeWithLabel = ({ p1, p2, label, isVisible }) => {
    if (!p1 || !p2) return null;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: isVisible ? 1 : 0 }} transition={{ delay: 0.2 }}>
            <motion.line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={THEME.edge} strokeWidth={2}
                initial={{ pathLength: 0 }} animate={{ pathLength: isVisible ? 1 : 0 }}
            />
            <circle cx={midX} cy={midY} r={8} fill={THEME.bg} />
            <text x={midX} y={midY} dy=".35em" textAnchor="middle" fill={THEME.edgeLabel} fontSize={10} fontWeight="bold">{label}</text>
        </motion.g>
    )
}

// ================== 4. 主组件 ==================
const HuffmanTreeVisualizer = () => {
    const [nodes, setNodes] = useState([]);
    const [isEditing, setIsEditing] = useState(true);
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [steps, setSteps] = useState([]);
    const [curStepIdx, setCurStepIdx] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [finalTree, setFinalTree] = useState(null);
    const [finalCodes, setFinalCodes] = useState({});
    const [speed, setSpeed] = useState(1.0);
    const svgRef = useRef(null);

    const curStep = steps[curStepIdx] || { nodesInStep: [], forest: [], selected: [], desc: '双击节点编辑 | 左键空白处创建 | 右键删除', highlightedCodeBlock: null };
    const allTreeNodes = useMemo(() => finalTree ? flattenTree(finalTree) : [], [finalTree]);

    const allNodePositions = useMemo(() => {
        if (isEditing) {
            return Object.fromEntries(nodes.map(n => [n.id, { id: n.id, x: n.x, y: n.y }]));
        }
        if (!finalTree) return {};
        const leafNodes = allTreeNodes.filter(n => !n.left);
        const userNodesMap = new Map(nodes.map(n => [n.id, n]));
        leafNodes.sort((a, b) => (userNodesMap.get(a.id)?.x || 0) - (userNodesMap.get(b.id)?.x || 0));
        const baseLineY = 0;
        const totalWidth = (leafNodes.length - 1) * LEAF_SPACING;
        const startX = -totalWidth / 2;
        const cleanLeafPositions = {};
        leafNodes.forEach((leaf, index) => {
            cleanLeafPositions[leaf.id] = { id: leaf.id, x: startX + index * LEAF_SPACING, y: baseLineY };
        });
        const layout = {};
        calculateTreeLayout(finalTree, layout, cleanLeafPositions);
        return layout;
    }, [finalTree, allTreeNodes, nodes, isEditing]);

    const viewBox = useMemo(() => {
        const positions = Object.values(allNodePositions);
        if (positions.length === 0) return '0 0 800 500';
        const padding = 100;
        const xs = positions.map(p => p.x);
        const ys = positions.map(p => p.y);
        const minX = Math.min(...xs) - padding;
        const maxX = Math.max(...xs) + padding;
        const minY = Math.min(...ys) - padding;
        const maxY = Math.max(...ys) + padding;
        return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
    }, [allNodePositions]);

    const handleReset = () => {
        setIsEditing(true); setIsAnimating(false); setEditingNodeId(null);
        setNodes([]); setSteps([]); setCurStepIdx(0);
        setFinalTree(null); setFinalCodes({});
    };

    const handleStart = () => {
        if (nodes.length < 2) { alert("请至少创建两个节点！"); return; }
        setIsEditing(false); setEditingNodeId(null);
        if (steps.length > 0) { setIsAnimating(prev => !prev); return; }
        const { steps: generatedSteps, finalTree: tree } = generateHuffmanSteps(nodes);
        setSteps(generatedSteps); setFinalTree(tree);
        setFinalCodes(tree ? generateCodes(tree) : {});
        setCurStepIdx(0); setIsAnimating(true);
    };

    const handleCanvasClick = (e) => {
        if (!isEditing || e.target !== e.currentTarget) return;
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
        const newId = Date.now();
        const newNode = { id: newId, x, y, freq: 10, char: String.fromCharCode(65 + (nodes.length % 26)) };
        setNodes(prev => [...prev, newNode]);
        setEditingNodeId(newId);
    };

    const handleNodeValueChange = (id, field, value) => {
        setNodes(nodes.map(n => {
            if (n.id === id) {
                const updated = { ...n };
                if (field === 'freq') {
                    const newFreq = parseInt(value, 10);
                    updated.freq = isNaN(newFreq) || newFreq < 1 ? 1 : newFreq;
                } else {
                    updated.char = value.trim().slice(0, 1) || ' ';
                }
                return updated;
            }
            return n;
        }))
    };

    const handleNodeDrag = (e, info, nodeId) => {
        if (isAnimating) return;
        if (isEditing) {
            setNodes(prevNodes => prevNodes.map(n => {
                if (n.id === nodeId) {
                    return { ...n, x: n.x + info.delta.x, y: n.y + info.delta.y };
                }
                return n;
            }));
        }
    };

    const handleNodeDelete = (e, nodeId) => {
        e.preventDefault();
        if (!isEditing) return;
        setNodes(prev => prev.filter(n => n.id !== nodeId));
    };

    const handleStepChange = (delta) => {
        setIsAnimating(false);
        setCurStepIdx(s => Math.max(0, Math.min(steps.length - 1, s + delta)));
    };

    useEffect(() => {
        let timer;
        if (isAnimating && curStepIdx < steps.length - 1) {
            timer = setTimeout(() => {
                setCurStepIdx(c => c + 1);
            }, (2.2 - speed) * 1000);
        } else if (curStepIdx === steps.length - 1) {
            setIsAnimating(false);
        }
        return () => clearTimeout(timer);
    }, [isAnimating, curStepIdx, steps, speed]);

    const getNodeColor = (nodeId, isLeaf) => {
        if (curStep.selected && curStep.selected.includes(nodeId)) return THEME.nodeSelect;
        if (curStep.mergedNode?.id === nodeId) return THEME.nodeMerged;
        return isLeaf ? THEME.nodeLeaf : THEME.nodeInternal;
    };

    const nodesToRender = isEditing ? nodes : (curStep.nodesInStep || []);

    return (
        <div style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: 15, background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 20, height: '90vh', boxSizing: 'border-box' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${THEME.border}` }}>
                <div><h3 style={{ margin: 0, color: '#fff' }}>哈夫曼树构建演示</h3><p style={{ margin: '5px 0 0', fontSize: 13, color: THEME.text }}>{curStep.desc}</p></div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: 15 }}><span style={{ fontSize: 12, color: THEME.text, marginRight: 5 }}>速度</span><input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={e => setSpeed(e.target.value)} style={{ width: 80 }} /></div>
                    <button onClick={() => handleStepChange(-1)} disabled={steps.length === 0} style={btnStyle}>上一步</button>
                    <button onClick={() => handleStepChange(1)} disabled={steps.length === 0} style={btnStyle}>下一步</button>
                    <button onClick={handleStart} style={{ ...btnStyle, background: THEME.nodeMerged, border: 'none' }}>{steps.length > 0 ? (isAnimating ? '暂停' : '继续') : '开始构建'}</button>
                    <button onClick={handleReset} style={{ ...btnStyle, background: '#da3633', border: 'none' }}>重置</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div style={{ flex: 1, background: '#010409', borderRadius: 8, position: 'relative', overflow: 'hidden', border: `1px solid ${THEME.border}` }}>
                        {isEditing && (<div style={overlayTextStyle}>双击节点编辑 | 左键空白处创建 | 右键删除</div>)}
                        <svg ref={svgRef} width="100%" height="100%" viewBox={viewBox} onMouseDown={handleCanvasClick} onDoubleClick={() => setEditingNodeId(null)} style={{ cursor: isEditing ? 'crosshair' : 'default', touchAction: 'none' }}>
                            <AnimatePresence>
                                {!isEditing && nodesToRender.map(node => {
                                    const pos = allNodePositions[node.id];
                                    if (!pos) return null;
                                    return (
                                        <React.Fragment key={`edge-group-${node.id}`}>
                                            <EdgeWithLabel p1={pos} p2={allNodePositions[node.leftId]} label="0" isVisible={!!allNodePositions[node.leftId]} />
                                            <EdgeWithLabel p1={pos} p2={allNodePositions[node.rightId]} label="1" isVisible={!!allNodePositions[node.rightId]} />
                                        </React.Fragment>
                                    )
                                })}
                            </AnimatePresence>
                            <AnimatePresence>
                                {nodesToRender.map(node => {
                                    const pos = allNodePositions[node.id];
                                    if (!pos) return null;
                                    const isLeaf = !node.left && !node.right;
                                    return (
                                        <motion.g key={`node-g-${node.id}`}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ duration: 0.5, type: 'spring' }}
                                        >
                                            <motion.g onContextMenu={(e) => handleNodeDelete(e, node.id)} onDoubleClick={(e) => { e.stopPropagation(); if (isEditing) setEditingNodeId(node.id); }} drag={isEditing} onDrag={(e, i) => handleNodeDrag(e, i, node.id)} dragMomentum={false} whileHover={{ scale: 1.1 }} whileDrag={{ scale: 1.2, cursor: 'grabbing', zIndex: 10 }} style={{ cursor: isEditing ? 'grab' : 'default' }}>
                                                <circle r={NODE_R} fill={getNodeColor(node.id, isLeaf)} stroke="#fff" strokeWidth={2} />
                                                {isEditing && editingNodeId === node.id ? (
                                                    <foreignObject x={-NODE_R} y={-NODE_R} width={NODE_R * 2} height={NODE_R * 2} onMouseDown={e => e.stopPropagation()}>
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                                            <input type="text" value={node.char} onChange={e => handleNodeValueChange(node.id, 'char', e.target.value)} style={inlineInputStyle} autoFocus onFocus={e => e.target.select()} />
                                                            <input type="number" value={node.freq} onChange={e => handleNodeValueChange(node.id, 'freq', e.target.value)} style={{ ...inlineInputStyle, fontSize: 10 }} />
                                                        </div>
                                                    </foreignObject>
                                                ) : (
                                                    <>
                                                        <text dy=".35em" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize={14} pointerEvents="none">{isLeaf ? node.char : node.freq}</text>
                                                        {isLeaf && <text dy="2.2em" textAnchor="middle" fill={THEME.text} fontSize={10} pointerEvents="none">w:{node.freq}</text>}
                                                        {!isLeaf && <text dy="-1.8em" textAnchor="middle" fill={THEME.text} fontSize={10} pointerEvents="none">sum</text>}
                                                    </>
                                                )}
                                            </motion.g>
                                        </motion.g>
                                    );
                                })}
                            </AnimatePresence>
                        </svg>
                    </div>
                    <div style={{ height: '100px', background: THEME.panel, borderRadius: 8, padding: '10px 15px', border: `1px solid ${THEME.border}`, overflowY: 'auto' }}>
                        <h4 style={{ marginTop: 0, color: THEME.text, fontSize: 13 }}>
                            {curStep.tree ? "哈夫曼编码表" : "当前森林 (优先队列)"}
                        </h4>
                        {curStep.tree ? (
                            <table style={{ width: '100%', color: THEME.text, fontSize: 13, borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${THEME.border}`, textAlign: 'left' }}>
                                        <th style={{ padding: 5 }}>字符</th>
                                        <th style={{ padding: 5 }}>权重</th>
                                        <th style={{ padding: 5 }}>编码</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(finalCodes).sort().map(([char, code]) => {
                                        const node = nodes.find(n => n.char === char);
                                        return (
                                            <tr key={char}>
                                                <td style={{ padding: 5 }}>{char}</td>
                                                <td style={{ padding: 5 }}>{node?.freq}</td>
                                                <td style={{ padding: 5, fontFamily: 'monospace', color: THEME.nodeMerged }}>{code}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                <AnimatePresence>
                                    {curStep.forest && [...curStep.forest].sort((a, b) => a.freq - b.freq).map(node => (
                                        <motion.div
                                            key={`forest-${node.id}`} layout
                                            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                                            style={{
                                                padding: '4px 8px', borderRadius: 4, fontSize: 12,
                                                background: getNodeColor(node.id, !node.left),
                                                color: '#fff', border: `1px solid ${THEME.border}`
                                            }}
                                        >
                                            {!node.left ? node.char : 'Sum'}:{node.freq}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {curStep.forest?.length === 0 && <div style={{ fontSize: 12, color: '#666' }}>空</div>}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ flex: 1.2, minWidth: 300 }}>
                    <CodePanel highlightedBlock={curStep.highlightedCodeBlock} />
                </div>
            </div>
        </div>
    );
};

const btnStyle = { background: THEME.panel, color: '#c9d1d9', border: `1px solid ${THEME.border}`, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, transition: '0.2s' };
const overlayTextStyle = { position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', color: '#666', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: 6, pointerEvents: 'none', zIndex: 20, fontSize: '12px', whiteSpace: 'nowrap' };
const inlineInputStyle = { background: 'transparent', border: 'none', color: '#fff', textAlign: 'center', width: '80%', margin: 0, padding: 0, outline: 'none', fontSize: 14, fontWeight: 'bold' };

export default HuffmanTreeVisualizer;