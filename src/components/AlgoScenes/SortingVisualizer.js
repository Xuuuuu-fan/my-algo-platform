import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 配置与主题 ---
const THEME = {
  bg: '#0d1117',
  panel: '#161b22',
  border: '#30363d',
  bar: '#1f6feb',        // 默认
  compare: '#d29922',    // 比较中 (橙)
  swap: '#da3633',       // 交换/写入 (红)
  sorted: '#2ea043',     // 已排序 (绿)
  text: '#c9d1d9',
  highlight: '#388bfd26' // 代码高亮
};

// --- 算法伪代码与逻辑生成器 ---
const ALGORITHMS = {
  BUBBLE: {
    name: "冒泡排序 (Bubble)",
    code: [
      "for i from 0 to n-1:",
      "  for j from 0 to n-i-1:",
      "    if arr[j] > arr[j+1]:",
      "      swap(arr[j], arr[j+1])"
    ],
    run: function* (arr) {
      const n = arr.length;
      for (let i = 0; i < n - 1; i++) {
        yield { arr: [...arr], line: 0, active: [], sorted: [] };
        for (let j = 0; j < n - i - 1; j++) {
          yield { arr: [...arr], line: 1, active: [j, j + 1], sorted: [] };
          yield { arr: [...arr], line: 2, active: [j, j + 1], sorted: [] };
          if (arr[j] > arr[j + 1]) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            yield { arr: [...arr], line: 3, active: [j, j + 1], swap: true, sorted: [] };
          }
        }
        // 标记末尾已排序
      }
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  },
  SELECTION: {
    name: "选择排序 (Selection)",
    code: [
      "for i from 0 to n-1:",
      "  min = i",
      "  for j from i+1 to n: if arr[j] < arr[min]: min = j",
      "  swap(arr[i], arr[min])"
    ],
    run: function* (arr) {
      const n = arr.length;
      for (let i = 0; i < n; i++) {
        yield { arr: [...arr], line: 0, active: [i], sorted: [] };
        let min = i;
        yield { arr: [...arr], line: 1, active: [min], sorted: [] };
        for (let j = i + 1; j < n; j++) {
          yield { arr: [...arr], line: 2, active: [min, j], sorted: [] };
          if (arr[j] < arr[min]) min = j;
        }
        if (min !== i) {
          [arr[i], arr[min]] = [arr[min], arr[i]];
          yield { arr: [...arr], line: 3, active: [i, min], swap: true, sorted: [] };
        }
      }
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  },
  INSERTION: {
    name: "插入排序 (Insertion)",
    code: [
      "for i from 1 to n:",
      "  key = arr[i]; j = i - 1",
      "  while j >= 0 and arr[j] > key:",
      "    arr[j+1] = arr[j]; j--"
    ],
    run: function* (arr) {
      const n = arr.length;
      for (let i = 1; i < n; i++) {
        yield { arr: [...arr], line: 0, active: [i], sorted: [] };
        let key = arr[i];
        let j = i - 1;
        yield { arr: [...arr], line: 1, active: [i, j], sorted: [] };
        while (j >= 0 && arr[j] > key) {
          yield { arr: [...arr], line: 2, active: [j, j + 1], sorted: [] };
          arr[j + 1] = arr[j];
          yield { arr: [...arr], line: 3, active: [j, j + 1], swap: true, sorted: [] };
          j--;
        }
        arr[j + 1] = key;
      }
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  },
  SHELL: {
    name: "希尔排序 (Shell)",
    code: [
      "for gap = n/2; gap > 0; gap /= 2:",
      "  for i = gap to n:",
      "    temp = arr[i]; j = i",
      "    while j >= gap and arr[j-gap] > temp: move"
    ],
    run: function* (arr) {
      const n = arr.length;
      for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        yield { arr: [...arr], line: 0, active: [], sorted: [] };
        for (let i = gap; i < n; i++) {
          yield { arr: [...arr], line: 1, active: [i], sorted: [] };
          let temp = arr[i];
          let j = i;
          while (j >= gap && arr[j - gap] > temp) {
            yield { arr: [...arr], line: 2, active: [j, j - gap], sorted: [] };
            arr[j] = arr[j - gap];
            yield { arr: [...arr], line: 3, active: [j, j - gap], swap: true, sorted: [] };
            j -= gap;
          }
          arr[j] = temp;
        }
      }
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  },
  QUICK: {
    name: "快速排序 (Quick)",
    code: [
      "pivot = partition(arr, low, high)",
      "check left < right",
      "swap elements < pivot to left",
      "recurse(left, pivot), recurse(pivot+1, right)"
    ],
    run: function* (arr) {
      function* partition(low, high) {
        let pivot = arr[high];
        yield { arr: [...arr], line: 0, active: [high], sorted: [] };
        let i = low - 1;
        for (let j = low; j < high; j++) {
          yield { arr: [...arr], line: 1, active: [j, high], sorted: [] };
          if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
            yield { arr: [...arr], line: 2, active: [i, j], swap: true, sorted: [] };
          }
        }
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        yield { arr: [...arr], line: 2, active: [i + 1, high], swap: true, sorted: [] };
        return i + 1;
      }

      function* quickSort(low, high) {
        if (low < high) {
          yield { arr: [...arr], line: 1, active: [], sorted: [] };
          const pi = yield* partition(low, high);
          yield* quickSort(low, pi - 1);
          yield* quickSort(pi + 1, high);
          yield { arr: [...arr], line: 3, active: [], sorted: [] };
        }
      }
      yield* quickSort(0, arr.length - 1);
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  },
  MERGE: {
    name: "归并排序 (Merge)",
    code: [
      "mid = (left + right) / 2",
      "mergeSort(left, mid); mergeSort(mid+1, right)",
      "merge(arr, left, mid, right)",
      "copy sorted temp back to arr"
    ],
    run: function* (arr) {
      function* merge(l, m, r) {
        yield { arr: [...arr], line: 2, active: [l, r], sorted: [] };
        let n1 = m - l + 1;
        let n2 = r - m;
        let L = new Array(n1);
        let R = new Array(n2);

        for (let i = 0; i < n1; i++) L[i] = arr[l + i];
        for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

        let i = 0, j = 0, k = l;
        while (i < n1 && j < n2) {
          yield { arr: [...arr], line: 3, active: [k], sorted: [] };
          if (L[i] <= R[j]) {
            arr[k] = L[i]; i++;
          } else {
            arr[k] = R[j]; j++;
          }
          yield { arr: [...arr], line: 3, active: [k], swap: true, sorted: [] };
          k++;
        }
        while (i < n1) {
          arr[k] = L[i]; i++; k++;
          yield { arr: [...arr], line: 3, active: [k-1], swap: true, sorted: [] };
        }
        while (j < n2) {
          arr[k] = R[j]; j++; k++;
          yield { arr: [...arr], line: 3, active: [k-1], swap: true, sorted: [] };
        }
      }

      function* sort(l, r) {
        if (l >= r) return;
        let m = l + parseInt((r - l) / 2);
        yield { arr: [...arr], line: 0, active: [], sorted: [] };
        yield* sort(l, m);
        yield* sort(m + 1, r);
        yield* merge(l, m, r);
      }
      yield* sort(0, arr.length - 1);
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  },
  HEAP: {
    name: "堆排序 (Heap)",
    code: [
      "buildMaxHeap(arr)",
      "for i from n-1 down to 0:",
      "  swap(arr[0], arr[i])",
      "  heapify(arr, i, 0)"
    ],
    run: function* (arr) {
      const n = arr.length;
      function* heapify(n, i) {
        let largest = i;
        let l = 2 * i + 1;
        let r = 2 * i + 2;
        yield { arr: [...arr], line: 3, active: [i], sorted: [] };

        if (l < n && arr[l] > arr[largest]) largest = l;
        if (r < n && arr[r] > arr[largest]) largest = r;

        if (largest !== i) {
          [arr[i], arr[largest]] = [arr[largest], arr[i]];
          yield { arr: [...arr], line: 3, active: [i, largest], swap: true, sorted: [] };
          yield* heapify(n, largest);
        }
      }

      yield { arr: [...arr], line: 0, active: [], sorted: [] };
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        yield* heapify(n, i);
      }

      for (let i = n - 1; i > 0; i--) {
        yield { arr: [...arr], line: 1, active: [i], sorted: [] };
        [arr[0], arr[i]] = [arr[i], arr[0]];
        yield { arr: [...arr], line: 2, active: [0, i], swap: true, sorted: [] };
        yield* heapify(i, 0);
      }
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  },
  COUNTING: {
    name: "计数排序 (Counting)",
    code: [
      "count = new Array(max+1).fill(0)",
      "for x in arr: count[x]++",
      "reconstruct arr from count",
      "sorted!"
    ],
    run: function* (arr) {
      let max = Math.max(...arr);
      let count = new Array(max + 1).fill(0);
      yield { arr: [...arr], line: 0, active: [], sorted: [] };

      for(let i=0; i<arr.length; i++) {
        yield { arr: [...arr], line: 1, active: [i], sorted: [] };
        count[arr[i]]++;
      }

      let idx = 0;
      for (let i = 0; i <= max; i++) {
        while (count[i] > 0) {
          arr[idx] = i;
          yield { arr: [...arr], line: 2, active: [idx], swap: true, sorted: [] };
          idx++;
          count[i]--;
        }
      }
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  },
  BUCKET: {
    name: "桶排序 (Bucket)",
    code: [
      "buckets = create_buckets()",
      "scatter elements into buckets",
      "sort each bucket",
      "gather elements back to arr"
    ],
    run: function* (arr) {
      if (arr.length <= 0) return;
      let min = Math.min(...arr);
      let max = Math.max(...arr);
      let bucketCount = Math.floor(arr.length / 2) + 1;
      let buckets = Array.from({ length: bucketCount }, () => []);
      let step = (max - min) / bucketCount;

      yield { arr: [...arr], line: 0, active: [], sorted: [] };

      // Scatter (逻辑演示，视觉上保持原位直到重写)
      for (let i = 0; i < arr.length; i++) {
         yield { arr: [...arr], line: 1, active: [i], sorted: [] };
         let idx = Math.floor((arr[i] - min) / step);
         if(idx >= bucketCount) idx = bucketCount -1;
         buckets[idx].push(arr[i]);
      }

      // Sort and Gather
      let k = 0;
      for (let i = 0; i < buckets.length; i++) {
        yield { arr: [...arr], line: 2, active: [], sorted: [] };
        buckets[i].sort((a, b) => a - b);
        for (let item of buckets[i]) {
          arr[k] = item;
          yield { arr: [...arr], line: 3, active: [k], swap: true, sorted: [] };
          k++;
        }
      }
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  },
  RADIX: {
    name: "基数排序 (Radix)",
    code: [
      "maxVal = getMax(arr)",
      "for exp = 1; maxVal/exp > 0; exp *= 10:",
      "  countingSortByDigit(arr, exp)",
      "  update array order"
    ],
    run: function* (arr) {
      const maxVal = Math.max(...arr);

      for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
        yield { arr: [...arr], line: 1, active: [], sorted: [] };

        let output = new Array(arr.length).fill(0);
        let count = new Array(10).fill(0);

        for (let i = 0; i < arr.length; i++) {
          yield { arr: [...arr], line: 2, active: [i], sorted: [] };
          let digit = Math.floor(arr[i] / exp) % 10;
          count[digit]++;
        }

        for (let i = 1; i < 10; i++) count[i] += count[i - 1];

        for (let i = arr.length - 1; i >= 0; i--) {
          let digit = Math.floor(arr[i] / exp) % 10;
          output[count[digit] - 1] = arr[i];
          count[digit]--;
        }

        for (let i = 0; i < arr.length; i++) {
          arr[i] = output[i];
          yield { arr: [...arr], line: 3, active: [i], swap: true, sorted: [] };
        }
      }
      yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
    }
  }
};

const SortingVisualizer = () => {
  // --- State ---
  const [algoKey, setAlgoKey] = useState('BUBBLE');
  const [inputStr, setInputStr] = useState("50, 20, 10, 80, 60, 30, 90, 40");
  const [array, setArray] = useState([50, 20, 10, 80, 60, 30, 90, 40]);
  const [visualState, setVisualState] = useState({ arr: [], line: -1, active: [], sorted: [] });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [speed, setSpeed] = useState(300);

  // --- Refs for Animation Loop ---
  const generatorRef = useRef(null);
  const timerRef = useRef(null);

  // --- Initialization ---
  const reset = () => {
    stop();
    const cleanArr = parseInput(inputStr);
    setArray(cleanArr);
    setVisualState({ arr: cleanArr, line: -1, active: [], sorted: [] });
    setIsFinished(false);
    // Init Generator
    generatorRef.current = ALGORITHMS[algoKey].run([...cleanArr]);
  };

  useEffect(() => {
    reset();
  }, [algoKey]);

  // --- Helpers ---
  const parseInput = (str) => {
    try {
      return str.split(/[,，\s]+/).map(v => parseInt(v)).filter(v => !isNaN(v)).slice(0, 30);
    } catch {
      return [];
    }
  };

  const generateRandom = () => {
    const rand = Array.from({ length: 15 }, () => Math.floor(Math.random() * 90) + 10);
    const str = rand.join(", ");
    setInputStr(str);
    stop();
    setArray(rand);
    setVisualState({ arr: rand, line: -1, active: [], sorted: [] });
    setIsFinished(false);
    generatorRef.current = ALGORITHMS[algoKey].run([...rand]);
  };

  // --- Animation Logic ---
  const step = () => {
    if (!generatorRef.current) return;
    const { value, done } = generatorRef.current.next();
    if (done) {
      setIsFinished(true);
      stop();
    } else if (value) {
      setVisualState(value);
    }
  };

  const play = () => {
    if (isFinished) reset();
    setIsPlaying(true);
  };

  const stop = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(step, speed);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed]);

  // --- Style Helper ---
  const getBarColor = (idx, val) => {
    if (visualState.sorted && visualState.sorted.includes(idx)) return THEME.sorted; // 已排序
    if (visualState.swap && visualState.active.includes(idx)) return THEME.swap;     // 正在交换/写入
    if (visualState.active.includes(idx)) return THEME.compare;                      // 正在比较
    return THEME.bar;                                                                // 默认
  };

  // --- Render ---
  return (
    <div style={{
      background: THEME.bg, minHeight: '100vh', color: THEME.text,
      fontFamily: 'system-ui, sans-serif', padding: 20
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>十大排序算法动态演示</h2>

      {/* 1. 控制面板 */}
      <div style={{
        background: THEME.panel, padding: 15, borderRadius: 12, border: `1px solid ${THEME.border}`,
        marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'center', justifyContent: 'center'
      }}>
        {/* 算法选择 */}
        <select
          value={algoKey}
          onChange={(e) => setAlgoKey(e.target.value)}
          style={{ padding: '8px', borderRadius: 6, background: THEME.bg, color: 'white', border: `1px solid ${THEME.border}` }}
        >
          {Object.keys(ALGORITHMS).map(key => (
            <option key={key} value={key}>{ALGORITHMS[key].name}</option>
          ))}
        </select>

        {/* 输入数据 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <input
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            placeholder="输入数组，用逗号分隔"
            style={{
              padding: '8px', borderRadius: 6, background: THEME.bg, color: 'white',
              border: `1px solid ${THEME.border}`, width: 200
            }}
          />
          <button onClick={() => { stop(); reset(); }} style={btnStyle}>加载</button>
          <button onClick={generateRandom} style={btnStyle}>随机</button>
        </div>

        {/* 播放控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={isPlaying ? stop : play} style={{ ...btnStyle, background: isPlaying ? THEME.compare : THEME.sorted }}>
            {isPlaying ? '暂停' : isFinished ? '重播' : '开始'}
          </button>
          <button onClick={() => { stop(); step(); }} disabled={isPlaying || isFinished} style={btnStyle}>单步 &gt;</button>
        </div>

        {/* 速度控制 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <span>快</span>
          <input
            type="range" min="50" max="1000" step="50"
            value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ direction: 'rtl' }}
          />
          <span>慢</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>

        {/* 2. 可视化区域 */}
        <div style={{
          flex: 2, minWidth: 300, background: THEME.panel, borderRadius: 12,
          border: `1px solid ${THEME.border}`, padding: 20, height: 400,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4
        }}>
          <AnimatePresence>
            {visualState.arr.map((val, idx) => {
              // 简单归一化高度
              const maxVal = Math.max(...visualState.arr, 100);
              const height = `${(val / maxVal) * 100}%`;
              const color = getBarColor(idx, val);

              return (
                <motion.div
                  key={idx} // 索引key以维持位置，交换时Framer Motion会自动动画
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{
                    height, width: '100%', maxWidth: 40, minWidth: 10,
                    background: color, borderRadius: '4px 4px 0 0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                    fontSize: 10, fontWeight: 'bold', color: '#fff', paddingBottom: 4
                  }}
                >
                  <span style={{ marginBottom: -20, color: THEME.text }}>{idx}</span>
                  {val}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* 3. 代码高亮区域 */}
        <div style={{
          flex: 1, minWidth: 250, background: '#010409', borderRadius: 12,
          border: `1px solid ${THEME.border}`, padding: 15, fontFamily: 'monospace', fontSize: 13
        }}>
          <div style={{ borderBottom: `1px solid ${THEME.border}`, paddingBottom: 10, marginBottom: 10, fontWeight: 'bold', color: THEME.text }}>
            伪代码跟踪
          </div>
          {ALGORITHMS[algoKey].code.map((line, idx) => (
            <motion.div
              key={idx}
              animate={{
                backgroundColor: visualState.line === idx ? THEME.highlight : 'transparent',
                x: visualState.line === idx ? 6 : 0,
                color: visualState.line === idx ? '#fff' : '#6e7681'
              }}
              style={{ padding: '4px 8px', borderRadius: 4, whiteSpace: 'pre-wrap' }}
            >
              {line}
            </motion.div>
          ))}
          <div style={{ marginTop: 20, fontSize: 12, color: '#6e7681' }}>
            当前状态: <br/>
            {isFinished ? <span style={{color: THEME.sorted}}>完成</span> :
             isPlaying ? <span style={{color: THEME.compare}}>运行中...</span> : "就绪"}
          </div>
        </div>

      </div>
    </div>
  );
};

// 简单按钮样式
const btnStyle = {
  background: THEME.panel, color: THEME.text, border: `1px solid ${THEME.border}`,
  padding: '6px 12px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s'
};

export default SortingVisualizer;