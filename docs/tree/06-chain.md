---
id: chain
title: 六、二叉树的链式存储
sidebar_position: 6
---


### 1.链式存储图解
![Img](/assets/树/02.png)
- 如果一个二叉树要想实现链式存储的话,样子如上右图所示:

这个树里面的每一个节点都会有一个data域,存放实际的数据元素,还会有两个指针指向它的左孩子和右孩子,如果一个节点没有左孩子,那我们就把左指针设为NULL(如上图的2,4节点,没有左孩子,就设为NULL)
```
typedef struct BiNode {
	ElemType data;
	struct BiNode* lchild, * rchild;
}BiNode,*BiTree;
```
1. 
`一条“二叉链表”存储结构里，每个结点固定 2 个链域（lchild、rchild）。
 N 个结点总链域数 = 2N 条。`
2. 
`这些链域里，只有 N − 1 条被用来指向真正的孩子——
 任何一棵有 N 个结点的二叉树，边数（分支数）一定是 N − 1。`
3. 
`剩下没派上用场的链域就是空链域：
 2N − (N − 1) = N + 1.`

那么N 个结点的二叉链表共有 N + 1 个空指针（空链域),可以用来构造线索二叉树
————————————————

### 2. 存储结构（二叉链表）
```cpp
typedef struct ElemType {
    int value;  // 数据域
} ElemType;

typedef struct BiNode {
    ElemType data;
    struct BiNode* lchild;  // 左孩子指针
    struct BiNode* rchild;  // 右孩子指针
} BiNode, *BiTree;
```

### 3. 关键特性
- N个结点的二叉链表有 `2N` 个链域，其中 `N-1` 个指向孩子，`N+1` 个空链域（可用于构造线索二叉树）。

### 4. 扩展：三叉链表（支持快速找父节点）
```cpp
typedef struct BiNode {
    ElemType data;
    struct BiNode* lchild;
    struct BiNode* rchild;
    struct BiNode* parent;  // 父节点指针
} BiNode, *BiTree;
```

### 5. 初始化与插入示例
```cpp
// 定义空树
BiTree root = NULL;

// 插入根节点
root = (BiTree)malloc(sizeof(BiNode));
root->data = {1};
root->lchild = NULL;
root->rchild = NULL;

// 插入根节点的左孩子（值为2）
BiNode* p = (BiTree)malloc(sizeof(BiNode));
p->data = {2};
p->lchild = NULL;
p->rchild = NULL;
root->lchild = p;
```