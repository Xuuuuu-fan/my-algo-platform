import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AlgoPlayer from '../AlgoPlayer';

// ================== 1. 专用可视化组件 ==================
// 这是一个定制的表格视图，同时展示两行数组
const ComparisonVisualizer = ({ data }) => {
  const { pattern, next, nextval, i, j, activeType } = data;

  // 单元格组件
  const Cell = ({ val, index, type, isCurrentI, isCurrentJ }) => {
    let bgColor = 'transparent';
    let borderColor = '#30363d';
    let textColor = '#fff';

    // 高亮逻辑
    if (val === null) {
        textColor = 'transparent'; // 未计算
    } else {
        // 如果是 NextVal 且发生了优化 (next != nextval)，标绿
        if (type === 'nextval' && next[index] !== null && val !== next[index]) {
            bgColor = 'rgba(46, 160, 67, 0.3)'; // 绿色背景
            borderColor = '#2ea043';
        }
        // 当前正在计算的格子
        if (isCurrentI) {
            borderColor = '#e0a612'; // 黄色边框
        }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 2px' }}>
        {/* 指针标记 */}
        <div style={{ height: 18, fontSize: 12, color: '#e0a612', fontWeight: 'bold' }}>
          {isCurrentI ? 'i' : (isCurrentJ ? 'j' : '')}
        </div>

        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: val !== null ? 1 : 0.2, scale: 1, backgroundColor: bgColor, borderColor: borderColor }}
          style={{
            width: 36, height: 36, borderRadius: 4, border: `1px solid ${borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: 14, color: textColor
          }}
        >
          {val !== null ? val : '-'}
        </motion.div>
      </div>
    );
  };

  return (
    <div style={{
      padding: 20, background: '#0d1117', borderRadius: 8,
      display: 'flex', flexDirection: 'column', gap: 15, alignItems: 'center',
      minHeight: 300, justifyContent: 'center'
    }}>

      {/* 第一行：模式串字符 */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: 80, color: '#8b949e', fontWeight: 'bold', alignSelf:'center' }}>模式串 T</div>
        {pattern.map((char, idx) => (
          <div key={idx} style={{ width: 40, textAlign: 'center' }}>
            <div style={{ marginBottom: 5, fontSize: 12, color: '#8b949e' }}>{idx + 1}</div>
            <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, border:'1px solid #30363d', borderRadius: 4, background:'#161b22' }}>
              {char}
            </div>
          </div>
        ))}
      </div>

      {/* 连接线 */}
      <div style={{ height: 1, width: '100%', background: '#30363d' }}></div>

      {/* 第二行：Next 数组 */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: 80, color: '#58a6ff', fontWeight: 'bold', alignSelf:'center' }}>Next</div>
        {next.map((val, idx) => (
          <div key={idx} style={{ width: 40, display:'flex', justifyContent:'center' }}>
            <Cell val={val} index={idx} type="next" isCurrentI={idx + 1 === i && activeType === 'next'} isCurrentJ={idx + 1 === j} />
          </div>
        ))}
      </div>

      {/* 第三行：NextVal 数组 */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: 80, color: '#2ea043', fontWeight: 'bold', alignSelf:'center' }}>NextVal</div>
        {nextval.map((val, idx) => (
          <div key={idx} style={{ width: 40, display:'flex', justifyContent:'center' }}>
            <Cell val={val} index={idx} type="nextval" isCurrentI={idx + 1 === i && activeType === 'nextval'} />
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div style={{ marginTop: 10, fontSize: 12, color: '#8b949e', display: 'flex', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, background: 'rgba(46, 160, 67, 0.3)', border: '1px solid #2ea043' }}></div>
          <span>触发优化 (NextVal ≠ Next)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, border: '1px solid #e0a612' }}></div>
          <span>当前计算位 (i)</span>
        </div>
      </div>

    </div>
  );
};

// ================== 2. 逻辑引擎 ==================
const generateFrames = (patternStr) => {
  const frames = [];
  const T = patternStr.split('');
  const len = T.length;

  // 初始化数组 (JS数组下标0对应逻辑下标1)
  let next = new Array(len).fill(null);
  let nextval = new Array(len).fill(null);

  // 初始值: next[1]=0, nextval[1]=0
  next[0] = 0;
  nextval[0] = 0;

  let i = 1; // 后缀指针 (逻辑下标)
  let j = 0; // 前缀指针 (逻辑下标)

  frames.push({
    line: 3,
    desc: "初始化：i=1, j=0。next[1]=0, nextval[1]=0",
    data: { pattern: T, next: [...next], nextval: [...nextval], i, j, activeType: 'init' }
  });

  while (i < len) {
    // 逻辑下标 i 对应数组下标 i-1
    // 逻辑下标 j 对应数组下标 j-1 (当j>0时)
    const charI = T[i-1];
    const charJ = j > 0 ? T[j-1] : '';

    frames.push({
      line: 6,
      desc: j === 0
        ? `j=0，直接匹配下一位`
        : `比较 T[${i}]('${charI}') 和 T[${j}]('${charJ}')`,
      data: { pattern: T, next: [...next], nextval: [...nextval], i, j, activeType: 'compare' }
    });

    if (j === 0 || T[i-1] === T[j-1]) {
      ++i;
      ++j;

      // 1. 填入 Next
      next[i-1] = j;

      frames.push({
        line: 8,
        desc: `匹配成功 (或j=0)。i,j 后移。填入 next[${i}] = ${j}`,
        data: { pattern: T, next: [...next], nextval: [...nextval], i, j, activeType: 'next' }
      });

      // 2. 计算 NextVal (优化判断)
      // 注意：此时 i 已经是下一位了，我们要看 T[i] 和 T[j] (也就是 T[next[i]])
      // T[i] 对应 T[i-1], T[j] 对应 T[j-1]
      const charNewI = T[i-1];
      const charNewJ = T[j-1];

      if (charNewI !== charNewJ) {
        // 字符不同，不需要优化
        nextval[i-1] = j;
        frames.push({
          line: 12,
          desc: `检查 T[${i}]('${charNewI}') != T[${j}]('${charNewJ}')。字符不等，无需优化，nextval[${i}] = ${j}`,
          data: { pattern: T, next: [...next], nextval: [...nextval], i, j, activeType: 'nextval' }
        });
      } else {
        // 字符相同，需要优化 -> 继承 j 的 nextval
        const optimizedVal = nextval[j-1];
        nextval[i-1] = optimizedVal;
        frames.push({
          line: 14,
          desc: `⚡️ 发现 T[${i}] == T[${j}] == '${charNewI}'！触发优化：nextval[${i}] = nextval[${j}] = ${optimizedVal}`,
          data: { pattern: T, next: [...next], nextval: [...nextval], i, j, activeType: 'nextval' }
        });
      }

    } else {
      // 失配回溯
      const backVal = next[j-1]; // 回溯使用 next 数组的值
      frames.push({
        line: 17,
        desc: `失配！j 回退到 next[${j}] = ${backVal}`,
        data: { pattern: T, next: [...next], nextval: [...nextval], i, j, activeType: 'backtrack' }
      });
      j = backVal;
    }
  }

  // 结束
  frames.push({
    line: 20,
    desc: "计算完成！对比观察绿色格子，那就是优化发生的地方。",
    data: { pattern: T, next: [...next], nextval: [...nextval], i, j, activeType: 'done' }
  });

  return frames;
};

// ================== 3. 主组件 ==================
const CODE_COMPARE = `// KMP Next & NextVal 计算逻辑
void get_nextval(String T, int next[], int nextval[]) {
    int i=1, j=0;
    next[1]=0; nextval[1]=0;
    
    while(i < T.length) {
        if(j==0 || T[i]==T[j]) {
            ++i; ++j;
            next[i] = j; // 记录 next
            
            // --- NextVal 优化检查 ---
            if(T[i] != T[j]) 
                nextval[i] = j; // 无需优化
            else 
                nextval[i] = nextval[j]; // 递归优化
        } else {
            j = next[j]; // 失配回溯
        }
    }
}`;

const KMPComparisonPlayground = () => {
  const [pattern, setPattern] = useState('ababaa');

  // 缓存帧数据
  const frames = useMemo(() => {
    if (!pattern) return [];
    return generateFrames(pattern);
  }, [pattern]);

  return (
    <div style={{ marginTop: 20 }}>
      {/* 输入框 */}
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
          推荐测试: "aaaaa", "ababaa", "aaaab"
        </div>
      </div>

      <AlgoPlayer
        key={pattern}
        code={CODE_COMPARE}
        frames={frames}
        Visualizer={ComparisonVisualizer}
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

export default KMPComparisonPlayground;