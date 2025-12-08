---
id: return
title: 二、队列的顺序存储（循环队列）
sidebar_position: 2
---



顺序存储的队列若直接采用普通数组实现，会出现“假溢出”问题，因此引入**循环队列**优化空间利用。

### 1. 循环队列的核心原理
循环队列通过**取模运算**让队列首尾相连，解决普通顺序队列的空间浪费问题，其核心指针规则如下：
- 初始化时，`front`（队头指针）和`rear`（队尾指针）均指向0
- 队满条件：`(Q.rear + 1) % MaxSize == Q.front`（预留一个空位置避免队空和队满条件混淆）
- 队空条件：`Q.rear == Q.front`
- 入队时队尾指针后移：`Q.rear = (Q.rear + 1) % MaxSize`
- 出队时队头指针后移：`Q.front = (Q.front + 1) % MaxSize`

### 2. 循环队列完整实现代码

import CppRunner from '@site/src/components/CppRunner';

<CppRunner initialCode={`#include <iostream>
using namespace std;
using ElemType = int;
#define MaxSize 10
// 定义循环队列结构
typedef struct {
    ElemType data[MaxSize];
    int front, rear;
} SqQueue;
// 初始化队列
void InitQueue(SqQueue& Q) {
    Q.rear = Q.front = 0;
}
// 判断队列是否为空
bool QueueEmpty(SqQueue Q) {
    return Q.rear == Q.front;
}
// 入队操作
bool EnQueue(SqQueue& Q, ElemType x) {
    if ((Q.rear + 1) % MaxSize == Q.front)   // 队列已满
        return false;
    Q.data[Q.rear] = x;                      // 新元素插入队尾
    Q.rear = (Q.rear + 1) % MaxSize;         // 队尾指针循环后移
    return true;
}
// 出队操作
bool DeQueue(SqQueue& Q, ElemType& x) {
    if (QueueEmpty(Q))          // 队空无法出队
        return false;
    x = Q.data[Q.front];        // 取出队头元素
    Q.front = (Q.front + 1) % MaxSize; // 队头指针循环后移
    return true;
}
// 读取队头元素（不出队）
bool GetHead(SqQueue Q, ElemType& x) {
    if (QueueEmpty(Q))
        return false;
    x = Q.data[Q.front];
    return true;
}
// 测试代码
int main() {
    SqQueue Q;
    InitQueue(Q);
    // 入队测试
    EnQueue(Q, 10);
    EnQueue(Q, 20);
    EnQueue(Q, 30);
    // 读取队头
    ElemType head;
    GetHead(Q, head);
    cout << "队头元素：" << head << endl;
    // 出队测试
    ElemType e;
    DeQueue(Q, e);
    cout << "出队元素：" << e << endl;
    cout << "当前front：" << Q.front << "，当前rear：" << Q.rear << endl;
    return 0;
}
`} />


### 3. 运行结果
```
队头元素：10
出队元素：10
当前front：1，当前rear：3
```
