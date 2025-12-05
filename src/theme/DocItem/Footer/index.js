import React from 'react';
// 引入原本的 Footer 组件（保留原有的上一页/下一页按钮）
import Footer from '@theme-original/DocItem/Footer';
// 引入我们的评论组件
import Comment from '@site/src/components/Comment';

export default function FooterWrapper(props) {
  return (
    <>
      {/* 渲染原本的底部（编辑按钮、最后更新时间等） */}
      <Footer {...props} />

      {/* 在底部追加评论区 */}
      <Comment />
    </>
  );
}