import React from 'react';
import Layout from '@theme/Layout';
import MessageWall from '@site/src/components/MessageWall';

export default function WallPage() {
  return (
    <Layout
      title="留言墙"
      description="算法学习者的交流天地">
      <main>
        <MessageWall />
      </main>
    </Layout>
  );
}