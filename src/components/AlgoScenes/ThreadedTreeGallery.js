import React, { useState } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import ThreadedTreeVisualizer from './ThreadedTreeVisualizer';

// ================== 基础数据与场景定义 (保持不变) ==================

// 树结构坐标
const NODES_BASE = [
  { id: 'A', val: 'A', x: 300, y: 50 },
  { id: 'B', val: 'B', x: 150, y: 150 },
  { id: 'C', val: 'C', x: 450, y: 150 },
  { id: 'D', val: 'D', x: 80, y: 250 },
  { id: 'E', val: 'E', x: 220, y: 250 },
  { id: 'F', val: 'F', x: 380, y: 250 },
  { id: 'G', val: 'G', x: 520, y: 250 }
];

const LINKS_BASE = [
  { source: 'A', target: 'B', type: 'solid' },
  { source: 'A', target: 'C', type: 'solid' },
  { source: 'B', target: 'D', type: 'solid' },
  { source: 'B', target: 'E', type: 'solid' },
  { source: 'C', target: 'F', type: 'solid' },
  { source: 'C', target: 'G', type: 'solid' }
];

const makeFrame = (activeNodeId, threads = [], desc) => {
  return {
    line: 1,
    desc,
    data: {
      nodes: NODES_BASE.map(n => ({
        ...n,
        highlight: n.id === activeNodeId,
        ltag: threads.some(t => t.source === n.id && t.dir === 'left'),
        rtag: threads.some(t => t.source === n.id && t.dir === 'right'),
      })),
      links: [...LINKS_BASE, ...threads]
    }
  };
};

// --- 中序 ---
const SCENE_INORDER = [
  makeFrame(null, [], "初始状态：二叉树。"),
  makeFrame('D', [], "访问 D：左空->前驱NULL；右空->后继B"),
  makeFrame('D', [{source:'D', target:'B', type:'thread', dir:'right'}], "D 线索化完成"),
  makeFrame('B', [{source:'D', target:'B', type:'thread', dir:'right'}], "访问 B：无需线索化"),
  makeFrame('E', [{source:'D', target:'B', type:'thread', dir:'right'}], "访问 E：左空->前驱B；右空->后继A"),
  makeFrame('E', [{source:'D', target:'B', type:'thread', dir:'right'}, {source:'E', target:'B', type:'thread', dir:'left'}, {source:'E', target:'A', type:'thread', dir:'right'}], "E 线索化完成"),
  makeFrame('A', [{source:'D', target:'B', type:'thread', dir:'right'}, {source:'E', target:'B', type:'thread', dir:'left'}, {source:'E', target:'A', type:'thread', dir:'right'}], "访问 A：无需线索化"),
  makeFrame('F', [{source:'D', target:'B', type:'thread', dir:'right'}, {source:'E', target:'B', type:'thread', dir:'left'}, {source:'E', target:'A', type:'thread', dir:'right'}], "访问 F：左空->前驱A；右空->后继C"),
  makeFrame('F', [{source:'D', target:'B', type:'thread', dir:'right'}, {source:'E', target:'B', type:'thread', dir:'left'}, {source:'E', target:'A', type:'thread', dir:'right'}, {source:'F', target:'A', type:'thread', dir:'left'}, {source:'F', target:'C', type:'thread', dir:'right'}], "F 线索化完成"),
  makeFrame('C', [{source:'D', target:'B', type:'thread', dir:'right'}, {source:'E', target:'B', type:'thread', dir:'left'}, {source:'E', target:'A', type:'thread', dir:'right'}, {source:'F', target:'A', type:'thread', dir:'left'}, {source:'F', target:'C', type:'thread', dir:'right'}], "访问 C：无需线索化"),
  makeFrame('G', [{source:'D', target:'B', type:'thread', dir:'right'}, {source:'E', target:'B', type:'thread', dir:'left'}, {source:'E', target:'A', type:'thread', dir:'right'}, {source:'F', target:'A', type:'thread', dir:'left'}, {source:'F', target:'C', type:'thread', dir:'right'}], "访问 G：左空->前驱C；右空->后继NULL"),
  makeFrame('G', [{source:'D', target:'B', type:'thread', dir:'right'}, {source:'E', target:'B', type:'thread', dir:'left'}, {source:'E', target:'A', type:'thread', dir:'right'}, {source:'F', target:'A', type:'thread', dir:'left'}, {source:'F', target:'C', type:'thread', dir:'right'}, {source:'G', target:'C', type:'thread', dir:'left'}], "中序线索化完成"),
];

