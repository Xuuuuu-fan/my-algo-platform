---
id: chain
title: 三、队列的链式实现
sidebar_position: 3
---


链式队列通过链表存储元素，分为**带头结点**和**不带头结点**两种实现方式，可灵活应对动态元素数量场景。
链式队列本质上是一个同时带有 **队头指针 (front)** 和 **队尾指针 (rear)** 的单链表。

### 核心考点：带头结点 vs 不带头结点

在考试和实际编程中，区分这两种实现方式非常重要。

*   **带头结点**：引入一个不存数据的 dummy node，简化了空队列和非空队列的操作统一性。
*   **不带头结点**：更节省空间，但代码逻辑需要处理 `NULL` 的边界情况。

### 动态对比演示

<QueueLinkedVisualizer />

import QueueLinkedVisualizer from '@site/src/components/AlgoScenes/QueueLinkedVisualizer';

### 1. 带头结点的链式队列
带头结点的链式队列会额外创建一个头结点，避免插入第一个元素时的指针特殊处理。

#### （1）核心操作逻辑
- **初始化**：`front`和`rear`均指向头结点，头结点`next`为NULL
- **入队**：新结点插入到`rear`之后，更新`rear`指针
- **出队**：删除头结点的后继结点，若删除的是最后一个元素，需同步更新`rear`指针

#### （2）完整实现代码

import CppRunner from '@site/src/components/CppRunner';

<CppRunner initialCode={`#include <iostream>
using namespace std;
using ElemType = int;
// 定义链表结点
typedef struct LinkNode {
    ElemType data;
    struct LinkNode* next;
} LinkNode;
// 定义链式队列
typedef struct {
    LinkNode* front, * rear;
} LinkQueue;
// 初始化队列（带头结点）
void InitQueue(LinkQueue& Q) {
    Q.front = Q.rear = (LinkNode*)malloc(sizeof(LinkNode));
    Q.front->next = NULL;
}
// 判断队列是否为空
bool IsEmpty(LinkQueue Q) {
    return Q.front == Q.rear;
}
// 入队操作
void EnQueue(LinkQueue& Q, ElemType x) {
    LinkNode* s = (LinkNode*)malloc(sizeof(LinkNode));
    s->data = x;
    s->next = NULL;
    Q.rear->next = s;
    Q.rear = s;
}
// 出队操作
bool DeQueue(LinkQueue& Q, ElemType& x) {
    if (IsEmpty(Q))
        return false;
    LinkNode* p = Q.front->next;
    x = p->data;
    Q.front->next = p->next;
    if (Q.rear == p)  // 最后一个元素出队
        Q.rear = Q.front;
    free(p);
    return true;
}
// 测试代码
int main() {
    LinkQueue Q;
    InitQueue(Q);
    // 入队测试
    cout << "入队元素：";
    for (int i = 1; i <= 5; ++i) {
        EnQueue(Q, i * 10);
        cout << i * 10 << " ";
    }
    cout << endl;
    // 出队测试
    cout << "出队元素：";
    ElemType x;
    while (!IsEmpty(Q)) {
        DeQueue(Q, x);
        cout << x << " ";
    }
    cout << endl;
    // 释放头结点
    free(Q.front);
    return 0;
}
`} />


### 2. 不带头结点的链式队列
不带头结点的链式队列无额外头结点，插入第一个元素时需同时修改`front`和`rear`指针。

#### （1）核心操作逻辑
- **初始化**：`front`和`rear`均为NULL
- **入队**：若队列为空，`front`和`rear`均指向新结点；否则插入到`rear`之后
- **出队**：若删除最后一个元素，需将`front`和`rear`重置为NULL

#### （2）完整实现代码

<CppRunner initialCode={`#include <iostream>
using namespace std;
using ElemType = int;
// 定义链表结点
typedef struct LinkNode {
    ElemType data;
    struct LinkNode* next;
} LinkNode;
// 定义链式队列
typedef struct {
    LinkNode* front, * rear;
} LinkQueue;
// 初始化队列（不带头结点）
void InitQueue(LinkQueue& Q) {
    Q.front = NULL;
    Q.rear = NULL;
}
// 判断队列是否为空
bool IsEmpty(LinkQueue Q) {
    return Q.front == NULL;
}
// 入队操作
void EnQueue(LinkQueue& Q, ElemType x) {
    LinkNode* s = (LinkNode*)malloc(sizeof(LinkNode));
    s->data = x;
    s->next = NULL;
    if (Q.front == NULL) {  // 空队列插入第一个元素
        Q.front = s;
        Q.rear = s;
    } else {
        Q.rear->next = s;
        Q.rear = s;
    }
}
// 出队操作
bool DeQueue(LinkQueue& Q, ElemType& x) {
    if (IsEmpty(Q))
        return false;
    LinkNode* p = Q.front;
    x = p->data;
    Q.front = p->next;
    if (Q.rear == p) {  // 最后一个元素出队
        Q.front = NULL;
        Q.rear = NULL;
    }
    free(p);
    return true;
}
// 测试代码
int main() {
    LinkQueue Q;
    InitQueue(Q);
    // 入队测试
    for (int i = 1; i <= 5; ++i) {
        EnQueue(Q, i * 10);
        cout << "入队：" << i * 10 << endl;
    }
    // 出队测试
    ElemType x;
    while (!IsEmpty(Q)) {
        DeQueue(Q, x);
        cout << "出队：" << x << endl;
    }
    return 0;
}
`} />

