import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 括号颜色映射
const getColor = (char) => {
  if ('()'.includes(char)) return '#58a6ff'; // 蓝
  if ('[]'.includes(char)) return '#bc8cff'; // 紫
  if ('{}'.includes(char)) return '#f69d50'; // 橙
  return '#8b949e';
};

const BracketSyncVisualizer = ({ data }) => {
  // data: { str, index, stack, popped, status }
  const { str, index, stack, popped, status } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '20px' }}>

      {/* 1. 字符串扫描区 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40, gap: 8 }}>
        {str.split('').map((char, i) => (
          <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* 字符本体 */}
            <motion.div
              animate={{
                scale: index === i ? 1.4 : 1,
                color: index === i ? '#fff' : getColor(char),
                backgroundColor: index === i ? getColor(char) : 'transparent',
              }}
              style={{
                width: 32, height: 32, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 'bold', border: '1px solid #30363d'
              }}
            >
              {char}
            </motion.div>

            {/* 扫描指针箭头 */}
            {index === i && (
              <motion.div
                layoutId="pointer"
                style={{ position: 'absolute', bottom: -25, color: '#e0a612', fontSize: 18 }}
              >
                ▲
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* 2. 栈可视区 */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', position: 'relative' }}>

        {/* 栈容器 */}
        <div style={{
          width: 100, minHeight: 200,
          borderLeft: '4px solid #30363d', borderRight: '4px solid #30363d', borderBottom: '4px solid #30363d',
          borderRadius: '0 0 8px 8px',
          display: 'flex', flexDirection: 'column-reverse', alignItems: 'center',
          paddingBottom: 5, background: 'rgba(255,255,255,0.02)'
        }}>
          <span style={{ position: 'absolute', bottom: -25, color: '#8b949e', fontSize: 12 }}>Stack</span>

          <AnimatePresence>
            {stack.map((item) => (
              <motion.div
                key={item.id} // 必须用唯一ID
                initial={{ opacity: 0, y: -100, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0 }} // 出栈向右飞出
                transition={{ type: "spring", bounce: 0.3 }}
                style={{
                  width: '80%', height: 36, marginTop: 4,
                  background: getColor(item.val),
                  borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0d1117', fontWeight: '900', fontSize: 18,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {item.val}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 匹配动效区（显示刚才弹出的元素） */}
        <AnimatePresence>
          {popped && (
            <motion.div
              key="popped-anim"
              initial={{ opacity: 1, x: 0, y: -50 }} // 从栈顶位置开始
              animate={{ x: 120, y: -100, opacity: 0 }} // 向右上方飘散
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              style={{
                position: 'absolute', bottom: 100,
                color: status === 'error' ? '#ff4d4f' : '#2ea043',
                fontSize: 14, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5
              }}
            >
              <span>{popped} 出栈</span>
              {status === 'error' ? '❌' : '✅'}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default BracketSyncVisualizer;