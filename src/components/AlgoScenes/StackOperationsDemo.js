import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 配置：栈的最大容量
const MAX_SIZE = 5;
const ITEM_HEIGHT = 50;

const StackOperationsDemo = () => {
  // 核心状态
  const [stack, setStack] = useState([]);           // 栈数据
  const [isInitialized, setIsInitialized] = useState(false); // 栈是否存在
  const [inputValue, setInputValue] = useState(''); // 输入框的值
  const [message, setMessage] = useState('请先初始化栈'); // 操作日志
  const [highlightTop, setHighlightTop] = useState(false); // 用于 GetTop 高亮

  // --- 1. InitStack(&S) ---
  const handleInit = () => {
    setStack([]);
    setIsInitialized(true);
    setMessage('✅ InitStack: 栈已初始化，内存已分配。');
  };

  // --- 2. DestroyStack(&S) ---
  const handleDestroy = () => {
    setStack([]);
    setIsInitialized(false);
    setMessage('💥 DestroyStack: 栈已销毁，内存已释放。');
  };

  // --- 3. Push(&S, x) ---
  const handlePush = () => {
    if (!isInitialized) {
      setMessage('❌ 错误: 栈未初始化 (请点击 InitStack)');
      return;
    }
    if (stack.length >= MAX_SIZE) {
      setMessage('⚠️ 栈满 (Stack Overflow): 无法继续进栈');
      return;
    }
    if (!inputValue) {
      setMessage('⚠️ 请输入要进栈的元素值');
      return;
    }

    const newVal = inputValue;
    setStack(prev => [...prev, newVal]); // 尾部追加
    setInputValue(''); // 清空输入框
    setMessage(`📥 Push: 元素 "${newVal}" 入栈成功`);
  };

  // --- 4. Pop(&S, &x) ---
  const handlePop = () => {
    if (!isInitialized) return setMessage('❌ 错误: 栈未初始化');
    if (stack.length === 0) return setMessage('⚠️ 栈空 (Stack Underflow): 无法出栈');

    const poppedVal = stack[stack.length - 1];
    setStack(prev => prev.slice(0, -1)); // 移除最后一个
    setMessage(`📤 Pop: 栈顶元素 "${poppedVal}" 已出栈`);
  };

  // --- 5. GetTop(S, &x) ---
  const handleGetTop = () => {
    if (!isInitialized) return setMessage('❌ 错误: 栈未初始化');
    if (stack.length === 0) return setMessage('⚠️ 栈空: 没有栈顶元素');

    const topVal = stack[stack.length - 1];
    setMessage(`👀 GetTop: 当前栈顶元素是 "${topVal}"`);

    // 触发高亮动画
    setHighlightTop(true);
    setTimeout(() => setHighlightTop(false), 1000);
  };

  // --- 6. StackEmpty(S) ---
  const handleStackEmpty = () => {
    if (!isInitialized) return setMessage('❌ 错误: 栈未初始化');
    const isEmpty = stack.length === 0;
    setMessage(`❓ StackEmpty: ${isEmpty ? 'True (栈为空)' : 'False (栈不为空)'}`);
  };

  return (
    <div style={{
      border: '1px solid #30363d',
      borderRadius: '12px',
      background: '#0d1117',
      padding: '20px',
      margin: '20px 0',
      fontFamily: 'Inter, sans-serif'
    }}>

      {/* 顶部：可视化区域 */}
      <div style={{
        height: '320px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        position: 'relative',
        marginBottom: '20px',
        background: '#010409',
        borderRadius: '8px',
        border: '1px dashed #30363d'
      }}>

        {/* 栈容器 (U型结构) */}
        <div style={{
          width: '120px',
          height: `${MAX_SIZE * ITEM_HEIGHT + 10}px`,
          borderLeft: '4px solid #30363d',
          borderRight: '4px solid #30363d',
          borderBottom: '4px solid #30363d',
          borderRadius: '0 0 8px 8px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column-reverse', // 让数组第一个元素在最下面
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingBottom: '5px',
          opacity: isInitialized ? 1 : 0.3 // 未初始化变暗
        }}>

          {/* 栈未初始化时的提示 */}
          {!isInitialized && (
            <div style={{
              position: 'absolute', top: '50%', width: '100%',
              textAlign: 'center', color: '#ff4d4f', fontWeight: 'bold'
            }}>
              未分配内存
            </div>
          )}

          <AnimatePresence>
            {stack.map((item, index) => {
              const isTop = index === stack.length - 1;
              return (
                <motion.div
                  key={`${index}-${item}`} // 简单的唯一key
                  layout
                  initial={{ opacity: 0, y: -200, scale: 0.5 }} // 从上方落下
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    backgroundColor: (isTop && highlightTop) ? '#f39c12' : '#1f6feb', // GetTop 高亮逻辑
                    borderColor: (isTop && highlightTop) ? '#fff' : '#58a6ff'
                  }}
                  exit={{ opacity: 0, y: -50, scale: 0.5 }} // 向上消失
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    width: '90%',
                    height: `${ITEM_HEIGHT - 4}px`,
                    margin: '2px 0',
                    borderRadius: '4px',
                    border: '1px solid',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    position: 'relative'
                  }}
                >
                  {item}
                  <span style={{
                    position: 'absolute', left: '-35px', color: '#8b949e', fontSize: '10px'
                  }}>
                    {index}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Top 指针 */}
          {isInitialized && (
            <motion.div
              animate={{ y: -(stack.length * ITEM_HEIGHT) }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{
                position: 'absolute',
                left: '130px',
                bottom: '15px', // 基础底部位置
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span style={{fontSize: '20px'}}>👈</span>
              <span style={{
                background: '#238636', color: 'white', padding: '2px 6px',
                borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
              }}>
                Top 指针
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* 中间：信息提示栏 */}
      <div style={{
        background: '#161b22', padding: '10px', borderRadius: '6px',
        marginBottom: '20px', minHeight: '40px', display: 'flex', alignItems: 'center',
        borderLeft: '4px solid #00d8ff', color: '#e6edf3'
      }}>
        {message}
      </div>

      {/* 底部：控制面板 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>

        {/* 第一组：生命周期 */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleInit} style={btnStyle('#238636')} disabled={isInitialized}>
            InitStack(&S)
          </button>
          <button onClick={handleDestroy} style={btnStyle('#da3633')} disabled={!isInitialized}>
            DestroyStack(&S)
          </button>
        </div>

        {/* 第二组：查询 */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={handleGetTop} style={btnStyle('#9e6a03')} disabled={!isInitialized}>
            GetTop(S, &x)
          </button>
          <button onClick={handleStackEmpty} style={btnStyle('#1f6feb')} disabled={!isInitialized}>
            StackEmpty(S)
          </button>
        </div>

        {/* 第三组：Push 操作 */}
        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', borderTop: '1px solid #30363d', paddingTop: '15px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入元素 x"
            style={{
              padding: '8px', borderRadius: '6px', border: '1px solid #30363d',
              background: '#0d1117', color: '#fff', flex: 1
            }}
            disabled={!isInitialized}
          />
          <button onClick={handlePush} style={btnStyle('#1f6feb', true)} disabled={!isInitialized}>
            Push(&S, x)
          </button>
          <button onClick={handlePop} style={btnStyle('#d29922', true)} disabled={!isInitialized}>
            Pop(&S, &x)
          </button>
        </div>

      </div>
    </div>
  );
};

// 样式辅助函数
const btnStyle = (color, isBig = false) => ({
  padding: isBig ? '8px 24px' : '8px 12px',
  borderRadius: '6px',
  border: 'none',
  background: color,
  color: 'white',
  fontWeight: 'bold',
  cursor: 'pointer',
  opacity: 1,
  transition: '0.2s',
  fontSize: '13px',
  // disabled 样式通常由 css 控制，这里简化处理
});

export default StackOperationsDemo;