// --- 先序 ---
const SCENE_PREORDER = [
  makeFrame('A', [], "访问 A"),
  makeFrame('B', [], "访问 B"),
  makeFrame('D', [], "访问 D：左空->前驱B；右空->后继E"),
  makeFrame('D', [{source:'D', target:'B', type:'thread', dir:'left'}, {source:'D', target:'E', type:'thread', dir:'right'}], "D 线索化完成"),
  makeFrame('E', [{source:'D', target:'B', type:'thread', dir:'left'}, {source:'D', target:'E', type:'thread', dir:'right'}], "访问 E：左空->前驱D；右空->后继C"),
  makeFrame('E', [{source:'D', target:'B', type:'thread', dir:'left'}, {source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'C', type:'thread', dir:'right'}], "E 线索化完成"),
  makeFrame('C', [{source:'D', target:'B', type:'thread', dir:'left'}, {source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'C', type:'thread', dir:'right'}], "访问 C"),
  makeFrame('F', [{source:'D', target:'B', type:'thread', dir:'left'}, {source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'C', type:'thread', dir:'right'}], "访问 F：左空->前驱C；右空->后继G"),
  makeFrame('F', [{source:'D', target:'B', type:'thread', dir:'left'}, {source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'C', type:'thread', dir:'right'}, {source:'F', target:'C', type:'thread', dir:'left'}, {source:'F', target:'G', type:'thread', dir:'right'}], "F 线索化完成"),
  makeFrame('G', [{source:'D', target:'B', type:'thread', dir:'left'}, {source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'C', type:'thread', dir:'right'}, {source:'F', target:'C', type:'thread', dir:'left'}, {source:'F', target:'G', type:'thread', dir:'right'}], "访问 G：左空->前驱F；右空->后继NULL"),
  makeFrame('G', [{source:'D', target:'B', type:'thread', dir:'left'}, {source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'C', type:'thread', dir:'right'}, {source:'F', target:'C', type:'thread', dir:'left'}, {source:'F', target:'G', type:'thread', dir:'right'}, {source:'G', target:'F', type:'thread', dir:'left'}], "先序线索化完成"),
];

// --- 后序 ---
const SCENE_POSTORDER = [
  makeFrame('D', [], "访问 D：左空->前驱NULL；右空->后继E"),
  makeFrame('D', [{source:'D', target:'E', type:'thread', dir:'right'}], "D 线索化完成"),
  makeFrame('E', [{source:'D', target:'E', type:'thread', dir:'right'}], "访问 E：左空->前驱D；右空->后继B"),
  makeFrame('E', [{source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'B', type:'thread', dir:'right'}], "E 线索化完成"),
  makeFrame('B', [{source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'B', type:'thread', dir:'right'}], "访问 B"),
  makeFrame('F', [{source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'B', type:'thread', dir:'right'}], "访问 F：左空->前驱B；右空->后继G"),
  makeFrame('F', [{source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'B', type:'thread', dir:'right'}, {source:'F', target:'B', type:'thread', dir:'left'}, {source:'F', target:'G', type:'thread', dir:'right'}], "F 线索化完成"),
  makeFrame('G', [{source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'B', type:'thread', dir:'right'}, {source:'F', target:'B', type:'thread', dir:'left'}, {source:'F', target:'G', type:'thread', dir:'right'}], "访问 G：左空->前驱F；右空->后继C"),
  makeFrame('G', [{source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'B', type:'thread', dir:'right'}, {source:'F', target:'B', type:'thread', dir:'left'}, {source:'F', target:'G', type:'thread', dir:'right'}, {source:'G', target:'F', type:'thread', dir:'left'}, {source:'G', target:'C', type:'thread', dir:'right'}], "G 线索化完成"),
  makeFrame('C', [{source:'D', target:'E', type:'thread', dir:'right'}, {source:'E', target:'D', type:'thread', dir:'left'}, {source:'E', target:'B', type:'thread', dir:'right'}, {source:'F', target:'B', type:'thread', dir:'left'}, {source:'F', target:'G', type:'thread', dir:'right'}, {source:'G', target:'F', type:'thread', dir:'left'}, {source:'G', target:'C', type:'thread', dir:'right'}], "后序线索化完成"),
];

const SCENES = {
  'in': { title: '中序线索化', frames: SCENE_INORDER },
  'pre': { title: '先序线索化', frames: SCENE_PREORDER },
  'post': { title: '后序线索化', frames: SCENE_POSTORDER },
};

// ================== 主组件 (修改点：增加 mode 参数) ==================

const ThreadedTreeGallery = ({ mode = 'all' }) => {
  // 如果 mode 不是 'all'，则强制使用该 mode，否则默认 'in'
  const [activeTab, setActiveTab] = useState(mode === 'all' ? 'in' : mode);

  // 确保 mode 有效，否则回退到 'in'
  const safeTab = SCENES[activeTab] ? activeTab : 'in';
  const currentScene = SCENES[safeTab];

  return (
    <div>
      {/* 只有在 mode='all' 时才显示选项卡 */}
      {mode === 'all' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {Object.entries(SCENES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                backgroundColor: activeTab === key ? '#2ea043' : '#21262d',
                color: activeTab === key ? '#fff' : '#c9d1d9',
                transition: '0.2s'
              }}
            >
              {config.title}
            </button>
          ))}
        </div>
      )}

      {/* 播放器 */}
      <AlgoPlayer
        key={safeTab} // 切换时强制刷新播放器
        frames={currentScene.frames}
        code={`// ${currentScene.title} 算法核心\nvoid Threading(Node* p) {\n  if(p == NULL) return;\n  \n  // 当前模式: ${currentScene.title}\n  // 核心逻辑: 利用空指针建立线索\n  \n  if(p->lchild == NULL) {\n    p->lchild = pre;\n    p->ltag = 1;\n  }\n  if(pre != NULL && pre->rchild == NULL) {\n    pre->rchild = p;\n    pre->rtag = 1;\n  }\n  pre = p;\n}`}
        Visualizer={ThreadedTreeVisualizer}
      />
    </div>
  );
};

export default ThreadedTreeGallery;