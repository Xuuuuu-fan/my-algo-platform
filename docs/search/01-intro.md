---
id: intro
title: 一、 顺序查找（Sequential Search)
sidebar_position: 1
---

*   **核心思想**：从头到尾逐个比较。
*   **前提条件**：无。
*   **时间复杂度**：**O(n)**。

import SequentialSearchVisualizer from '@site/src/components/AlgoScenes/SequentialSearchVisualizer';


<SequentialSearchVisualizer />


### **1. 代码实现 (C语言)**
```c
/**
 * 顺序查找
 * @param arr 待查找的数组
 * @param n 数组元素个数
 * @param key 要查找的键值
 * @return 成功返回元素下标，失败返回-1
 */
int Sequential_Search(int arr[], int n, int key) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == key) {
            return i; // 查找成功，返回下标
        }
    }
    return -1; // 查找失败
}
```
**代码解释**：
通过一个 `for` 循环，从数组的第一个元素 `arr[0]` 开始，依次将其值与 `key` 比较。如果找到相等的，立即 `return` 当前的下标 `i`。如果循环结束仍未找到，就返回 `-1` 表示失败。

### **2. 考研真题与解析**

**题目 (简化版)**：设计一个算法，在一个**带头结点**的单链表中进行顺序查找，若找到值为 `key` 的结点，则将其**移动到链表最前端**。

**代码实现与解释**：
```c
#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode, *LinkList;

/**
 * 在带头结点的单链表中查找值为key的结点。
 * 如果找到，则将其移动到链表头部（头结点之后），并返回1。
 * 如果未找到，返回0。
 */
int Search_And_Move_To_Front(LinkList L, int key) {
    LNode *pre = L;      // pre 指向当前访问结点的前驱
    LNode *p = L->next;  // p 指向当前访问结点

    while (p != NULL) {
        if (p->data == key) {
            // 找到了值为 key 的结点 p
            
            // 1. 从链表中摘下 p
            pre->next = p->next; 

            // 2. 将 p 插入到头结点之后
            p->next = L->next;
            L->next = p;

            return 1; // 查找并移动成功
        }
        // 未找到，继续向后遍历
        pre = p;
        p = p->next;
    }
    return 0; // 遍历结束，未找到
}
```
**解析**：
*   **考点**：这道题不仅考了顺序查找，更核心的是考查**链表操作**。
*   **`pre` 指针**：在链表中，要删除或移动一个节点 `p`，必须知道它的**前驱节点 `pre`**，以便执行 `pre->next = p->next` 来“跳过”`p`。
*   **移动操作**：找到 `p` 后，先**摘下**，再执行**头插**。
*   **算法思想**：这种“找到后提前”的策略是一种**自适应**优化，假设最近被访问的元素很可能再次被访问，将其移到头部可以减少下一次查找的时间。

---
