import React, { useState } from 'react';
import TreeStorageVisualizer from './TreeStorageVisualizer';

// ================== 公共逻辑数据 (用于左侧对照) ==================
// 树：R -> (A, B); A -> (C, D); B -> (E)
const LOGIC_TREE_NODES = [
  { id: 'R', val: 'R', x: 150, y: 30 },
  { id: 'A', val: 'A', x: 80, y: 100 }, { id: 'B', val: 'B', x: 220, y: 100 },
  { id: 'C', val: 'C', x: 40, y: 180 }, { id: 'D', val: 'D', x: 120, y: 180 }, { id: 'E', val: 'E', x: 220, y: 180 }
];
const LOGIC_TREE_LINKS = [
  { source: 'R', target: 'A' }, { source: 'R', target: 'B' },
  { source: 'A', target: 'C' }, { source: 'A', target: 'D' }, { source: 'B', target: 'E' }
];

// 森林：树1(R1->A,B) + 树2(R2->C)
const LOGIC_FOREST_NODES = [
  { id: 'R1', val: 'R1', x: 100, y: 30 }, { id: 'A', val: 'A', x: 60, y: 100 }, { id: 'B', val: 'B', x: 140, y: 100 },
  { id: 'R2', val: 'R2', x: 220, y: 30 }, { id: 'C', val: 'C', x: 220, y: 100 }
];
const LOGIC_FOREST_LINKS = [
  { source: 'R1', target: 'A' }, { source: 'R1', target: 'B' },
  { source: 'R2', target: 'C' }
];

// ================== 1 & 2. 双亲表示法数据 ==================
const DATA_PARENT_TREE = {
  logicNodes: LOGIC_TREE_NODES, logicLinks: LOGIC_TREE_LINKS,
  storage: [
    { idx: 0, data: 'R', parent: -1 },
    { idx: 1, data: 'A', parent: 0 },
    { idx: 2, data: 'B', parent: 0 },
    { idx: 3, data: 'C', parent: 1 },
    { idx: 4, data: 'D', parent: 1 },
    { idx: 5, data: 'E', parent: 2 },
  ]
};

const DATA_PARENT_FOREST = {
  logicNodes: LOGIC_FOREST_NODES, logicLinks: LOGIC_FOREST_LINKS,
  storage: [
    { idx: 0, data: 'R1', parent: -1 }, // 根1
    { idx: 1, data: 'A', parent: 0 },
    { idx: 2, data: 'B', parent: 0 },
    { idx: 3, data: 'R2', parent: -1 }, // 根2，也是 -1
    { idx: 4, data: 'C', parent: 3 },
  ]
};

// ================== 3 & 4. 孩子表示法数据 ==================
const DATA_CHILD_TREE = {
  logicNodes: LOGIC_TREE_NODES, logicLinks: LOGIC_TREE_LINKS,
  storage: [
    { idx: 0, data: 'R', children: [1, 2] },
    { idx: 1, data: 'A', children: [3, 4] },
    { idx: 2, data: 'B', children: [5] },
    { idx: 3, data: 'C', children: [] },
    { idx: 4, data: 'D', children: [] },
    { idx: 5, data: 'E', children: [] },
  ]
};

const DATA_CHILD_FOREST = {
  logicNodes: LOGIC_FOREST_NODES, logicLinks: LOGIC_FOREST_LINKS,
  storage: [
    { idx: 0, data: 'R1', children: [1, 2] },
    { idx: 1, data: 'A', children: [] },
    { idx: 2, data: 'B', children: [] },
    { idx: 3, data: 'R2', children: [4] },
    { idx: 4, data: 'C', children: [] },
  ]
};

// ================== 5 & 6. 孩子兄弟表示法 (二叉链表) ==================
// 树转二叉：R左->A, A右->B; A左->C, C右->D; B左->E
const DATA_CS_TREE = {
  nodes: [
    { id: 'R', val: 'R', x: 300, y: 30 },
    { id: 'A', val: 'A', x: 200, y: 100 },
    { id: 'B', val: 'B', x: 350, y: 150 }, // A的右兄
    { id: 'C', val: 'C', x: 150, y: 170 }, // A的左孩
    { id: 'D', val: 'D', x: 250, y: 220 }, // C的右兄
    { id: 'E', val: 'E', x: 300, y: 220 }, // B的左孩
  ],
  links: [
    { source: 'R', target: 'A', type: 'child' },
    { source: 'A', target: 'B', type: 'sibling' },
    { source: 'A', target: 'C', type: 'child' },
    { source: 'C', target: 'D', type: 'sibling' },
    { source: 'B', target: 'E', type: 'child' },
  ]
};

// 森林转二叉：R1右兄->R2. R1左孩->A, A右兄->B. R2左孩->C.
const DATA_CS_FOREST = {
  nodes: [
    { id: 'R1', val: 'R1', x: 200, y: 50 },
    { id: 'R2', val: 'R2', x: 400, y: 100 }, // R1的右兄
    { id: 'A', val: 'A', x: 150, y: 130 },   // R1的左孩
    { id: 'B', val: 'B', x: 250, y: 180 },   // A的右兄
    { id: 'C', val: 'C', x: 350, y: 180 },   // R2的左孩
  ],
  links: [
    { source: 'R1', target: 'R2', type: 'sibling' }, // 森林的关键：根连根
    { source: 'R1', target: 'A', type: 'child' },
    { source: 'A', target: 'B', type: 'sibling' },
    { source: 'R2', target: 'C', type: 'child' },
  ]
};

const SCENES = {
  'parent-tree': { title: '1. 双亲表示法 (树)', mode: 'parent', data: DATA_PARENT_TREE },
  'parent-forest': { title: '2. 双亲表示法 (森林)', mode: 'parent', data: DATA_PARENT_FOREST },
  'child-tree': { title: '3. 孩子表示法 (树)', mode: 'child', data: DATA_CHILD_TREE },
  'child-forest': { title: '4. 孩子表示法 (森林)', mode: 'child', data: DATA_CHILD_FOREST },
  'cs-tree': { title: '5. 孩子兄弟法 (树)', mode: 'cs', data: DATA_CS_TREE },
  'cs-forest': { title: '6. 孩子兄弟法 (森林)', mode: 'cs', data: DATA_CS_FOREST },
};

const TreeStorageGallery = () => {
  const [activeTab, setActiveTab] = useState('parent-tree');
  const scene = SCENES[activeTab];

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {Object.entries(SCENES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: 13,
              backgroundColor: activeTab === key ? '#1f6feb' : '#21262d',
              color: activeTab === key ? '#fff' : '#c9d1d9', transition: '0.2s'
            }}
          >
            {config.title.split(' ')[1]}
          </button>
        ))}
      </div>

      <div style={{ border: '1px solid #30363d', borderRadius: 8, padding: 10, background: '#0d1117' }}>
        <h3 style={{ margin: '0 0 10px 10px', fontSize: 16 }}>{scene.title}</h3>
        <TreeStorageVisualizer key={activeTab} mode={scene.mode} data={scene.data} />
      </div>
    </div>
  );
};

export default TreeStorageGallery;