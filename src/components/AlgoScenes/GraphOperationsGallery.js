import React, { useState } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import GraphStorageVisualizer from './GraphStorageVisualizer';

// ================== 代码片段 ==================
const CODES = {
  matrixAddEdge: `// 邻接矩阵添加边 (x, y)
void AddEdge(int x, int y) {
    // 1. 检查边是否已存在
    if (Edge[x][y] == 1) return;
    
    // 2. 标记对应格子为 1
    Edge[x][y] = 1;
    // 无向图还需要标记对称点
    Edge[y][x] = 1; 
}`,

  matrixDelVertex: `// 邻接矩阵删除顶点 x
void DeleteVertex(int x) {
    // 1. 将 x 行/列清零 (逻辑删除)
    // 2. 真正删除需要移动数组元素：
    //    将 x 之后的行上移
    //    将 x 之后的列左移
    // 时间复杂度 O(|V|^2) 或 O(|V|)
}`,

  listAddEdge: `// 邻接表添加边 (x, y)
void AddEdge(Node *adjList[], int x, int y) {
    // 1. 创建新边节点
    EdgeNode *s = new EdgeNode(y);
    
    // 2. 头插法插入 x 的边表
    s->next = adjList[x]->next;
    adjList[x]->next = s;
    // (无向图同理处理 y 的边表)
}`,

  listDelVertex: `// 邻接表删除顶点 x
void DeleteVertex(int x) {
    // 1. 删除 x 的整个出边链表
    freeList(adjList[x]);
    
    // 2. 【重点】遍历所有其他顶点 i
    for (int i = 0; i < V; i++) {
        // 在 i 的链表中寻找指向 x 的边并删除
        deleteEdgeRef(adjList[i], x);
    }
    // 时间复杂度 O(|E|)
}`
};

// ================== 1. 矩阵演示数据 ==================
const MATRIX_INIT = {
  nodes: ['A', 'B', 'C', 'D'],
  matrix: [
    [0, 1, 0, 0],
    [1, 0, 1, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 0]
  ]
};

const SCENE_MATRIX_ADD_EDGE = [
  {
    line: 1, desc: "初始状态：A-B, B-C。现在我们要添加边 (A, D)。",
    data: { mode: 'matrix', ...MATRIX_INIT, highlights: {} }
  },
  {
    line: 4, desc: "定位到 Edge[0][3] (即 A行 D列)。",
    data: { mode: 'matrix', ...MATRIX_INIT, highlights: { row: 0, col: 3 } }
  },
  {
    line: 7, desc: "将 Edge[0][3] 设为 1。",
    data: {
      mode: 'matrix', nodes: ['A','B','C','D'],
      matrix: [[0,1,0,1],[1,0,1,0],[0,1,0,0],[0,0,0,0]], // A->D
      highlights: { row: 0, col: 3 }
    }
  },
  {
    line: 9, desc: "无向图需对称：将 Edge[3][0] 也设为 1。",
    data: {
      mode: 'matrix', nodes: ['A','B','C','D'],
      matrix: [[0,1,0,1],[1,0,1,0],[0,1,0,0],[1,0,0,0]], // D->A
      highlights: { row: 3, col: 0 }
    }
  }
];

const SCENE_MATRIX_DEL_VERTEX = [
  {
    line: 1, desc: "初始状态。现在我们要删除顶点 B (下标 1)。",
    data: { mode: 'matrix', ...MATRIX_INIT, highlights: {} }
  },
  {
    line: 4, desc: "第一步：清除 B 相关的行和列 (变灰无效化)。",
    data: {
      mode: 'matrix', nodes: ['A','B','C','D'],
      matrix: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], // 视觉模拟
      highlights: { row: 1 } // 仅标记
    }
  },
  {
    line: 6, desc: "第二步：搬移数据。C, D 的行向上移动，列向左移动以填补空缺。",
    data: {
      mode: 'matrix', nodes: ['A', 'C', 'D'], // B 没了
      matrix: [
        [0, 0, 0], // A (原A行，删了B列)
        [0, 0, 0], // C (原C行上移，删B列)
        [0, 0, 0]  // D (原D行上移)
      ],
      highlights: {}
    }
  }
];

// ================== 2. 邻接表演示数据 ==================
const LIST_INIT = {
  adjList: [
    { id: 'A', edges: ['B'] },
    { id: 'B', edges: ['A', 'C'] },
    { id: 'C', edges: ['B', 'D'] },
    { id: 'D', edges: ['C'] }
  ]
};

