---
id: find2
title: 四、顺序表的按值查找
sidebar_position: 4
---

import SeqListSearchtwo from '@site/src/components/AlgoScenes/SeqListSearchtwo';

<SeqListSearchtwo />

### 1. 按值查找实现（动态数组版）
```cpp
#include <iostream>
using namespace std;

typedef int ElemType;
#define InitSize 100

typedef struct {
    ElemType* data;
    int MaxSize;
    int length;
} SeqList;

// 按值查找：在顺序表L中查找值为e的元素，返回其位序（1开始）；未找到返回0
// 参数const&：const避免修改原表，&避免拷贝整个表（优化性能）
int LocateElem(const SeqList& L, ElemType e) {
    // 遍历所有有效元素，逐一比较
    for (int i = 0; i < L.length; i++) {
        if (L.data[i] == e) {  // 找到目标元素
            return i + 1;      // 返回位序（下标i对应位序i+1）
        }
    }
    return 0;  // 遍历结束未找到，返回0（表示查找失败）
}
```

### 2. 按值查找测试主函数
```cpp
int main() {
    SeqList L;
    L.data = new ElemType[InitSize];
    L.MaxSize = InitSize;
    L.length = 6;  // 有效元素个数为6
    // 生成测试数据：10、20、30、40、50、60
    for (int i = 0; i < L.length; i++) {
        L.data[i] = (i + 1) * 10;
    }
    ElemType key = 30;  // 目标查找值（用变量存储，便于修改测试）
    int pos = LocateElem(L, key);  // 调用查找函数
    if (pos != 0) {  // 查找成功（返回位序>=1）
        cout << "元素：" << key << " 的位序为：" << pos << endl;  // 输出：3
    } else {
        cout << "未找到元素：" << key << endl;
    }
    // 释放动态内存
    delete[] L.data;
    L.data = nullptr;
    return 0;
}
```

### 3. 按值查找时间复杂度分析
- **最好情况**：目标元素在表头（下标 0），仅需比较 1 次，时间复杂度为 **O(1)**；
- **最坏情况**：目标元素在表尾（下标 L.length-1）或不存在，需比较 n 次（n 为表长），时间复杂度为 **O(n)**；
- **平均情况**：假设元素出现在任意位置的概率均等（概率 = 1/n），平均比较次数为 (n+1)/2，时间复杂度为 **O(n)**。