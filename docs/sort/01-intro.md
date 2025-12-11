---
id: intro
title: 一.基础排序
sidebar_position: 1
---


**时间复杂度：$O(n^2)$**

import SortingVisualizer from '@site/src/components/AlgoScenes/SortingVisualizer';

<SortingVisualizer />


## 1. 冒泡排序 (Bubble Sort)

### 深度原理解析
冒泡排序的核心是**“相邻交换”**。
想象一个垂直的水管，里面的气泡（大数字）因为浮力大，会通过一次次挤压相邻的小气泡（小数字），最终浮到水面（数组末尾）。

**细节步骤**：
1.  **外层循环**：决定我们要“冒”几个泡。第一轮确定最大的，第二轮确定第二大的...
2.  **内层循环**：真正干活的。从头走到尾，如果左边比右边大，就交换。
3.  **边界控制**：每轮结束后，数组末尾已经排好一个最大的数了，所以下一轮内层循环可以少跑一次。
4.  **优化点**：如果某一轮从头走到尾，一次交换都没发生，说明数组已经有序，直接退出。

### 代码与逐行讲解

```cpp
void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    // 1. 外层循环：i 表示已经“冒”上去的气泡数量
    // 如果数组有 n 个数，只需要冒 n-1 次，最后一个自动就是最小的
    for (int i = 0; i < n - 1; i++) {
        
        bool swapped = false; // 优化标志位：假设这轮没有发生交换

        // 2. 内层循环：负责具体的比较和交换
        // j < n - 1 - i 是关键：
        // "-1" 是为了防止 arr[j+1] 越界
        // "-i" 是因为末尾的 i 个元素已经排好了，不需要再比
        for (int j = 0; j < n - 1 - i; j++) {
            
            // 3. 比较相邻元素
            if (arr[j] > arr[j + 1]) {
                // 如果左边大，交换
                swap(arr[j], arr[j + 1]);
                swapped = true; // 发生了交换，标记一下
            }
        }

        // 4. 优化判断
        // 如果跑了一整圈都没交换，说明数组已经有序，提前结束
        if (!swapped) break;
    }
}
```

---

## 2. 选择排序 (Selection Sort)

### 深度原理解析
选择排序的核心是**“打擂台”**。
它的思路非常符合人类直觉：在一堆牌里，眼睛扫描一遍，找到最小的那张，拿出来放到第一位；然后在剩下的牌里再找最小的，放到第二位...

**细节区别**：
与冒泡排序不同，冒泡是只要逆序就交换（频繁交换），而选择排序是一轮只交换一次（找到最小的才动手）。

### 代码与逐行讲解

```cpp
void selectionSort(vector<int>& arr) {
    int n = arr.size();
    
    // 1. 外层循环：i 代表当前要确定的位置（有序区的末尾）
    for (int i = 0; i < n - 1; i++) {
        
        int minIndex = i; // 假设当前位置 i 就是最小的（擂主）

        // 2. 内层循环：从 i+1 开始向后找，看有没有比擂主更小的
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j; // 发现更小的，记录下它的下标（挑战成功，成为新擂主）
            }
        }

        // 3. 交换
        // 如果最小的数不是一开始假设的 i，就把它换过来
        if (minIndex != i) {
            swap(arr[i], arr[minIndex]);
        }
    }
}
```

---

## 3. 插入排序 (Insertion Sort)

### 深度原理解析
插入排序的核心是**“整理扑克牌”**。
假设你左手拿着已经理好的牌（有序区），右手抓起一张新牌（无序区），你需要从后往前看，把它插到左手牌中正确的位置。

**细节步骤**：
1.  默认第0个元素是有序的。
2.  从第1个元素开始（右手抓的新牌 `current`）。
3.  **比较与后移**：拿 `current` 和前一个元素比，如果前一个元素比 `current` 大，就把前一个元素往后挪一格（腾位置），继续往前比。
4.  **落位**：直到找到一个比 `current` 小的元素，或者比到了头，就把 `current` 插进去。

### 代码与逐行讲解

```cpp
void insertionSort(vector<int>& arr) {
    int n = arr.size();
    
    // 1. 从第 1 个元素开始抓牌 (第 0 个默认有序)
    for (int i = 1; i < n; i++) {
        int current = arr[i]; // 右手抓到的新牌
        int preIndex = i - 1; // 左手已排序区域的最后一张牌的下标

        // 2. 向前扫描并挪动
        // 条件：preIndex >= 0 (没比到头) 且 前面的牌比新牌大
        while (preIndex >= 0 && arr[preIndex] > current) {
            arr[preIndex + 1] = arr[preIndex]; // 把大的牌往后挪一格
            preIndex--; // 继续向前看
        }
        
        // 3. 插入新牌
        // 循环结束时，preIndex 指向的是比 current 小的那个位置
        // 所以我们要插在 preIndex + 1
        arr[preIndex + 1] = current;
    }
}
```

---
