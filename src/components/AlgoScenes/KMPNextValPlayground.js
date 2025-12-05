import React, { useState, useMemo } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import StringAdvancedVisualizer from './StringAdvancedVisualizer';

// 求 NextVal 数组的优化算法
const CODE_NEXTVAL = `void get_nextval(String T, int nextval[]) {
    int i = 1; 
    int j = 0;
    nextval[1] = 0;
    
    while (i < T.length) {
        if (j == 0 || T.ch[i] == T.ch[j]) {
            ++i; ++j;
            
            // --- 核心优化逻辑 ---
            if (T.ch[i] != T.ch[j]) {
                nextval[i] = j; // 不需要优化
            } else {
                // 字符相等，递归引用
                nextval[i] = nextval[j]; 
            }
            // ------------------
        } else {
            j = nextval[j]; // 回溯
        }
    }
}`;

// 逻辑引擎
const generateFrames = (tVal) => {
  const frames = [];
  const T = tVal.split('');
  const len = T.length;

  // 初始化数组 (用 null 代表未知)
  // 逻辑下标从 1 开始，对应 JS 数组下标 0
  let nextVal = new Array(len).fill(null);
  nextVal[0] = 0; // nextval[1] = 0

  let i = 1;
  let j = 0;

  // 0. 初始帧
  frames.push({
    line: 4,
    desc: "初始化：i=1, j=0, nextval[1]=0",
    data: {
      mode: 'array', arrayName: 'nextval',
      t: T, arr: [...nextVal], i: 1, j: 0
    }
  });

  while (i < len) {
    const charSuffix = T[i-1];
    const charPrefix = j > 0 ? T[j-1] : '无';

    // 1. 比较阶段
    frames.push({
      line: 7,
      desc: j === 0
        ? `j=0，直接后移`
        : `比较 T[${i}] ('${charSuffix}') 和 T[${j}] ('${charPrefix}')`,
      data: {
        mode: 'array', arrayName: 'nextval',
        t: T, arr: [...nextVal], i: i, j: j
      }
    });

    if (j === 0 || T[i-1] === T[j-1]) {
      ++i;
      ++j;

      // 2. 优化判断阶段 (这是 NextVal 的精髓)
      const charNewI = T[i-1]; // i 已经+1了
      const charNewJ = T[j-1]; // j 已经+1了

      frames.push({
        line: 11, // 指向 if (T[i] != T[j])
        desc: `匹配成功，i, j 后移。检查 T[${i}] ('${charNewI}') 是否等于 T[${j}] ('${charNewJ}')？`,
        data: {
          mode: 'array', arrayName: 'nextval',
          t: T, arr: [...nextVal], i: i, j: j
        }
      });

      if (charNewI !== charNewJ) {
        // 不需要优化
        nextVal[i-1] = j;
        frames.push({
          line: 12,
          desc: `字符不等，无需优化。nextval[${i}] = j = ${j}`,
          data: {
            mode: 'array', arrayName: 'nextval',
            t: T, arr: [...nextVal], i: i, j: j
          }
        });
      } else {
        // 需要优化
        const optimizedVal = nextVal[j-1];
        nextVal[i-1] = optimizedVal;
        frames.push({
          line: 14,
          desc: `🔴 字符相等 (T[${i}]==T[${j}])！触发优化：nextval[${i}] = nextval[${j}] = ${optimizedVal}`,
          data: {
            mode: 'array', arrayName: 'nextval',
            t: T, arr: [...nextVal], i: i, j: j
          }
        });
      }

    } else {
      // 失配回溯
      const backVal = nextVal[j-1];
      frames.push({
        line: 18,
        desc: `失配！j 回退到 nextval[${j}] = ${backVal}`,
        data: {
          mode: 'array', arrayName: 'nextval',
          t: T, arr: [...nextVal], i: i, j: j
        }
      });
      j = backVal;
    }
  }

  // 结束帧
  frames.push({
    line: 21,
    desc: "计算完成。",
    data: {
      mode: 'array', arrayName: 'nextval',
      t: T, arr: [...nextVal], i: i, j: j
    }
  });

  return frames;
};

const KMPNextValPlayground = () => {
  const [pattern, setPattern] = useState('ababaa');

  const frames = useMemo(() => {
    if (!pattern) return [];
    return generateFrames(pattern);
  }, [pattern]);

  return (
    <div style={{ marginTop: 20 }}>
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
          试一试: "aaaaa" (全优化)
        </div>
      </div>

      <AlgoPlayer
        key={pattern}
        code={CODE_NEXTVAL}
        frames={frames}
        Visualizer={StringAdvancedVisualizer}
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

export default KMPNextValPlayground;