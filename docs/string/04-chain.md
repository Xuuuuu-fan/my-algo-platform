---
id: chain
title: 四、串的链式存储
sidebar_position: 4
---

import StringStorageGallery from '@site/src/components/AlgoScenes/StringStorageGallery';

# 串的存储结构演示

串的存储主要有两种方式：
1. **顺序存储**：类似于数组，紧凑但需要预分配空间。
2. **链式存储**：为了提高存储密度，通常一个结点存储多个字符（块链）。

<StringStorageGallery />

### 1. 单字符结点
```cpp
typedef struct StringNode{
    char ch;     // 每个结点存1个字符
    struct StringNode* next;
}StringNode,*String;
```
- 存储密度低：每个字符 1B，每个指针 4B。
![Img](/assets/串/04.png)

### 2. 多字符结点
```cpp
typedef struct StringNode {
    char ch[4];   // 每个结点存多个字符
    struct StringNode* next;
}StringNode,*next;
```
- 存储密度高于单字符结点。
![Img](/assets/串/05.png)