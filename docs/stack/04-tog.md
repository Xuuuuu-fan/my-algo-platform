---
id: tog
title: 四、共享栈
sidebar_position: 4
---


### 1. 定义
两个栈共享同一片内存空间，从**两边往中间增长**，可有效节省内存。
### 2. 核心规则
- **初始化**：0号栈（左栈）栈顶指针`top0 = -1`；1号栈（右栈）栈顶指针`top1 = MaxSize`
- **栈满条件**：`top0 + 1 == top1`（两栈顶指针相邻）

import SharedStackVisualizer from '@site/src/components/AlgoScenes/SharedStackVisualizer';

 

### 3.动态演示

利用栈底位置相对不变的特性，可以让两个顺序栈共享一个一维数组空间，将两个栈的栈底分别设置在共享空间的两端，两个栈顶向共享空间的中间延伸。

#### 核心特性
1.  **top0**: 栈0栈顶，初始为 `-1`。
2.  **top1**: 栈1栈顶，初始为 `MaxSize`。
3.  **栈满条件**: `top0 + 1 == top1` (两指针相遇)。

请尝试分别向两个栈 Push 元素，观察它们是如何向中间靠拢的，直到发生**栈满 (Stack Overflow)**。

<SharedStackVisualizer />

### 4. 共享栈代码示例


import CppRunner from '@site/src/components/CppRunner';

<CppRunner initialCode={`#include <iostream>
using namespace std;
constexpr int MaxSize = 10;
using ElemType = int;
/*---------- 共享栈结构 ----------*/
struct ShStack {
    ElemType data[MaxSize];
    int top0;   // 左栈顶，空时为 -1
    int top1;   // 右栈顶，空时为 MaxSize
};
/*---------- 基本操作 ----------*/
void InitStack(ShStack &S) {
    S.top0 = -1;
    S.top1 = MaxSize;
}
bool Stack0Empty(const ShStack &S) { return S.top0 == -1; }
bool Stack1Empty(const ShStack &S) { return S.top1 == MaxSize; }
bool StackFull(const ShStack &S)  { return S.top0 + 1 == S.top1; }
/* 左栈进栈 */
bool Push0(ShStack &S, ElemType x) {
    if (StackFull(S)) return false;
    S.data[++S.top0] = x;
    return true;
}
/* 右栈进栈 */
bool Push1(ShStack &S, ElemType x) {
    if (StackFull(S)) return false;
    S.data[--S.top1] = x;
    return true;
}
/* 左栈出栈 */
bool Pop0(ShStack &S, ElemType &x) {
    if (Stack0Empty(S)) return false;
    x = S.data[S.top0--];
    return true;
}
/* 右栈出栈 */
bool Pop1(ShStack &S, ElemType &x) {
    if (Stack1Empty(S)) return false;
    x = S.data[S.top1++];
    return true;
}
/*---------- 测试 ----------*/
int main() {
    ShStack S;
    InitStack(S);
    for (int i = 1; i <= 6; ++i) Push0(S, i);   // 左栈：1 2 3 4 5 6
    for (int i = 10; i >= 7; --i) Push1(S, i);  // 右栈：10 9 8 7
    ElemType x;
    while (!Stack0Empty(S)) { Pop0(S, x); cout << "左栈出: " << x ; }
    while (!Stack1Empty(S)) { Pop1(S, x); cout << "右栈出: " << x ; }
    return 0;
}
`} />
