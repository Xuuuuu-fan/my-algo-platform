---
id: intro
title: 一、数组的底层逻辑
sidebar_position: 1
---

import SeqListInsertion from '@site/src/components/AlgoScenes/SeqListInsertion';

<SeqListInsertion />

数组最牛的特性是：**随机访问（Random Access）**。
意思是：无论数组有多大，我要拿第 10000 个元素，和拿第 1 个元素，速度是一样快的（$O(1)$）。

**为什么能做到？**
因为内存是连续的，CPU 可以通过数学公式直接算出地址！

### “寻址公式” (核心知识点)
假设你申请了一个 `int a[10]`。
*   **首地址 (Base Address)**：内存就像一条长街，数组的起始位置是 `1000` 号。
*   **数据宽度 (Data Size)**：因为是 `int` 类型，每个元素占 `4` 个字节。

如果你要访问 `a[i]`（第 `i` 个元素），计算机是这样算的：

$$ \text{内存地址} = \text{首地址} + \text{索引} \times \text{数据宽度} $$

*   `a[0]` 地址 = $1000 + 0 \times 4 = 1000$
*   `a[2]` 地址 = $1000 + 2 \times 4 = 1008$

**这就是为什么数组下标通常从 0 开始**：如果从 1 开始，公式里就得多算一次 `(i-1)`，会降低 CPU 的效率。