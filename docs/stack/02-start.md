---
id: start
title: 二、栈的初始化（顺序栈）
sidebar_position: 2
---
import SeqStackInitDemo from '@site/src/components/AlgoScenes/SeqStackInitDemo';
import CppRunner from '@site/src/components/CppRunner';

顺序栈采用静态数组存储元素，需定义栈顶指针`top`。
### 1. **初始化规则**
    - 栈空时，`top`指向`data[0]`上一个位置，即**top = -1**
    - 判空条件：`top == -1`时栈空，`top != -1`时栈非空

初始化操作主要是完成对栈空间的申请，以及指针的归位。

:::info 关键点
**空栈的标志**：`S.top == S.base`。
:::

<SeqStackInitDemo />



### 2. **初始化代码示例**

你可以直接在下方修改代码并点击运行：

<CppRunner initialCode={`#include <iostream>
using namespace std;
using ElemType = int; 
#define MaxSize 10
typedef struct {
    ElemType data[MaxSize];     // 静态数组存放栈中元素
    int top;     // 栈顶指针 
} SqStack;
// 初始化栈
void InitStack(SqStack& S) {
    S.top = -1;
}
// 判断栈空
bool StackEmpty(SqStack S) {
    if (S.top == -1) {
        return true;
    } else {
        return false;
    }
}
int main() {
    SqStack S;
    InitStack(S);
    cout << (StackEmpty(S) ? "栈空" : "栈非空") << endl;
    return 0;
}`} />