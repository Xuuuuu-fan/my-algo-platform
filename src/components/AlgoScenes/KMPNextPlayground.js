import React, { useState, useMemo } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import StringAdvancedVisualizer from './StringAdvancedVisualizer';

// 求 Next 数组的代码
const CODE_NEXT = `void get_next(String T, int next[]) {
    int i = 1; 
    int j = 0;
    next[1] = 0; // 这里的下标对应逻辑位置 1
    
    while (i < T.length) {
        // j==0 表示回溯到了开头
        // T[i] == T[j] 表示前后缀匹配
        if (j == 0 || T.ch[i] == T.ch[j]) {
            ++i; 
            ++j;
            next[i] = j;
        } else {
            // 失配，j 回溯
            j = next[j];
        }
    }
}`;

// 核心逻辑引擎
const generateFrames = (tVal) => {
  const frames = [];
  const T = tVal.split(''); // 字符数组
  const len = T.length;

  // 初始化 next 数组显示 (用 null 表示未知)
  // 为了匹配教材的 1-based 习惯，我们内部逻辑用 1-based，但在 JS 数组映射时要小心
  let nextArr = new Array(len).fill(null);
  nextArr[0] = 0; // next[1] = 0

  let i = 1;
  let j = 0;

  // 0. 初始状态帧
  frames.push({
    line: 3,
    desc: "初始化：i=1 (后缀指针), j=0 (前缀指针), next[1]=0",
    data: {
      mode: 'array',
      arrayName: 'next',
      t: T,
      arr: [...nextArr],
      i: 1, j: 0
    }
  });

  while (i < len) {
    // 1. 比较状态帧
    // 注意：T[i] 实际上对应 JS数组的 T[i-1] (如果按1-based理解)
    // 但在大多数 Next 算法实现中，如果字符串从1开始，T[i]就是第i个。
    // 这里为了对应可视化，我们假设 T 从下标 1 开始逻辑索引。
    // 所以 JS 取值时用 i-1 和 j-1。但当 j=0 时特殊处理。

    const charSuffix = T[i-1]; // T[i]
    const charPrefix = j > 0 ? T[j-1] : '无'; // T[j]

    frames.push({
      line: 10,
      desc: j === 0
        ? `j=0，无需比较，直接后移`
        : `比较 T[${i}] ('${charSuffix}') 和 T[${j}] ('${charPrefix}')`,
      data: {
        mode: 'array',
        arrayName: 'next',
        t: T,
        arr: [...nextArr],
        i: i, j: j
      }
    });

    if (j === 0 || T[i-1] === T[j-1]) {
      // 匹配或 j=0
      const oldI = i; // 记录旧值用于描述
      ++i;
      ++j;
      nextArr[i-1] = j; // 填入 next[i]

      frames.push({
        line: 12,
        desc: j === 1 && oldI === 1 // 特殊文案处理第一步
            ? `i++, j++。next[${i}] = ${j}`
            : `匹配成功 (或j=0)! i,j 后移。记录 next[${i}] = ${j}`,
        data: {
          mode: 'array',
          arrayName: 'next',
          t: T,
          arr: [...nextArr],
          i: i, j: j
        }
      });
    } else {
      // 失配回溯
      const nextVal = nextArr[j-1]; // 获取 next[j]
      frames.push({
        line: 16,
        desc: `失配! T[${i}] != T[j]。j 回退到 next[${j}] = ${nextVal}`,
        data: {
          mode: 'array',
          arrayName: 'next',
          t: T,
          arr: [...nextArr],
          i: i, j: j
        }
      });

      j = nextVal;

      frames.push({
        line: 16,
        desc: `j 已更新为 ${j}，准备下一轮比较`,
        data: {
          mode: 'array',
          arrayName: 'next',
          t: T,
          arr: [...nextArr],
          i: i, j: j
        }
      });
    }
  }

  // 结束帧
  frames.push({
    line: 19,
    desc: "遍历结束，Next 数组计算完成。",
    data: {
      mode: 'array',
      arrayName: 'next',
      t: T,
      arr: [...nextArr],
      i: i, j: j
    }
  });

  return frames;
};

const KMPNextPlayground = () => {
  const [pattern, setPattern] = useState('ababaa');

  // 实时计算动画帧
  const frames = useMemo(() => {
    if (!pattern) return [];
    return generateFrames(pattern);
  }, [pattern]);

  return (
    <div style={{ marginTop: 20 }}>
      {/* 输入控制 */}
      <div style={{
        display: 'flex', gap: 20, marginBottom: 20, padding: 20,
        background: '#161b22', borderRadius: 8, border: '1px solid #30363d',
        alignItems: 'center'
      }}>
        <label style={{ fontSize: 14, color: '#8b949e', fontWeight: 'bold' }}>模式串 (T):</label>
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          style={inputStyle}
          placeholder="输入模式串..."
        />
        <div style={{ fontSize: 12, color: '#8b949e', marginLeft: 'auto' }}>
          提示: 尝试输入 "aaaaa" 或 "abcabc"
        </div>
      </div>

      {/* 播放器 */}
      <AlgoPlayer
        key={pattern}
        code={CODE_NEXT}
        frames={frames}
        Visualizer={StringAdvancedVisualizer} // 复用之前的渲染器
      />
    </div>
  );
};

const inputStyle = {
  background: '#0d1117',
  border: '1px solid #30363d',
  color: '#fff',
  padding: '10px 12px',
  borderRadius: 6,
  fontSize: 16,
  fontFamily: 'monospace',
  outline: 'none',
  width: '300px'
};

export default KMPNextPlayground;