---
id: delete
title: 二、顺序表的删除
sidebar_position: 2
---

import SeqListDeletion from '@site/src/components/AlgoScenes/SeqListDeletion';

<SeqListDeletion />

### 1. 删除操作实现
```cpp
#include <iostream>
using namespace std;

#define MaxSize 10  // 最大容量与插入操作一致

typedef struct {
    int data[MaxSize];
    int length;
} SqList;

// 初始化函数（复用插入操作的逻辑）
void InitList(SqList& L) {
    L.length = 0;
}

// 插入函数（用于生成测试数据，删除前需先有元素）
bool ListInsert(SqList& L, int i, int e) {
    if (i < 1 || i > L.length + 1) {
        cout << "插入位序非法！" << endl;
        return false;
    }
    if (L.length >= MaxSize) {
        cout << "顺序表已满，无法插入！" << endl;
        return false;
    }
    for (int j = L.length; j >= i; j--) {
        L.data[j] = L.data[j - 1];
    }
    L.data[i - 1] = e;
    L.length++;
    return true;
}

// 删除操作：删除顺序表L中位序i的元素，并用引用e返回被删除的元素
bool ListDelete(SqList& L, int i, int& e) {
    // 合法性校验：位序i必须在[1, L.length]之间（只能删除已有元素）
    if (i < 1 || i > L.length) {
        cout << "删除位序非法！" << endl;
        return false;
    }
    e = L.data[i - 1];  // 先保存被删除元素的值（位序i对应下标i-1）
    // 核心步骤：从被删除元素的下一位开始，依次向前移动1位（覆盖被删除元素）
    // 循环条件j < L.length：移动到最后一个有效元素（下标L.length-1）
    for (int j = i; j < L.length; j++) {
        L.data[j - 1] = L.data[j];  // 前移：下标j-1存储后一个元素的值
    }
    L.length--;  // 删除成功，有效元素个数-1
    return true;
}

// 打印函数（复用插入操作的逻辑）
void PrintList(SqList L) {
    if (L.length == 0) {
        cout << "顺序表为空！" << endl;
        return;
    }
    cout << "顺序表元素：";
    for (int i = 0; i < L.length; i++) {
        cout << L.data[i] << " ";
    }
    cout << endl;
}
```

### 2. 删除测试主函数
```cpp
int main() {
    SqList L;
    InitList(L);
    // 生成测试数据：插入10、20、30、40、50（位序1-5）
    for (int i = 1; i <= 5; i++) {
        ListInsert(L, i, i * 10);  // i=1→10，i=2→20，...，i=5→50
    }
    cout << "删除前：";
    PrintList(L);  // 输出：10 20 30 40 50
    int deletedValue;  // 用于接收被删除的元素值
    // 删除位序3的元素（值为30）
    if (ListDelete(L, 3, deletedValue)) {
        cout << "删除成功，被删元素为：" << deletedValue << endl;  // 输出：30
    } else {
        cout << "删除失败" << endl;
    }
    cout << "删除后：";
    PrintList(L);  // 输出：10 20 40 50（30被删除，后续元素前移）
    return 0;
}
```

### 3. 插入与删除操作关键区别（重点注意）
| 操作 | 循环方向      | 循环条件           | 表长度变化      | 参数 e 类型 |
|------|---------------|--------------------|-----------------|-------------|
| 插入 | 从后往前（j--）| j >= i（到目标位置止） | L.length++      | 普通变量    |
| 删除 | 从前往后（j++）| j < L.length（到表尾止）| L.length--      | 引用变量    |

> 注意：删除操作中 e 用引用 & 的原因是需要将被删除的值返回给主函数，而插入操作仅需传入 e 的值，无需返回。

### 4. 删除操作时间复杂度分析
- **最好情况**：删除表尾元素（i = L.length），无需移动任何元素，循环执行 0 次，时间复杂度为 **O(1)**；
- **最坏情况**：删除表头元素（i = 1），需移动 n-1 个元素（n 为当前表长），循环执行 n-1 次，时间复杂度为 **O(n)**；
- **平均情况**：假设删除任意位置的概率均等（概率 = 1/n），平均移动次数为 (n-1)/2，时间复杂度为 **O(n)**。
