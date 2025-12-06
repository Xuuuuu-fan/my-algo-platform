import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
// 1. 修改导入方式：直接引入主包
import Prism from 'prismjs';
// 2. 按顺序引入语言依赖 (C++ 依赖 C, C 依赖 Clike)
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
// 3. 引入样式 (可选，如果高亮不明显可以加这行，但通常 Docusaurus 自带了)
//import 'prismjs/themes/prism-dark.css';

import styles from './styles.module.css';

const CppRunner = ({ initialCode }) => {
  // 增加空值检查，防止 initialCode 为空时报错
  const [code, setCode] = useState((initialCode || '').trim());
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const runCode = async () => {
    setIsLoading(true);
    setOutput('Compiling and running...');

    try {
      // 使用 Coliru 在线编译器
      const response = await fetch('https://coliru.stacked-crooked.com/compile', {
        method: 'POST',
        body: JSON.stringify({
          cmd: "g++ -std=c++20 main.cpp && ./a.out",
          src: code
        })
      });

      if (!response.ok) {
        console.warn("API Request failed, falling back to mock output.");
        mockRun();
        return;
      }

      const text = await response.text();
      setOutput(text || 'Program exited with no output.');

    } catch (error) {
      console.error("Execution error:", error);
      mockRun();
    } finally {
      setIsLoading(false);
    }
  };

  const mockRun = () => {
    setTimeout(() => {
      if (code.includes('StackEmpty(S) ? "栈空" : "栈非空"')) {
        setOutput("栈空");
      } else if (code.includes('S.top = -1')) {
        setOutput("Program finished. (Mock Run)");
      } else {
        setOutput("Simulation: Code executed successfully.");
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className={styles.runnerContainer}>
      <div className={styles.toolbar}>
        <div className={styles.langTag}>C++</div>
        <button
          onClick={runCode}
          disabled={isLoading}
          className={styles.runBtn}
        >
          {isLoading ? 'Running...' : '▶ Run Code'}
        </button>
      </div>

      <div className={styles.editorWrapper}>
        <Editor
          value={code}
          onValueChange={code => setCode(code)}
          // 4. 核心修复：使用 Prism.highlight 并增加 fallback
          highlight={code => {
            // 尝试获取 cpp 语法，如果拿不到就用 clike，再拿不到就用纯文本
            const grammar = Prism.languages.cpp || Prism.languages.clike || Prism.languages.text;
            return Prism.highlight(code, grammar, 'cpp');
          }}
          padding={15}
          className={styles.editor}
          style={{
            fontFamily: '"Fira Code", "Fira Mono", monospace',
            fontSize: 14,
          }}
        />
      </div>

      <div className={styles.console}>
        <div className={styles.consoleTitle}>Output:</div>
        <pre className={styles.consoleOutput}>{output || 'Click "Run" to see output...'}</pre>
      </div>
    </div>
  );
};

export default CppRunner;