const SCENE_LIST_ADD_EDGE = [
  {
    line: 1, desc: "初始状态。添加边 (A, C)。",
    data: { mode: 'list', ...LIST_INIT }
  },
  {
    line: 5, desc: "定位到顶点 A 的边表。",
    data: { mode: 'list', ...LIST_INIT, highlights: { scanRow: 0 } }
  },
  {
    line: 9, desc: "头插法：创建节点 C，插入到 A 的 next 指针处。",
    data: {
      mode: 'list',
      adjList: [
        { id: 'A', edges: ['C', 'B'] }, // C 插在前面
        LIST_INIT.adjList[1], LIST_INIT.adjList[2], LIST_INIT.adjList[3]
      ],
      highlights: { scanRow: 0, target: 'C' }
    }
  }
];

// 删除顶点是最复杂的，需要遍历整个数组
const SCENE_LIST_DEL_VERTEX = [
  {
    line: 1, desc: "删除顶点 C。首先删除 C 自己的边表 (Row 2)。",
    data: { mode: 'list', ...LIST_INIT, highlights: { scanRow: 2 } }
  },
  {
    line: 5, desc: "C 的边表已释放。现在需要遍历其他所有顶点，删掉指向 C 的边。",
    data: {
      mode: 'list',
      adjList: [
        LIST_INIT.adjList[0], LIST_INIT.adjList[1],
        { id: 'C', edges: [] }, // C 空了
        LIST_INIT.adjList[3]
      ],
      highlights: { scanRow: 2 }
    }
  },
  {
    line: 10, desc: "检查 A 的边表... 没有 C。",
    data: {
      mode: 'list',
      adjList: [
        { id: 'A', edges: ['B'] }, LIST_INIT.adjList[1], { id: 'C', edges: [] }, LIST_INIT.adjList[3]
      ],
      highlights: { scanRow: 0 }
    }
  },
  {
    line: 10, desc: "检查 B 的边表... 发现 C！删除它。",
    data: {
      mode: 'list',
      adjList: [
        { id: 'A', edges: ['B'] },
        { id: 'B', edges: ['A'] }, // C 删除了
        { id: 'C', edges: [] }, LIST_INIT.adjList[3]
      ],
      highlights: { scanRow: 1, target: 'C' }
    }
  },
  {
    line: 10, desc: "检查 D 的边表... 发现 C！删除它。",
    data: {
      mode: 'list',
      adjList: [
        { id: 'A', edges: ['B'] }, { id: 'B', edges: ['A'] }, { id: 'C', edges: [] },
        { id: 'D', edges: [] } // C 删除了
      ],
      highlights: { scanRow: 3, target: 'C' }
    }
  },
  {
    line: 12, desc: "最后将 C 节点从数组中移除 (搬移数组)。",
    data: {
      mode: 'list',
      adjList: [
        { id: 'A', edges: ['B'] }, { id: 'B', edges: ['A'] }, { id: 'D', edges: [] }
      ],
      highlights: {}
    }
  }
];

// ================== 总控组件 ==================
const SCENES = {
  'matrix-add': { title: '邻接矩阵 - 加边', frames: SCENE_MATRIX_ADD_EDGE, code: CODES.matrixAddEdge },
  'matrix-del': { title: '邻接矩阵 - 删点', frames: SCENE_MATRIX_DEL_VERTEX, code: CODES.matrixDelVertex },
  'list-add': { title: '邻接表 - 加边', frames: SCENE_LIST_ADD_EDGE, code: CODES.listAddEdge },
  'list-del': { title: '邻接表 - 删点', frames: SCENE_LIST_DEL_VERTEX, code: CODES.listDelVertex },
};

const GraphOperationsGallery = () => {
  const [activeKey, setActiveKey] = useState('matrix-add');
  const scene = SCENES[activeKey];

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(SCENES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveKey(key)}
            style={{
              padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeKey === key ? '#2ea043' : '#21262d',
              color: activeKey === key ? '#fff' : '#c9d1d9', fontWeight: 'bold'
            }}
          >
            {config.title}
          </button>
        ))}
      </div>

      <AlgoPlayer
        key={activeKey}
        frames={scene.frames}
        code={scene.code}
        Visualizer={GraphStorageVisualizer}
      />
    </div>
  );
};

export default GraphOperationsGallery;