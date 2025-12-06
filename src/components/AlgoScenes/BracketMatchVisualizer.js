import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BRACKET_PAIRS = { ')': '(', ']': '[', '}': '{' };
const OPEN_BRACKETS = ['(', '[', '{'];

const BracketMatchVisualizer = () => {
  const [inputStr, setInputStr] = useState('([{}])'); // 默认用例
  const [stack, setStack] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  const [message, setMessage] = useState('点击“开始匹配”运行算法');

  const isRunning = useRef(false);

  // 延时函数
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const runSimulation = async () => {
    if (isRunning.current) return;
    isRunning.current = true;

    // 重置状态
    setStack([]);
    setCurrentIndex(-1);
    setStatus('running');
    setMessage('开始扫描...');

    const chars = inputStr.split('');
    const tempStack = []; // 用于逻辑判断的临时栈，state用于渲染

    for (let i = 0; i < chars.length; i++) {
      setCurrentIndex(i);
      const char = chars[i];

      // 1. 如果是左括号 -> 入栈
      if (OPEN_BRACKETS.includes(char)) {
        setMessage(`遇到左括号 "${char}"，入栈等待匹配`);
        tempStack.push({ val: char, id: i }); // id用于React key
        setStack([...tempStack]); // 更新视图
        await sleep(1000);
      }
      // 2. 如果是右括号
      else if (BRACKET_PAIRS[char]) {
        setMessage(`遇到右括号 "${char}"，检查栈顶...`);
        await sleep(800);

        // 2.1 栈空 -> 失败
        if (tempStack.length === 0) {
          setStatus('error');
          setMessage(`❌ 匹配失败！多余的右括号 "${char}"`);
          isRunning.current = false;
          return;
        }

        const top = tempStack[tempStack.length - 1];

        // 2.2 匹配 -> 出栈
        if (top.val === BRACKET_PAIRS[char]) {
          setMessage(`✅ "${top.val}" 与 "${char}" 匹配成功，出栈消解`);
          tempStack.pop();
          setStack([...tempStack]); // 更新视图
          await sleep(1000);
        }
        // 2.3 不匹配 -> 失败
        else {
          setStatus('error');
          setMessage(`❌ 匹配失败！期待 "${getPair(top.val)}" 但遇到 "${char}"`);
          isRunning.current = false;
          return;
        }
      }
      // 其他字符忽略
    }

    // 3. 循环结束，检查栈是否为空
    if (tempStack.length === 0) {
      setStatus('success');
      setMessage('🎉 完美匹配！所有括号成对消除。');
    } else {
      setStatus('error');
      setMessage(`❌ 匹配失败！剩余 ${tempStack.length} 个左括号未闭合`);
    }

    setCurrentIndex(-1);
    isRunning.current = false;
  };

  const getPair = (char) => {
    if(char === '(') return ')';
    if(char === '[') return ']';
    if(char === '{') return '}';
    return '?';
  }

  // 颜色辅助
  const getCharColor = (char) => {
    if (['(', ')'].includes(char)) return '#58a6ff'; // 蓝
    if (['[', ']'].includes(char)) return '#bc8cff'; // 紫
    if (['{', '}'].includes(char)) return '#f69d50'; // 橙
    return '#8b949e';
  };

  return (
    <div style={{ border: '1px solid #30363d', borderRadius: 8, padding: 20, background: '#0d1117' }}>

      {/* 顶部控制 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 30, justifyContent: 'center' }}>
        <input
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          disabled={status === 'running'}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #30363d', background: '#161b22', color: '#fff', width: '200px', fontSize: 16, letterSpacing: 2 }}
        />
        <button
          onClick={runSimulation}
          disabled={status === 'running'}
          style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#238636', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {status === 'running' ? '运行中...' : '开始匹配'}
        </button>
      </div>

      {/* 字符串扫描区 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40, gap: 5 }}>
        {inputStr.split('').map((char, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <motion.div
              animate={{
                scale: currentIndex === i ? 1.3 : 1,
                backgroundColor: currentIndex === i ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
              style={{
                width: 30, height: 40, fontSize: 24, fontWeight: 'bold',
                color: getCharColor(char),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 4
              }}
            >
              {char}
            </motion.div>
            {/* 扫描指针 */}
            {currentIndex === i && (
              <motion.div
                layoutId="pointer"
                style={{ color: '#e0a612', fontSize: 20, marginTop: -5 }}
              >
                ▲
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 40, height: 220 }}>

        {/* 左侧：栈的可视化 */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 100, border: '4px solid #30363d', borderTop: 'none', borderRadius: '0 0 8px 8px', position: 'relative', display: 'flex', flexDirection: 'column-reverse', padding: 5, alignItems: 'center' }}>
            <div style={{ position: 'absolute', top: -25, color: '#8b949e', fontSize: 12 }}>栈 (Stack)</div>

            <AnimatePresence>
              {stack.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, x: 50 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    width: '80%', height: 35, marginBottom: 5,
                    background: getCharColor(item.val),
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#0d1117', fontWeight: '900', fontSize: 18,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                  }}
                >
                  {item.val}
                </motion.div>
              ))}
            </AnimatePresence>

            {stack.length === 0 && <div style={{ position: 'absolute', top: '50%', color: '#30363d' }}>Empty</div>}
          </div>
        </div>

        {/* 右侧：状态面板 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            background: '#161b22', padding: 20, borderRadius: 8, border: '1px solid #30363d',
            display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ color: '#8b949e', fontSize: 12, textTransform: 'uppercase' }}>Current Status</div>
            <div style={{
              fontSize: 16, fontWeight: 'bold',
              color: status === 'error' ? '#ff4d4f' : (status === 'success' ? '#2ea043' : '#fff')
            }}>
              {message}
            </div>

            {/* 图例 */}
            <div style={{ marginTop: 20, paddingTop: 15, borderTop: '1px solid #30363d', display: 'flex', gap: 15, fontSize: 12 }}>
              <span style={{color:'#58a6ff'}}>● () 小括号</span>
              <span style={{color:'#bc8cff'}}>● [] 中括号</span>
              <span style={{color:'#f69d50'}}>● {"{}"} 大括号</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BracketMatchVisualizer;