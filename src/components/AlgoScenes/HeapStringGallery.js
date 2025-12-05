import React from 'react';
import AlgoPlayer from '../AlgoPlayer';
import HeapStringVisualizer from './HeapStringVisualizer';

const CODE_HEAP = `// 堆分配存储表示
typedef struct {
    char *ch;   // 若是非空串，则按串长分配存储区
    int length; // 串长度
} HString;

void StrAssign(HString &S, char *chars) {
    // 1. 如果原串不空，先释放旧空间 (关键!)
    if (S.ch) free(S.ch); 
    
    int len = strlen(chars);
    if (len == 0) {
        S.ch = NULL; S.length = 0;
    } else {
        // 2. 申请新空间
        S.ch = (char*)malloc(len * sizeof(char));
        // 3. 复制数据
        for(int i=0; i<len; i++) S.ch[i] = chars[i];
        S.length = len;
    }
}`;

const FRAMES = [
  {
    line: 6,
    desc: "初始状态：声明 HString S。此时 S.ch 为 NULL，length 为 0。",
    data: {
      stack: { ptr: null, len: 0 },
      heap: null
    }
  },
  {
    line: 11,
    desc: "执行 StrAssign(S, 'Hello')。检查 S.ch 为空，无需 free。",
    data: {
      stack: { ptr: null, len: 0 },
      heap: null
    }
  },
  {
    line: 18,
    desc: "malloc: 在堆区申请 5 个字节的空间。系统返回首地址 0x3A04。",
    data: {
      stack: { ptr: '0x3A04', len: 0 }, // 指针指向新地址
      heap: { address: '0x3A04', data: ['', '', '', '', ''], status: 'active' }
    }
  },
  {
    line: 20,
    desc: "复制数据：将 'Hello' 填入堆内存，并更新 length = 5。",
    data: {
      stack: { ptr: '0x3A04', len: 5 },
      heap: { address: '0x3A04', data: ['H', 'e', 'l', 'l', 'o'], status: 'active' }
    }
  },
  {
    line: 10,
    desc: "执行 StrAssign(S, 'Algo')。检测到 S.ch 不为空 (0x3A04)，准备释放。",
    data: {
      stack: { ptr: '0x3A04', len: 5 },
      heap: { address: '0x3A04', data: ['H', 'e', 'l', 'l', 'o'], status: 'active' }
    }
  },
  {
    line: 11,
    desc: "free(S.ch): 释放 0x3A04 处的内存。此时指针变成悬空指针（直到下一步更新）。",
    data: {
      stack: { ptr: '0x3A04', len: 5 },
      heap: { address: '0x3A04', data: ['H', 'e', 'l', 'l', 'o'], status: 'freed' } // 标记为已释放
    }
  },
  {
    line: 18,
    desc: "malloc: 申请新空间。这次系统分配了新地址 0x5B20。",
    data: {
      stack: { ptr: '0x5B20', len: 0 }, // 指针更新
      heap: { address: '0x5B20', data: ['', '', '', ''], status: 'active' } // 旧的 heap 消失，新的出现
    }
  },
  {
    line: 20,
    desc: "复制数据：将 'Algo' 填入新内存，更新长度。",
    data: {
      stack: { ptr: '0x5B20', len: 4 },
      heap: { address: '0x5B20', data: ['A', 'l', 'g', 'o'], status: 'active' }
    }
  }
];

const HeapStringDemo = () => {
  return (
    <AlgoPlayer
      code={CODE_HEAP}
      frames={FRAMES}
      Visualizer={HeapStringVisualizer}
    />
  );
};

export default HeapStringDemo;