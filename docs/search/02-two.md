---
id: two
title: 二、 二分查找（Binary Search）
sidebar_position: 2
---

*   **核心思想**：每次将查找范围缩小一半（分治思想）。
*   **前提条件**：数据**必须有序**，且存储在**支持随机访问**的结构中（如数组）。
*   **时间复杂度**：**O(log n)**。

import BinarySearchVisualizer from '@site/src/components/AlgoScenes/BinarySearchVisualizer';


<BinarySearchVisualizer />

### **1. 代码实现 (C语言)**
```c
/**
 * 二分查找 (非递归版本)
 * @param arr 必须是有序的数组
 * @param n 数组元素个数
 * @param key 要查找的键值
 * @return 成功返回元素下标，失败返回-1
 */
int Binary_Search(int arr[], int n, int key) {
    int low = 0;
    int high = n - 1;
    int mid;

    while (low <= high) {
        // mid = (low + high) / 2; // 可能存在整数溢出风险
        mid = low + (high - low) / 2; // 更稳健的写法

        if (arr[mid] == key) {
            return mid; // 查找成功
        } else if (arr[mid] > key) {
            high = mid - 1; // 目标在左半区
        } else { // arr[mid] < key
            low = mid + 1;  // 目标在右半区
        }
    }
    return -1; // 查找失败
}
```
**代码解释**：
*   **`low`, `high` 指针**：定义了当前的查找区间 `[low, high]`。
*   **循环条件**：`while (low <= high)` 是关键。当 `low > high` 时，表示区间为空，查找失败。
*   **区间收缩**：根据 `arr[mid]` 与 `key` 的比较结果，将 `high` 或 `low` 指针移动到 `mid` 的一侧，从而将查找范围减半。
*   **防溢出**：`low + (high - low) / 2` 是计算 `mid` 的标准写法，可防止 `low + high` 溢出。

### **2. 考研真题与解析**

**题目 (2018年408真题改编)**：在一个**递增有序**的数组 `A` 中，查找值为 `x` 的元素。若找到，则将其与后继元素交换位置；若找不到，则将其插入到数组中，并使数组仍然保持有序。

**代码实现与解释**：
```c
#include <stdbool.h>

// 假设数组容量足够大
#define MAX_SIZE 100

/**
 * 查找并处理有序数组
 * @param A 有序数组
 * @param n 当前元素个数的指针，函数内部可能修改它
 * @param x 要查找或插入的值
 * @return 找到返回true，插入返回false
 */
bool Search_Or_Insert(int A[], int *n, int x) {
    // 1. 使用二分查找定位 x
    int low = 0, high = *n - 1, mid;
    while (low <= high) {
        mid = low + (high - low) / 2;
        if (A[mid] == x) {
            break; // 找到了，跳出循环
        } else if (A[mid] < x) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    // 2. 根据查找结果进行处理
    if (low <= high) { // 条件成立，说明是在循环内部 break 的，即找到了
        // 与后继元素交换 (前提是它不是最后一个元素)
        if (mid < *n - 1) {
            int temp = A[mid];
            A[mid] = A[mid + 1];
            A[mid + 1] = temp;
        }
        return true;
    } else { // 查找失败，low > high，此时 low 就是 x 应该插入的位置
        // 将 low 位置及其之后的所有元素后移一位
        for (int i = *n - 1; i >= low; i--) {
            A[i + 1] = A[i];
        }
        // 插入 x
        A[low] = x;
        (*n)++; // 数组元素个数加1
        return false;
    }
}
```
**解析**：
*   **考点**：**二分查找的扩展应用**，重点在于**如何利用二分查找失败时的状态**。
*   **查找定位**：如果找到，`break` 跳出，`low <= high` 成立。如果没找到，循环自然结束，`low > high` 成立。
*   **失败时的 `low`**：当查找失败时，`low` 指针的位置恰好是新元素 `x` 应该插入的位置。
*   **插入操作**：先将 `low` 及其之后的所有元素向后移动一位（**必须从后往前移**），然后将 `x` 放入 `low` 位置，最后更新数组长度。

---
