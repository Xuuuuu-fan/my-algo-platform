import React, { useState } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import StringOpsVisualizer from './StringOpsVisualizer';

// ================== 场景数据定义 ==================

// 1. 求串长 (StrLength)
// 逻辑：遍历直到遇到 '\0' (这里简化为遍历数组长度)
const CODE_LENGTH = `int StrLength(String S) {
    int i = 0;
    while (S.ch[i] != '\\0') {
        i++;
    }
    return i;
}`;

const SCENE_LENGTH = [
  {
    line: 2,
    desc: "初始化计数器 i = 0",
    data: {
      s1: { label: 'S', chars: ['H', 'e', 'l', 'l', 'o'] },
      pointers: { index: 0, name: 'i=0' }
    }
  },
  {
    line: 3,
    desc: "检查 S[0] ('H') 是否为空? 否。进入循环。",
    data: {
      s1: { label: 'S', chars: ['H', 'e', 'l', 'l', 'o'] },
      pointers: { index: 0, name: 'i=0' }
    }
  },
  {
    line: 4,
    desc: "i++，指针后移",
    data: {
      s1: { label: 'S', chars: ['H', 'e', 'l', 'l', 'o'] },
      pointers: { index: 1, name: 'i=1' }
    }
  },
  {
    line: 3,
    desc: "检查 S[1] ('e') 是否为空? 否。",
    data: {
      s1: { label: 'S', chars: ['H', 'e', 'l', 'l', 'o'] },
      pointers: { index: 1, name: 'i=1' }
    }
  },
  // ... 省略中间步骤，直接跳到末尾 ...
  {
    line: 4,
    desc: "i++，指针继续后移 (快速快进)",
    data: {
      s1: { label: 'S', chars: ['H', 'e', 'l', 'l', 'o'] },
      pointers: { index: 4, name: 'i=4' }
    }
  },
  {
    line: 4,
    desc: "最后一次 i++，指向末尾",
    data: {
      s1: { label: 'S', chars: ['H', 'e', 'l', 'l', 'o'] },
      pointers: { index: 5, name: 'i=5' } // 越界位置
    }
  },
  {
    line: 6,
    desc: "遇到结束符，循环终止。返回长度 5。",
    data: {
      s1: { label: 'S', chars: ['H', 'e', 'l', 'l', 'o'] },
      pointers: { index: 5, name: 'Len=5' }
    }
  }
];

// 2. 串联接 (Concat)
// 逻辑：先存S1，再将S2依次存入S1后面
const CODE_CONCAT = `void Concat(String &T, String S1, String S2) {
    // 1. 复制 S1 到 T
    for(i=0; i<S1.len; i++) T.ch[i] = S1.ch[i];
    
    // 2. 复制 S2 到 T 的后面
    for(j=0; j<S2.len; j++) T.ch[i+j] = S2.ch[j];
    
    T.len = S1.len + S2.len;
}`;

const SCENE_CONCAT = [
  {
    line: 1,
    desc: "准备两个串：S1='Data', S2='Base'",
    data: {
      s1: { label: 'S1', chars: ['D', 'a', 't', 'a'] },
      s2: { label: 'S2', chars: ['B', 'a', 's', 'e'] },
      result: { label: 'T', chars: [] }
    }
  },
  {
    line: 3,
    desc: "第一步：将 S1 的字符全部复制到 T 中",
    data: {
      s1: { label: 'S1', chars: ['D', 'a', 't', 'a'], activeRange: [0, 3] },
      s2: { label: 'S2', chars: ['B', 'a', 's', 'e'] },
      result: { label: 'T', chars: ['D', 'a', 't', 'a'] }
    }
  },
  {
    line: 6,
    desc: "第二步：将 S2 的字符拼接到 T 的末尾 (从 index 4 开始)",
    data: {
      s1: { label: 'S1', chars: ['D', 'a', 't', 'a'] },
      s2: { label: 'S2', chars: ['B', 'a', 's', 'e'], activeRange: [0, 3] },
      result: { label: 'T', chars: ['D', 'a', 't', 'a', 'B', 'a', 's', 'e'] }
    }
  },
  {
    line: 8,
    desc: "更新 T 的长度，拼接完成。",
    data: {
      s1: { label: 'S1', chars: ['D', 'a', 't', 'a'] },
      s2: { label: 'S2', chars: ['B', 'a', 's', 'e'] },
      result: { label: 'T', chars: ['D', 'a', 't', 'a', 'B', 'a', 's', 'e'] }
    }
  }
];

