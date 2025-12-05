import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './styles.module.css';

// 代码显示组件
const CodeView = ({ codeLines, activeLine }) => {
  return (
    <div className={styles.codePanel}>
      <pre>
        <code>
          {codeLines.map((line, index) => (
            <div
              key={index}
              className={clsx(styles.codeLine, {
                [styles.activeLine]: index + 1 === activeLine
              })}
            >
              <span className={styles.lineNum}>{index + 1}</span>
              <span className={styles.lineContent}>{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

// 核心播放器容器
const AlgoPlayer = ({
  frames,      // 动画帧数据
  code,        // 代码字符串
  Visualizer,  // 可视化组件
}) => {
  // 【关键修复】如果 frames 为空或未定义，直接返回 Loading 状态，防止崩溃
  if (!frames || frames.length === 0) {
    return (
      <div className={styles.container} style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#8b949e' }}>⏳ 正在初始化演示数据...</div>
      </div>
    );
  }

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 确保 currentStep 不会越界 (比如切换 Tab 时 frames 长度变了)
  useEffect(() => {
    if (currentStep >= frames.length) {
      setCurrentStep(0);
    }
  }, [frames.length]);

  const totalSteps = frames.length;
  // 安全获取当前帧，如果越界则取第一帧
  const currentFrame = frames[currentStep] || frames[0];
  const codeLines = code.split('\n');

  // 自动播放逻辑
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < totalSteps - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 1000); // 1秒一步
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSteps]);

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, totalSteps - 1));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 0));
  const reset = () => { setIsPlaying(false); setCurrentStep(0); };

  return (
    <div className={styles.container}>
      {/* 顶部标题栏 */}
      <div className={styles.header}>
        <span className={styles.stepBadge}>Step {currentStep + 1}/{totalSteps}</span>
        <span className={styles.description}>
            {/* 这里使用了安全访问 */}
            {currentFrame ? currentFrame.desc : 'Loading...'}
        </span>
      </div>

      <div className={styles.mainArea}>
        {/* 左侧：代码区 */}
        <CodeView codeLines={codeLines} activeLine={currentFrame ? currentFrame.line : 0} />

        {/* 右侧：动画可视化区 */}
        <div className={styles.visualPanel}>
          {currentFrame && <Visualizer data={currentFrame.data} />}
        </div>
      </div>

      {/* 底部：控制栏 */}
      <div className={styles.controls}>
        <button onClick={reset} className={styles.btn}>⏮ 重置</button>
        <button onClick={prevStep} disabled={currentStep === 0} className={styles.btn}>◀ 上一步</button>
        <button onClick={() => setIsPlaying(!isPlaying)} className={styles.btnPrimary}>
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button onClick={nextStep} disabled={currentStep === totalSteps - 1} className={styles.btn}>下一步 ▶</button>
      </div>
    </div>
  );
};

export default AlgoPlayer;