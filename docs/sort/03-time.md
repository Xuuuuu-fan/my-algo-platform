---
id: time
title: 三.线性时间排序
sidebar_position: 3
---

**时间复杂度：$O(n)$**

import SortingVisualizer from '@site/src/components/AlgoScenes/SortingVisualizer';

<SortingVisualizer />

## 1. 计数排序 (Counting Sort)

### 深度原理解析
不做比较，而是做**统计**。
如果有 100 万个考生，分数范围是 0-750。我只需要开一个长度为 751 的数组 `count`。
遍历一遍考生，如果考了 600 分，就在 `count[600]++`。
最后遍历 `count` 数组，`count[600]` 是几，就打印几个 600。

### 代码与逐行讲解

```cpp
void countingSort(vector<int>& arr) {
    if (arr.empty()) return;

    // 1. 找最大值，确定计数数组范围
    int maxVal = arr[0];
    for (int num : arr) maxVal = max(maxVal, num);

    // 2. 初始化计数数组，全部置 0
    vector<int> count(maxVal + 1, 0);

    // 3. 统计每个数出现的次数
    for (int num : arr) {
        count[num]++;
    }

    // 4. 反向填充回原数组
    int index = 0;
    for (int i = 0; i <= maxVal; i++) {
        while (count[i] > 0) {
            arr[index++] = i;
            count[i]--;
        }
    }
}
```

---

## 2. 桶排序 (Bucket Sort)

### 深度原理解析
计数排序的升级版。如果数据范围很大（比如 1 到 1亿），开数组不现实。
桶排序把数据区间划分为 n 个**桶 (Bucket)**。
比如：0-9 放第一个桶，10-19 放第二个桶...
把数据丢进去后，**对每个桶内部单独排序**（可以用快排），最后把桶连起来。

### 代码与逐行讲解

```cpp
void bucketSort(vector<int>& arr) {
    int n = arr.size();
    if (n <= 1) return;

    // 1. 找最值
    int maxVal = arr[0], minVal = arr[0];
    for (int num : arr) {
        maxVal = max(maxVal, num);
        minVal = min(minVal, num);
    }

    // 2. 计算桶的数量 (这里简单策略：桶数 = 元素个数)
    int bucketCount = n;
    // 计算每个桶负责的数值范围
    // 比如 0-100，10个元素，gap=10
    double gap = (double)(maxVal - minVal) / (bucketCount - 1);
    
    // 初始化桶 (二维数组)
    vector<vector<int>> buckets(bucketCount);

    // 3. 元素入桶
    for (int num : arr) {
        int idx = (int)((num - minVal) / gap);
        buckets[idx].push_back(num);
    }

    // 4. 桶内排序并合并
    int index = 0;
    for (auto& bucket : buckets) {
        // 桶内可以用 sort (通常是快排)
        sort(bucket.begin(), bucket.end());
        for (int num : bucket) {
            arr[index++] = num;
        }
    }
}
```

---

## 3. 基数排序 (Radix Sort)

### 深度原理解析
这是针对**非负整数**的绝技。
它不比较大小，而是按**位**切分。
先按个位排序，再按十位排序，再按百位排序...
必须使用**稳定**的排序算法（通常用计数排序的变种）来排每一位，否则高位排好后，低位顺序乱了就白排了。

### 代码与逐行讲解

```cpp
// 获取数字 num 第 d 位的数字 (d=1是个位, d=10是十位...)
int getDigit(int num, int d) {
    return (num / d) % 10;
}

void radixSort(vector<int>& arr) {
    if (arr.empty()) return;

    // 1. 找最大值以确定最高位数
    int maxVal = arr[0];
    for (int num : arr) maxVal = max(maxVal, num);

    // 2. 从个位开始，一位位往上排
    // exp: 1, 10, 100, 1000 ...
    for (int exp = 1; maxVal / exp > 0; exp *= 10) {
        
        // 下面是针对该位的计数排序逻辑
        vector<int> output(arr.size());
        vector<int> count(10, 0); // 桶只有 0-9

        // 统计该位数字出现的次数
        for (int i = 0; i < arr.size(); i++) {
            count[getDigit(arr[i], exp)]++;
        }

        // 累加 count，为了确定该数字在 output 中的位置 (稳定排序的关键)
        for (int i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }

        // 从后往前遍历，保证稳定性
        for (int i = arr.size() - 1; i >= 0; i--) {
            int digit = getDigit(arr[i], exp);
            output[count[digit] - 1] = arr[i];
            count[digit]--;
        }

        // 将这一轮排好的赋给 arr，准备下一轮
        arr = output;
    }
}
```

---
