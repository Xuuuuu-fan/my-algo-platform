import React, { useState, useEffect, useMemo } from 'react';
import AlgoPlayer from '../AlgoPlayer';
import StringAdvancedVisualizer from './StringAdvancedVisualizer';

// ================== 算法代码展示 ==================
const CODE_BF = `int Index_BF(String S, String T) {
    int i=0, j=0;
    while(i < S.len && j < T.len) {
        // 1. 比较当前字符
        if(S[i] == T[j]) {
            i++; j++; // 匹配，后移
        } else {
            // 2. 失配，回溯
            i = i - j + 1; 
            j = 0;
        }
    }
    if(j >= T.len) return i - T.len; // 成功
    else return -1;
}`;

const CODE_KMP = `int Index_KMP(String S, String T, int next[]) {
    int i=0, j=0;
    while(i < S.len && j < T.len) {
        // 1. 字符匹配 或 j回退到头
        if(j == -1 || S[i] == T[j]) {
            i++; j++;
        } else {
            // 2. 失配，j 回退到 next[j]
            j = next[j]; 
        }
    }
    if(j >= T.len) return i - T.len; // 成功
    else return -1;
}`;

// ================== 算法逻辑引擎 (生成帧) ==================

// 1. 生成 BF 算法帧
const generateBFFrames = (sStr, tStr) => {
  const frames = [];
  const S = sStr.split('');
  const T = tStr.split('');
  let i = 0, j = 0;

  // 初始帧
  frames.push({
    line: 2,
    desc: "初始化指针 i=0, j=0",
    data: { mode: 'match', s: S, t: T, i: 1, j: 1, matchIndex: -1, isMatch: false }
  });

  while (i < S.length && j < T.length) {
    // 记录比较帧
    const isMatch = S[i] === T[j];
    frames.push({
      line: 5,
      desc: `比较 S[${i}]('${S[i]}') 和 T[${j}]('${T[j]}')：${isMatch ? '相等' : '不等'}`,
      data: {
        mode: 'match', s: S, t: T,
        i: i + 1, j: j + 1, // 视图层用 1-based
        matchIndex: j, // 用于高亮颜色
        isMatch: isMatch
      }
    });

    if (isMatch) {
      i++; j++;
      frames.push({
        line: 6,
        desc: "匹配成功，指针后移",
        data: { mode: 'match', s: S, t: T, i: i + 1, j: j + 1, matchIndex: j-1, isMatch: true }
      });
    } else {
      i = i - j + 1;
      j = 0;
      frames.push({
        line: 8,
        desc: `失配回溯：i 回退到 ${i}，j 重置为 0`,
        data: { mode: 'match', s: S, t: T, i: i + 1, j: j + 1, matchIndex: 0, isMatch: false }
      });
    }
  }

  if (j >= T.length) {
    frames.push({
      line: 11,
      desc: `匹配成功！子串位置：${i - T.length}`,
      data: { mode: 'match', s: S, t: T, i: i + 1, j: j + 1, matchIndex: T.length-1, isMatch: true }
    });
  } else {
    frames.push({
      line: 12,
      desc: "匹配失败",
      data: { mode: 'match', s: S, t: T, i: i + 1, j: j + 1, matchIndex: -1, isMatch: false }
    });
  }
  return frames;
};

// 2. 辅助：计算 Next 数组
const getNext = (str) => {
  const next = [-1];
  let k = -1;
  let j = 0;
  while (j < str.length - 1) {
    if (k === -1 || str[j] === str[k]) {
      ++j; ++k;
      next[j] = k;
    } else {
      k = next[k];
    }
  }
  return next;
};

