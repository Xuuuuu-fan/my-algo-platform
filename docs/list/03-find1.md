---
id: find1
title: 三、顺序表的按位查找
sidebar_position: 3
---

import SeqListSearch from '@site/src/components/AlgoScenes/SeqListSearch';

<SeqListSearch />

### 1. 按位查找实现（动态数组版）
```cpp
#include <iostream>
using namespace std;

typedef int ElemType;  // 定义元素类型（便于后续修改为其他类型，如char、float）
#define InitSize 100    // 动态数组初始容量（可后续扩容，区别于静态数组）

typedef struct {
    ElemType* data;  // 指针：指向动态分配的数组（内存空间可动态调整）
    int MaxSize;     // 动态数组的当前最大容量
    int length;      // 当前有效元素个数
} SeqList;  // 动态顺序表类型名

// 按位查找：返回顺序表L中位序i的元素值（位序从1开始）
ElemType GetElem(SeqList L, int i) {
    // 隐含校验：实际使用时需先判断i的合法性（1<=i<=L.length）
    return L.data[i - 1];  // 核心：直接通过下标访问（顺序表支持随机访问）
}
```

### 2. 按位查找测试主函数
```cpp
int main() {
    SeqList L;
    // 动态分配内存：为数组data分配InitSize个ElemType类型的空间
    L.data = new ElemType[InitSize];
    L.MaxSize = InitSize;  // 初始最大容量为100
    L.length = 5;          // 当前有效元素个数为5
    // 生成测试数据：10、20、30、40、50
    for (int j = 0; j < L.length; j++) {
        L.data[j] = (j + 1) * 10;  // j=0→10（位序1），j=2→30（位序3）
    }
    // 查找位序3的元素（预期结果：30）
    cout << "第三个元素为：" << GetElem(L, 3) << endl;  // 输出：30
    // 动态内存释放：避免内存泄漏（动态分配的空间需手动释放）
    delete[] L.data;
    L.data = nullptr;  // 避免野指针
    return 0;
}
```

### 3. 按位查找核心优势与时间复杂度
- **核心优势**：顺序表的元素存储在连续内存中，支持**随机访问**（即通过下标直接定位元素），无需遍历；
- **时间复杂度**：无论表长多大，仅需 1 次下标访问操作，时间复杂度为 **O(1)**（常数阶）。