// 3. 求子串 (SubString)
// 逻辑：SubString(Sub, S, pos, len)
const CODE_SUB = `bool SubString(String &Sub, String S, int pos, int len) {
    if (pos + len - 1 > S.len) return false;
    
    // 从 S[pos] 开始，复制 len 个字符
    for (int i = 0; i < len; i++) {
        Sub.ch[i] = S.ch[pos + i - 1]; 
        // 注意：逻辑下标pos从1开始，数组从0开始
    }
    Sub.len = len;
    return true;
}`;

const SCENE_SUB = [
  {
    line: 1,
    desc: "目标：从 'Algorithm' 中提取子串。pos=4 ('o'), len=4",
    data: {
      s1: { label: 'S', chars: ['A', 'l', 'g', 'o', 'r', 'i', 't', 'h', 'm'] },
      result: { label: 'Sub', chars: [] }
    }
  },
  {
    line: 2,
    desc: "边界检查：4 + 4 - 1 <= 9，合法。",
    data: {
      s1: { label: 'S', chars: ['A', 'l', 'g', 'o', 'r', 'i', 't', 'h', 'm'] },
      result: { label: 'Sub', chars: [] }
    }
  },
  {
    line: 5,
    desc: "循环 i=0: 取出 S[4+0-1] = S[3] ('o')",
    data: {
      s1: { label: 'S', chars: ['A', 'l', 'g', 'o', 'r', 'i', 't', 'h', 'm'], activeRange: [3, 3] }, // 数组下标3
      result: { label: 'Sub', chars: ['o'] }
    }
  },
  {
    line: 5,
    desc: "循环 i=1: 取出 S[4+1-1] = S[4] ('r')",
    data: {
      s1: { label: 'S', chars: ['A', 'l', 'g', 'o', 'r', 'i', 't', 'h', 'm'], activeRange: [3, 4] },
      result: { label: 'Sub', chars: ['o', 'r'] }
    }
  },
  {
    line: 5,
    desc: "循环 i=2: 取出 S[4+2-1] = S[5] ('i')",
    data: {
      s1: { label: 'S', chars: ['A', 'l', 'g', 'o', 'r', 'i', 't', 'h', 'm'], activeRange: [3, 5] },
      result: { label: 'Sub', chars: ['o', 'r', 'i'] }
    }
  },
  {
    line: 5,
    desc: "循环 i=3: 取出 S[4+3-1] = S[6] ('t')",
    data: {
      s1: { label: 'S', chars: ['A', 'l', 'g', 'o', 'r', 'i', 't', 'h', 'm'], activeRange: [3, 6] },
      result: { label: 'Sub', chars: ['o', 'r', 'i', 't'] }
    }
  },
  {
    line: 9,
    desc: "操作完成，返回 True。",
    data: {
      s1: { label: 'S', chars: ['A', 'l', 'g', 'o', 'r', 'i', 't', 'h', 'm'] },
      result: { label: 'Sub', chars: ['o', 'r', 'i', 't'] }
    }
  },
];

const SCENES = {
  'length': { title: '求串长', frames: SCENE_LENGTH, code: CODE_LENGTH },
  'concat': { title: '串联接', frames: SCENE_CONCAT, code: CODE_CONCAT },
  'sub':    { title: '求子串', frames: SCENE_SUB,    code: CODE_SUB },
};

// ================== 主组件 ==================

const StringOpsGallery = () => {
  const [activeTab, setActiveTab] = useState('length');
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
        Visualizer={StringOpsVisualizer}
      />
    </div>
  );
};

export default StringOpsGallery;