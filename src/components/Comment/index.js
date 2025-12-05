import React from 'react';
import Giscus from '@giscus/react';
import { useColorMode } from '@docusaurus/theme-common'; // 用于获取当前是深色还是浅色模式

export default function Comment() {
  const { colorMode } = useColorMode(); // 'dark' or 'light'

  return (
    <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid var(--ifm-color-emphasis-200)' }}>
      <h3>💬 留下你的问题或见解</h3>
      <Giscus
        id="comments"
        // ⚠️ 下面这两行必须换成你在第二步里获取的真实 ID
        repo="Xuuuuu-fan/my-algo-platform"
        repoId="R_kgDOQi-WKw"

        category="Q&A" // 或者 General，取决于你在官网的选择
        categoryId="DIC_kwDOQi-WK84CzbAn"

        mapping="pathname" // 根据路径区分评论区
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        // 自动适配主题：如果是 dark 模式用 dark 主题，否则用 light
        theme={colorMode === 'dark' ? 'dark_dimmed' : 'light'}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}