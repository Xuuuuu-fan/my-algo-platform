import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
// 1. 引入新的 3D 组件
import SolarSystem3D from '@site/src/components/SolarSystem3D';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout
      title={`Hello ${siteConfig.title}`}
      description="数据结构与算法可视化学习平台">

      {/* 2. 直接渲染 3D 容器 */}
      <main style={{
          width: '100%',
          minHeight: '100vh',
          background: '#000', // 纯黑背景适配太空
      }}>

        {/* 3D 场景组件 */}
        <SolarSystem3D />

      </main>

    </Layout>
  );
}