---
id: intro
title: 一、顺序表的插入
sidebar_position: 1
---

import SeqListInsertion from '@site/src/components/AlgoScenes/SeqListInsertion';

<SeqListInsertion />

### 1. 顺序表类型定义与初始化
```cpp
#include <iostream>
using namespace std;

#define MaxSize 10  // 宏定义顺序表最大存储容量（静态数组长度固定）

typedef struct {
    int data[MaxSize];  // 静态数组：存储顺序表的元素（连续内存空间）
    int length;         // 记录当前顺序表中有效元素的个数（区别于MaxSize）
} SqList;  // 自定义顺序表类型名，便于后续使用

// 初始化顺序表：将表的长度置为0，表示空表
void InitList(SqList& L) {  // 引用传递&：直接修改原顺序表，而非拷贝
    L.length = 0;  // 空表时无有效元素，长度为0
}
```

### 2. 插入操作实现
```cpp
// 基本操作：在顺序表L的位序i（从1开始）处插入元素e
// 返回值：bool类型，true表示插入成功，false表示失败
bool ListInsert(SqList& L, int i, int e) {
    // 合法性校验1：位序i必须在[1, L.length+1]之间（插入后仍保持连续）
    // 例如：长度为3的表，可插入位置为1、2、3、4（表尾）
    if (i < 1 || i > L.length + 1) {
        cout << "插入位序非法！" << endl;
        return false;
    }
    // 合法性校验2：顺序表已满（当前长度 >= 最大容量），无法插入
    if (L.length >= MaxSize) {
        cout << "顺序表已满，无法插入！" << endl;
        return false;
    }
    // 核心步骤：从表尾开始，将位序i及之后的元素向后移动1位
    // 循环条件j >= i：从最后一个元素（下标L.length-1）移动到第i个元素（下标i-1）
    for (int j = L.length; j >= i; j--) {
        L.data[j] = L.data[j - 1];  // 后移：下标j的位置存储前一个元素的值
    }
    L.data[i - 1] = e;  // 将新元素e存入目标位置（位序i对应数组下标i-1）
    L.length++;         // 插入成功，有效元素个数+1
    return true;
}
```

### 3. 打印顺序表（辅助函数）
```cpp
// 遍历顺序表，打印所有有效元素（用于验证插入/删除结果）
void PrintList(SqList L) {  // 值传递：仅读取表内容，不修改原表
    if (L.length == 0) {    // 空表判断
        cout << "顺序表为空！" << endl;
        return;
    }
    cout << "顺序表元素：";
    for (int i = 0; i < L.length; i++) {  // 遍历所有有效元素（0到length-1）
        cout << L.data[i] << " ";
    }
    cout << endl;  // 换行，优化输出格式
}
```

### 4. 插入测试主函数
```cpp
int main() {
    SqList L;  // 声明一个顺序表变量L
    InitList(L);  // 初始化L为空白表
    // 插入测试用例：逐步插入元素，验证不同位置插入效果
    ListInsert(L, 1, 10);  // 表空时插入到第1位（表头），表变为[10]
    ListInsert(L, 2, 20);  // 插入到第2位（表尾），表变为[10,20]
    ListInsert(L, 3, 30);  // 插入到第3位（表尾），表变为[10,20,30]
    ListInsert(L, 2, 15);  // 插入到第2位（中间位置），表变为[10,15,20,30]
    PrintList(L);  // 输出结果：10 15 20 30
    return 0;
}
```

### 5. 插入操作核心原理
顺序表的元素存储在**连续的内存空间**中，插入元素时需保证内存连续性：
1. 先判断插入位置和表容量是否合法；
2. 从表尾到目标位置，依次后移元素（避免覆盖原有数据）；
3. 插入新元素并更新表长度。

### 6. 插入操作时间复杂度分析
- **最好情况**：插入到表尾（i = L.length + 1），无需移动任何元素，循环执行 0 次，时间复杂度为 **O(1)**；
- **最坏情况**：插入到表头（i = 1），需移动所有 n 个元素（n 为当前表长），循环执行 n 次，时间复杂度为 **O(n)**；
- **平均情况**：假设插入到任意位置的概率均等（概率 = 1/(n+1)），平均移动次数为 n/2，时间复杂度为 **O(n)**。
