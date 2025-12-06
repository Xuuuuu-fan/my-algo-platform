import React, { useState, useEffect } from 'react';
import AlgoPlayer from '../AlgoPlayer'; // 复用之前的播放器
import BracketSyncVisualizer from './BracketSyncVisualizer';

// 1. 左侧显示的 C++ 代码
const CPP_CODE = `bool bracketCheck(string str) {
    Stack s;
    for (int i = 0; i < str.length(); i++) {
        char c = str[i];
        if (c == '(' || c == '[' || c == '{') {
            s.push(c); // 左括号入栈
        } else {
            if (s.empty()) return false; // 栈空，右括号多了
            
            char top = s.pop(); // 出栈
            
            if (!match(top, c)) return false; // 左右不匹配
        }
    }
    return s.empty(); // 栈空则成功
}`;

// 2. 帧生成逻辑
const generateFrames = (inputStr) => {
  const frames = [];
  const stack = []; // 逻辑栈
  const renderStack = []; // 渲染栈 (带ID)
  let frameId = 0;

  // 辅助：添加一帧
  const addFrame = (line, desc, popped = null, status = 'running') => {
    frames.push({
      line,
      desc,
      data: {
        str: inputStr,
        index: i, // 当前循环到的索引
        stack: JSON.parse(JSON.stringify(renderStack)),
        popped,
        status
      }
    });
  };

  // 初始帧
  let i = -1;
  addFrame(2, "初始化栈 s", null, 'running');

  // 模拟循环
  for (i = 0; i < inputStr.length; i++) {
    const c = inputStr[i];
    addFrame(3, `循环 i=${i}，当前字符: '${c}'`);

    if ('([{'.includes(c)) {
      addFrame(5, `'${c}' 是左括号，准备入栈`);
      // 入栈逻辑
      stack.push(c);
      renderStack.push({ val: c, id: frameId++ });
      addFrame(6, `Push('${c}')`, null, 'running');
    } else {
      addFrame(7, `'${c}' 是右括号，进入 else 分支`);

      if (stack.length === 0) {
        addFrame(8, `错误：栈为空，无法匹配右括号 '${c}'`, null, 'error');
        return frames;
      }

      // 出栈逻辑
      const top = stack.pop();
      const topItem = renderStack.pop(); // 获取渲染对象
      addFrame(10, `Pop()：取出栈顶元素 '${top}'`, top, 'running');

      const isMatch =
        (top === '(' && c === ')') ||
        (top === '[' && c === ']') ||
        (top === '{' && c === '}');

      if (!isMatch) {
        addFrame(12, `错误：'${top}' 与 '${c}' 不匹配`, top, 'error');
        return frames;
      } else {
        addFrame(12, `匹配成功：'${top}' 与 '${c}' 是一对`, top, 'success');
      }
    }
  }

  // 循环结束
  i = -1; // 指针复位或消失
  if (stack.length === 0) {
    addFrame(15, "遍历结束且栈为空 -> 匹配成功！", null, 'success');
  } else {
    addFrame(15, `遍历结束但栈不空 (剩余 ${stack.length} 个) -> 匹配失败`, null, 'error');
  }

  return frames;
};

// 3. 整合组件
const BracketMatchCodeDemo = () => {
  const [input, setInput] = useState('([{}])');
  const [frames, setFrames] = useState([]);

  useEffect(() => {
    setFrames(generateFrames(input));
  }, [input]);

  return (
    <div>
      <div style={{ marginBottom: 15, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#fff' }}>测试用例:</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #30363d', background: '#0d1117', color: '#fff', fontFamily: 'monospace' }}
        />
        <span style={{ fontSize: 12, color: '#8b949e' }}>(尝试修改字符串，动画会自动更新)</span>
      </div>

      <AlgoPlayer
        key={input} // 字符串变化时重置播放器
        code={CPP_CODE}
        frames={frames}
        Visualizer={BracketSyncVisualizer}
      />
    </div>
  );
};

export default BracketMatchCodeDemo;