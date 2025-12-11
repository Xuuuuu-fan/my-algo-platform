---
id: delete
title: 二、代码实现
sidebar_position: 2
---

### 1. 定义结构
我们需要一个结构体来管理数组。

```c
#include <stdio.h>
#define MAX_CAPACITY 100  // 只有100个“柜子”

typedef struct {
    int data[MAX_CAPACITY]; // 真正的柜子
    int length;             // 实际用了多少个柜子 (Size)
} MyArray;
```

### 2. 初始化
```c
// 创建一个空数组
void initArray(MyArray *arr) {
    arr->length = 0; // 刚开始一个数据都没有
}
```

---