// 3. 生成 KMP 算法帧
const generateKMPFrames = (sStr, tStr) => {
  const frames = [];
  const S = sStr.split('');
  const T = tStr.split('');
  const next = getNext(tStr); // 计算 Next
  let i = 0, j = 0;

  // 初始帧
  frames.push({
    line: 2,
    desc: `初始化 KMP。Next数组: [${next.map(n=>n==-1?0:n+1).join(', ')}] (修正为1-based显示)`, // 方便理解显示为常见教材格式
    data: { mode: 'match', s: S, t: T, i: 1, j: 1, matchIndex: -1, isMatch: false }
  });

  while (i < S.length && j < T.length) {
    // 记录比较前的状态
    if (j !== -1) {
        const isMatch = S[i] === T[j];
        frames.push({
            line: 5,
            desc: `比较 S[${i}]('${S[i]}') 和 T[${j}]('${T[j]}')`,
            data: {
                mode: 'match', s: S, t: T,
                i: i + 1, j: j + 1,
                matchIndex: j,
                isMatch: isMatch
            }
        });
    }

    if (j === -1 || S[i] === T[j]) {
      i++; j++;
      frames.push({
        line: 6,
        desc: "匹配成功 (或 j==-1)，指针后移",
        data: { mode: 'match', s: S, t: T, i: i + 1, j: j + 1, matchIndex: j-1, isMatch: true }
      });
    } else {
      const nextVal = next[j];
      frames.push({
        line: 9,
        desc: `失配！i 不变，j 回退到 next[${j}] = ${nextVal} (1-based: ${nextVal === -1 ? 0 : nextVal+1})`,
        data: { mode: 'match', s: S, t: T, i: i + 1, j: j + 1, matchIndex: j, isMatch: false }
      });
      j = next[j];

      // 回退后的状态展示
      frames.push({
        line: 9,
        desc: `回退完成，准备下一轮比较`,
        data: { mode: 'match', s: S, t: T, i: i + 1, j: j === -1 ? 0 : j + 1, matchIndex: -1, isMatch: false }
      });
    }
  }

  if (j >= T.length) {
    frames.push({
      line: 12,
      desc: `匹配成功！位置：${i - T.length}`,
      data: { mode: 'match', s: S, t: T, i: i + 1, j: j + 1, matchIndex: T.length-1, isMatch: true }
    });
  } else {
    frames.push({
      line: 13,
      desc: "匹配失败",
      data: { mode: 'match', s: S, t: T, i: i + 1, j: j + 1, matchIndex: -1, isMatch: false }
    });
  }
  return frames;
};


// ================== 组件 UI ==================

const StringMatchPlayground = () => {
  const [sVal, setSVal] = useState('ababaaaba');
  const [tVal, setTVal] = useState('aba');
  const [algo, setAlgo] = useState('BF'); // BF or KMP

  // 使用 useMemo 缓存计算出的动画帧，只在输入改变时重新计算
  const frames = useMemo(() => {
    if (!sVal || !tVal) return [];
    if (algo === 'BF') return generateBFFrames(sVal, tVal);
    return generateKMPFrames(sVal, tVal);
  }, [sVal, tVal, algo]);

  const currentCode = algo === 'BF' ? CODE_BF : CODE_KMP;

  return (
    <div style={{ marginTop: 20 }}>
      {/* 顶部控制区 */}
      <div style={{
        display: 'flex', gap: 20, marginBottom: 20, padding: 20,
        background: '#161b22', borderRadius: 8, border: '1px solid #30363d',
        flexWrap: 'wrap', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: '#8b949e' }}>主串 (S)</label>
          <input
            value={sVal}
            onChange={(e) => setSVal(e.target.value)}
            style={inputStyle}
            placeholder="Main String"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: '#8b949e' }}>模式串 (T)</label>
          <input
            value={tVal}
            onChange={(e) => setTVal(e.target.value)}
            style={inputStyle}
            placeholder="Pattern"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, color: '#8b949e' }}>算法选择</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setAlgo('BF')}
              style={algo === 'BF' ? btnActiveStyle : btnStyle}
            >
              朴素 (BF)
            </button>
            <button
              onClick={() => setAlgo('KMP')}
              style={algo === 'KMP' ? btnActiveStyle : btnStyle}
            >
              KMP 算法
            </button>
          </div>
        </div>
      </div>

      {/* 播放器 (Key 的变化会强制重置播放器状态) */}
      <AlgoPlayer
        key={`${algo}-${sVal}-${tVal}`}
        code={currentCode}
        frames={frames}
        Visualizer={StringAdvancedVisualizer}
      />
    </div>
  );
};

// 简单样式
const inputStyle = {
  background: '#0d1117',
  border: '1px solid #30363d',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 6,
  fontSize: 14,
  fontFamily: 'monospace',
  minWidth: 200
};

const btnStyle = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid #30363d',
  background: '#21262d',
  color: '#c9d1d9',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const btnActiveStyle = {
  ...btnStyle,
  background: '#1f6feb',
  color: '#fff',
  borderColor: '#1f6feb'
};

export default StringMatchPlayground;