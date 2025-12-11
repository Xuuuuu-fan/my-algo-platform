---
id: bst
title: 四、 二叉搜索树查找 (BST)
sidebar_position: 4
---

*   **核心思想**：左子树 < 根 < 右子树。
*   **前提条件**：无。
*   **时间复杂度**：平均 **O(log n)**，最坏 **O(n)** (退化成链表)。


import BSTVisualizer from '@site/src/components/AlgoScenes/BSTVisualizer';


<BSTVisualizer />


### **1. 代码实现 (C语言)**
```c
#include <limits.h>

typedef struct BSTNode {
    int key;
    struct BSTNode *lchild, *rchild;
} BSTNode, *BSTree;

/**
 * 二叉搜索树的查找 (递归版本)
 * @param T 指向树根的指针
 * @param key 要查找的键值
 * @return 找到返回结点指针，找不到返回 NULL
 */
BSTree BST_Search(BSTree T, int key) {
    if (T == NULL || T->key == key) {
        return T;
    }
    if (key < T->key) {
        return BST_Search(T->lchild, key);
    } else {
        return BST_Search(T->rchild, key);
    }
}

/**
 * 二叉搜索树的插入
 */
int BST_Insert(BSTree *T, int key) {
    if (*T == NULL) {
        *T = (BSTree)malloc(sizeof(BSTNode));
        (*T)->key = key;
        (*T)->lchild = (*T)->rchild = NULL;
        return 1;
    } else if (key == (*T)->key) {
        return 0;
    } else if (key < (*T)->key) {
        return BST_Insert(&((*T)->lchild), key);
    } else {
        return BST_Insert(&((*T)->rchild), key);
    }
}
```
**代码解释**：
*   **`BST_Search` (查找)**：一个典型的递归。根据 `key` 与当前节点值的大小关系，决定向左子树还是右子树递归，直到找到或遇到 `NULL`。
*   **`BST_Insert` (插入)**：插入过程就是一个查找过程。沿着查找路径向下，直到找到一个 `NULL` 的位置，这就是新节点的插入点。
*   **指针的指针 `BSTree *T`**：因为需要在函数内部修改调用者传来的指针本身（将 `NULL` 指向新节点），所以必须传递指针的地址。

### **2. 考研真题与解析**

**题目 (2019年408真题)**：请判断一棵给定的二叉树是否为二叉搜索树。

**代码实现与解释**：
```c
// --- 方法一：中序遍历法 ---
int pre_val = INT_MIN; // 全局变量，记录前一个访问的结点值

bool IsBST_InOrder(BSTree T) {
    if (T == NULL) return true;
    if (!IsBST_InOrder(T->lchild)) return false;
    if (T->key <= pre_val) return false;
    pre_val = T->key;
    return IsBST_InOrder(T->rchild);
}

// --- 方法二：递归定义法 ---
bool IsBST_Recursive(BSTree T, int min_val, int max_val) {
    if (T == NULL) return true;
    if (T->key <= min_val || T->key >= max_val) return false;
    return IsBST_Recursive(T->lchild, min_val, T->key) && 
           IsBST_Recursive(T->rchild, T->key, max_val);
}

// 辅助函数调用方法二
bool Check_Is_BST(BSTree T) {
    return IsBST_Recursive(T, INT_MIN, INT_MAX);
}
```
**解析**：
*   **考点**：对二叉搜索树**核心性质**的深刻理解。
*   **方法一（中序遍历法）**：利用了“**BST的中序遍历序列必然是严格递增的**”这一黄金性质。通过中序遍历，依次检查当前节点值是否大于前一个节点值。
*   **方法二（递归定义法）**：利用了“**每个节点的值都必须在其祖先节点定义的 `(min, max)` 范围内**”的性质。递归地检查每个节点是否满足其应有的范围，并收缩范围传递给子树。

---