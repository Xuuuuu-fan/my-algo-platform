---
id: chain
title: 六、链栈的增、删、查操作
sidebar_position: 6
---


链栈采用链表实现，不带头结点，空栈时栈顶指针为`nullptr`。
### 1. 链栈代码示例

import CppRunner from '@site/src/components/CppRunner';

<CppRunner initialCode={`#include <iostream>
using namespace std;
using ElemType = int;
/*---------- 结点定义 ----------*/
struct StackNode {
    ElemType data;
    StackNode* next;
};
/*---------- 1. 初始化 ----------*/
void InitStack(StackNode*& S) {   // 引用指针，调用后 S 为 nullptr
    S = nullptr;                  // 不带头结点，空栈时栈顶就是 nullptr
}
/*---------- 2. 判空 ----------*/
bool StackEmpty(StackNode* S) {
    return S == nullptr;
}
/*---------- 3. 入栈（增）----------*/
bool Push(StackNode*& S, ElemType x) {
    StackNode* p = new StackNode;   // 新建结点
    if (!p) return false;           // 内存分配失败
    p->data = x;
    p->next = S;                    // 头插法
    S = p;                          // 更新栈顶
    return true;
}
/*---------- 4. 出栈（删）----------*/
bool Pop(StackNode*& S, ElemType& x) {
    if (StackEmpty(S)) return false;
    StackNode* p = S;               // 暂存栈顶结点
    x = p->data;
    S = S->next;                    // 栈顶下移
    delete p;                       // 释放原栈顶
    return true;
}
/*---------- 5. 获取栈顶元素（查）----------*/
bool GetTop(StackNode* S, ElemType& x) {
    if (StackEmpty(S)) return false;
    x = S->data;
    return true;
}
/*---------- 6. 测试 ----------*/
int main() {
    StackNode* S;
    InitStack(S);
    for (int i = 1; i <= 5; ++i) Push(S, i);   // 入栈 1 2 3 4 5
    ElemType x;
    while (!StackEmpty(S)) {
        GetTop(S, x);
        cout << "栈顶: " << x << "  ";
        Pop(S, x);
        cout << "出栈: " << x ;
    }
    return 0;
}
`} />

```cpp

```
