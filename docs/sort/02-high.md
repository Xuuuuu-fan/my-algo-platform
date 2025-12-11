---
id: high
title: 二.高级排序
sidebar_position: 2
---

**时间复杂度：$O(n \log n)$**

import SortingVisualizer from '@site/src/components/AlgoScenes/SortingVisualizer';

<SortingVisualizer />

## 1. 希尔排序 (Shell Sort)

### 深度原理解析
希尔排序是插入排序的**改良版**。
直接插入排序在数据“基本有序”时效率极高。希尔排序通过**“分组”**和**“大跨度插入”**，先让数组变得宏观上有序，最后再进行微调。

**核心词：增量 (Gap)**。
比如 Gap=4，意思是把数组按下标 `0, 4, 8...` 分一组，`1, 5, 9...` 分一组，组内进行插入排序。然后缩小 Gap，直到 Gap=1。

### 代码与逐行讲解

```cpp
void shellSort(vector<int>& arr) {
    int n = arr.size();
    
    // 1. 外层循环：逐步缩小增量 gap
    // 初始 gap 通常取长度的一半，每次折半
    for (int gap = n / 2; gap > 0; gap /= 2) {
        
        // 2. 对每个组进行插入排序
        // 注意：这里没有显式的分租代码，而是通过 i++ 和 j-gap 实现了交替处理所有组
        // i 从 gap 开始，相当于插入排序里的 "current"
        for (int i = gap; i < n; i++) {
            int temp = arr[i];
            int j = i;
            
            // 3. 组内跨度比较与移动
            // 与普通插入排序的区别仅在于：间隔是 gap 而不是 1
            while (j >= gap && arr[j - gap] > temp) {
                arr[j] = arr[j - gap]; // 移位
                j -= gap; // 向前跨 gap 步
            }
            arr[j] = temp; // 插入
        }
    }
}
```

---

## 2. 归并排序 (Merge Sort)

### 深度原理解析
归并排序是标准的**分治法 (Divide and Conquer)**。
它不需要复杂的交换逻辑，而是依赖**递归**。

**逻辑流**：
1.  **分**：一刀切两半，两半再切两半...直到切成单个元素（单个元素默认有序）。
2.  **合**：把两个有序的“小数组”合并成一个有序的“大数组”。
    *   怎么合？两个指针分别指向两个数组头，谁小取谁，放到新数组里。

### 代码与逐行讲解

```cpp
// 辅助函数：合并两个有序区间 [left, mid] 和 [mid+1, right]
void merge(vector<int>& arr, int left, int mid, int right) {
    // 创建一个临时数组来存放合并结果
    vector<int> temp(right - left + 1);
    
    int i = left;     // 左半区的起点
    int j = mid + 1;  // 右半区的起点
    int k = 0;        // 临时数组的指针

    // 1. 谁小移谁
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) {
            temp[k++] = arr[i++];
        } else {
            temp[k++] = arr[j++];
        }
    }

    // 2. 处理剩余元素（如果有剩下的，直接接在后面）
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];

    // 3. 拷回原数组
    for (int p = 0; p < k; p++) {
        arr[left + p] = temp[p];
    }
}

// 主排序函数
void mergeSort(vector<int>& arr, int left, int right) {
    // 递归终止条件：只剩一个元素或无效区间
    if (left >= right) return;

    int mid = left + (right - left) / 2; // 取中间点，防溢出写法

    // 分：递归排序左半边
    mergeSort(arr, left, mid);
    // 分：递归排序右半边
    mergeSort(arr, mid + 1, right);
    // 合：将排好的两半合并
    merge(arr, left, mid, right);
}
```

---

## 3. 快速排序 (Quick Sort) —— **最重要的排序**

### 深度原理解析
快排的核心是**“找准基准 (Pivot)”**。
它的目标是：选一个数（比如第一个数）作为基准，然后把所有比它小的扔到左边，比它大的扔到右边。这样基准数的位置就“永久确定”了。然后递归处理左右两边。

**难点**：Partition（分区）函数的实现。

### 代码与逐行讲解

```cpp
// 核心分区函数：返回基准值最终所在的下标
int partition(vector<int>& arr, int left, int right) {
    int pivot = arr[left]; // 策略：选第一个元素作为基准
    int i = left;
    int j = right;

    while (i < j) {
        // 1. j 从右往左找，找一个比 pivot 小的数
        while (i < j && arr[j] >= pivot) j--;
        
        // 2. i 从左往右找，找一个比 pivot 大的数
        while (i < j && arr[i] <= pivot) i++;
        
        // 3. 交换这两个数，让小的去左边，大的去右边
        if (i < j) swap(arr[i], arr[j]);
    }

    // 4. 此时 i 和 j 相遇。
    // 相遇位置的值一定 <= pivot（因为 j 先走，j 停下的位置是小的），
    // 所以把基准值和相遇位置交换，基准归位。
    swap(arr[left], arr[i]);
    
    return i; // 返回基准现在的下标
}

void quickSort(vector<int>& arr, int left, int right) {
    if (left < right) {
        // 获取分区点
        int pivotIndex = partition(arr, left, right);
        
        // 递归处理左边
        quickSort(arr, left, pivotIndex - 1);
        // 递归处理右边
        quickSort(arr, pivotIndex + 1, right);
    }
}
```

---

## 4. 堆排序 (Heap Sort)

### 深度原理解析
堆排序利用了**堆（完全二叉树）**的性质。
我们通常使用**大顶堆**（父节点 >= 子节点）来进行升序排序。

**逻辑流**：
1.  **建堆**：把乱序数组“调整”成一个大顶堆。此时数组第 0 个元素一定是最大值。
2.  **交换**：把第 0 个（最大）和 数组最后一个元素交换。最大值就排好了。
3.  **沉底 (Heapify)**：此时第 0 个元素是原来的末尾元素，破坏了堆性质，需要把它“下沉”到合适的位置，重新恢复大顶堆。
4.  重复步骤 2-3。

### 代码与逐行讲解

```cpp
// 下沉函数：维护堆性质
// n: 堆的范围大小, i: 当前要调整的节点下标
void heapify(vector<int>& arr, int n, int i) {
    int largest = i;       // 假设父节点最大
    int l = 2 * i + 1;     // 左子节点下标
    int r = 2 * i + 2;     // 右子节点下标

    // 如果左子节点存在，且比父节点大
    if (l < n && arr[l] > arr[largest])
        largest = l;

    // 如果右子节点存在，且比当前最大的还大
    if (r < n && arr[r] > arr[largest])
        largest = r;

    // 如果最大值不是父节点，说明需要交换
    if (largest != i) {
        swap(arr[i], arr[largest]);
        // 交换后，子树可能被破坏，递归调整
        heapify(arr, n, largest);
    }
}

void heapSort(vector<int>& arr) {
    int n = arr.size();

    // 1. 建堆 (Build Heap)
    // 从最后一个非叶子节点 (n/2 - 1) 开始向前遍历，逐个下沉
    for (int i = n / 2 - 1; i >= 0; i--)
        heapify(arr, n, i);

    // 2. 取出最大值并调整
    for (int i = n - 1; i > 0; i--) {
        // 把堆顶（最大值）换到末尾
        swap(arr[0], arr[i]);
        
        // 对剩下的 i 个元素，重新从 0 开始下沉，恢复堆
        heapify(arr, i, 0);
    }
}
```

---