import React, { useState } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import StringStorageVisualizer from './StringStorageVisualizer';

// ================== 1. 顺序存储数据 (SString) ==================
const CODE_SEQ = `// 定长顺序存储
#define MAXSIZE 255
typedef struct {
    char ch[MAXSIZE]; // 静态数组
    int length;       // 当前长度
} SString;`;

// 辅助：生成空数组
const createEmptyCells = (len) => Array(10).fill({ val: '' });

const SCENE_SEQ = [
  {
    line: 3,
    desc: "初始化空串：申请固定大小数组 (MAXSIZE)，长度为 0。",
    data: {
      type: 'seq',
      length: 0,
      cells: createEmptyCells(10)
    }
  },
  {
    line: 3,
    desc: "赋值 S = 'Data'。字符依次填入，占用前 4 个位置。",
    data: {
      type: 'seq',
      length: 4,
      cells: [
        { val: 'D' }, { val: 'a' }, { val: 't' }, { val: 'a' },
        { val: '' }, { val: '' }, { val: '' }, { val: '' }, { val: '' }, { val: '' }
      ]
    }
  },
  {
    line: 4,
    desc: "更新 length 属性为 4。注意后面仍有大量空闲空间被浪费。",
    data: {
      type: 'seq',
      length: 4,
      cells: [
        { val: 'D' }, { val: 'a' }, { val: 't' }, { val: 'a' },
        { val: '' }, { val: '' }, { val: '' }, { val: '' }, { val: '' }, { val: '' }
      ]
    }
  },
  {
    line: 3,
    desc: "修改 S = 'Structure'。覆盖原有数据，长度增加。",
    data: {
      type: 'seq',
      length: 9,
      cells: [
        { val: 'S' }, { val: 't' }, { val: 'r' }, { val: 'u' }, { val: 'c' },
        { val: 't' }, { val: 'u' }, { val: 'r' }, { val: 'e' }, { val: '' }
      ]
    }
  }
];

// ================== 2. 链式存储数据 (Chunked) ==================
const CODE_LINK = `// 块链存储 (Chunked)
#define CHUNKSIZE 4
typedef struct Chunk {
    char ch[CHUNKSIZE]; // 数据域存多个字符
    struct Chunk *next; // 指针域
} Chunk;
typedef struct {
    Chunk *head, *tail; // 串的头尾指针
    int len;
} LString;`;

const SCENE_LINK = [
  {
    line: 3,
    desc: "存储字符串 'Algorithm'。定义块大小 CHUNKSIZE = 4。",
    data: {
      type: 'link',
      chunkSize: 4,
      nodes: []
    }
  },
  {
    line: 4,
    desc: "分配第 1 个结点：存入前 4 个字符 'Algo'。",
    data: {
      type: 'link',
      chunkSize: 4,
      nodes: [
        { id: 1, chars: ['A', 'l', 'g', 'o'] }
      ]
    }
  },
  {
    line: 5,
    desc: "分配第 2 个结点：next 指向新块，存入 'rith'。",
    data: {
      type: 'link',
      chunkSize: 4,
      nodes: [
        { id: 1, chars: ['A', 'l', 'g', 'o'] },
        { id: 2, chars: ['r', 'i', 't', 'h'] }
      ]
    }
  },
  {
    line: 4,
    desc: "分配第 3 个结点：存入剩余字符 'm'。关键点：未满部分用 '#' 补齐。",
    data: {
      type: 'link',
      chunkSize: 4,
      nodes: [
        { id: 1, chars: ['A', 'l', 'g', 'o'] },
        { id: 2, chars: ['r', 'i', 't', 'h'] },
        { id: 3, chars: ['m', '#', '#', '#'] } // 补位
      ]
    }
  }
];

const SCENES = {
  'seq': { title: '顺序存储 (定长)', frames: SCENE_SEQ, code: CODE_SEQ },
  'link': { title: '链式存储 (块链)', frames: SCENE_LINK, code: CODE_LINK },
};

// ================== 主组件 ==================

const StringStorageGallery = () => {
  const [activeTab, setActiveTab] = useState('seq');
  const currentScene = SCENES[activeTab];

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {Object.entries(SCENES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
              backgroundColor: activeTab === key ? '#2ea043' : '#21262d',
              color: activeTab === key ? '#fff' : '#c9d1d9', transition: '0.2s'
            }}
          >
            {config.title}
          </button>
        ))}
      </div>

      <AlgoPlayer
        key={activeTab}
        frames={currentScene.frames}
        code={currentScene.code}
        Visualizer={StringStorageVisualizer}
      />
    </div>
  );
};

export default StringStorageGallery;