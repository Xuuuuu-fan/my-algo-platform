---
id: hash
title: 三、 散列查找（Hash Search）
sidebar_position: 3
---

*   **核心思想**：通过**散列函数**将键(Key)直接映射到数组下标，实现“地址 = f(Key)”的直接访问。
*   **前提条件**：无。
*   **时间复杂度**：理想情况下 **O(1)**。


import HashSearchVisualizer from '@site/src/components/AlgoScenes/HashSearchVisualizer';


<HashSearchVisualizer />

### **1. 代码实现 (C语言 - 链地址法)**
```c
#include <string.h>

#define HASH_TABLE_SIZE 10 // 定义哈希表大小

// 链表结点
typedef struct HashNode {
    int key;
    struct HashNode *next;
} HashNode;

// 哈希表结构
typedef struct {
    HashNode *table[HASH_TABLE_SIZE];
} HashTable;

// 散列函数 (简单的取模法)
int Hash(int key) {
    return key % HASH_TABLE_SIZE;
}

// 初始化哈希表
void InitHashTable(HashTable *ht) {
    for (int i = 0; i < HASH_TABLE_SIZE; i++) {
        ht->table[i] = NULL;
    }
}

// 插入
void Insert(HashTable *ht, int key) {
    int index = Hash(key);
    HashNode *newNode = (HashNode *)malloc(sizeof(HashNode));
    newNode->key = key;
    
    // 头插法插入链表
    newNode->next = ht->table[index];
    ht->table[index] = newNode;
}

/**
 * 散列查找
 * @return 找到返回结点指针，找不到返回 NULL
 */
HashNode* Search(HashTable *ht, int key) {
    int index = Hash(key);
    HashNode *p = ht->table[index];

    // 在链表中进行顺序查找
    while (p != NULL) {
        if (p->key == key) {
            return p; // 找到
        }
        p = p->next;
    }
    return NULL; // 未找到
}
```
**代码解释**：
*   **数据结构**：哈希表是一个指针数组，每个指针指向一个处理冲突的链表的头。
*   **`Hash` 函数**：将 `key` 映射到数组下标。
*   **`Insert` 操作**：计算哈希地址，然后将新节点**头插**到对应链表中。
*   **`Search` 操作**：计算哈希地址，直接定位到链表，然后在该链表上进行**顺序查找**。

### **2. 考研真题与解析**

**题目 (概念题)**：在使用链地址法处理冲突的散列表中，若表长为 `m`，已有 `n` 个元素，那么查找一个元素的平均查找长度是多少？

**解析**：
*   **考点**：对散列查找性能的深刻理解。
*   **分析**：ASL 取决于计算哈希和在链表中查找的时间。假设散列函数均匀，每个链表的平均长度为 `α = n / m`，这个 `α` 叫**装填因子 (Load Factor)**。
*   **结论**：查找的平均时间复杂度与链表长度成正比，为 **O(1 + α)**，即 **O(1 + n/m)**。只要 `α` 是一个不大的常数（通过合理设计哈希表大小 `m` 实现），就可以认为其效率是 O(1) 的。

---
