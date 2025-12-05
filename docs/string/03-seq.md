---
id: seq
title: 三、串的顺序存储
sidebar_position: 3
---

import StringStorageGallery from '@site/src/components/AlgoScenes/StringStorageGallery';

# 串的存储结构演示

串的存储主要有两种方式：
1. **顺序存储**：类似于数组，紧凑但需要预分配空间。
2. **链式存储**：为了提高存储密度，通常一个结点存储多个字符（块链）。

<StringStorageGallery />


### 1. 定长顺序串（静态数组，长度写死）
```cpp
#define MAXSIZE 255          // 最大容量
typedef struct {
    char ch[MAXSIZE];        // 连续空间
    int  length;             // 当前实际长度
} SString;
```

### 2. 堆分配顺序串（动态数组，运行时可扩容）
```cpp
typedef struct {
    char *ch;   // malloc/realloc 得到的连续空间
    int  length;   // 已用长度
    int  cap;   // 已分配容量
} HString;
```

### 3. 存储方式对比
| 方案 | 实现方式 | 优点 |
|------|----------|------|
| 方案一 | `ch[0]` 充当 Length | 节省空间 |
| 方案二 | 数组下标与字符位序相同 | 访问直观 |
| 方案三 | 以 `'\0'` 表示结尾（无 Length 变量） | 符合 C 语言字符串规范 |
| 方案四 | 单独维护 Length 变量 | 长度获取高效 |
![Img](/assets/串/03.png)
