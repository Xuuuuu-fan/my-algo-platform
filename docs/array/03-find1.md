---
id: find1
title: 三、数组的核心操作
sidebar_position: 3
---

import ArrayCRUD from '@site/src/components/AlgoScenes/ArrayCRUD';

<ArrayCRUD />


### 3.1 查找 (Read/Access) - 极快
直接通过下标拿数据。

```c
int get(MyArray *arr, int index) {
    if (index < 0 || index >= arr->length) return -1; // 越界检查
    return arr->data[index]; 
}
// 时间复杂度：O(1)
```

### 3.2 更新 (Update) - 极快
直接覆盖旧数据。

```c
void update(MyArray *arr, int index, int value) {
    if (index >= 0 && index < arr->length) {
        arr->data[index] = value;
    }
}
// 时间复杂度：O(1)
```

### 3.3 插入 (Insert) - 较慢（难点）
**场景**：要在第 `index` 个位置插入一个新元素。
**问题**：这位置已经被占了，而且数组要求连续，不能跳着存。
**解决**：必须把 `index` 及其后面的所有元素，**往后挪一位**。

> **注意：** 挪动时必须**从后往前**挪！不然前面的数据会把后面的覆盖掉。

```c
// 在 index 位置插入 element
int insert(MyArray *arr, int index, int element) {
    // 1. 检查是不是满了
    if (arr->length >= MAX_CAPACITY) return 0; 
    // 2. 检查位置对不对
    if (index < 0 || index > arr->length) return 0;

    // 3. 搬运工干活：从最后一个元素开始，向后移
    // i 代表当前元素下标
    for (int i = arr->length - 1; i >= index; i--) {
        arr->data[i + 1] = arr->data[i];
    }

    // 4. 填入新值
    arr->data[index] = element;
    
    // 5. 长度+1
    arr->length++;
    return 1;
}
// 时间复杂度：O(n)，因为最坏情况要挪动所有元素
```

### 3.4 删除 (Delete) - 较慢
**场景**：删除第 `index` 个位置的元素。
**问题**：删掉后会留个坑，数组中间不能有空洞。
**解决**：必须把 `index` 后面的所有元素，**往前挪一位**，把坑填上。

> **注意：** 挪动时必须**从前往后**挪。

```c
int delete(MyArray *arr, int index) {
    if (index < 0 || index >= arr->length) return 0;

    // 搬运工干活：从删除位置的后一个开始，向前移
    for (int i = index + 1; i < arr->length; i++) {
        arr->data[i - 1] = arr->data[i]; // 后面的覆盖前面的
    }

    // 长度-1
    arr->length--;
    return 1;
}
// 时间复杂度：O(n)
```

---
