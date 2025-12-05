---
id: nextval
title: 十、KMP算法的进一步优化（求 nextval 数组）
sidebar_position: 10
---

import KMPNextValPlayground from '@site/src/components/AlgoScenes/KMPNextValPlayground';
import KMPComparisonPlayground from '@site/src/components/AlgoScenes/KMPComparisonPlayground';

## NextVal 数组求解：自定义演练

NextVal 是对 Next 数组的修正。
**核心优化点**：如果当前字符 `T[i]` 和它要回溯到的字符 `T[j]` 相等，那么回溯是徒劳的（因为 `T[j]` 肯定也不匹配）。此时我们直接让 `T[i]` 继承 `T[j]` 的回溯位置。

:::tip 动手试试
1. 输入 **`ababaa`**：观察 `nextval[3]` 为什么是 0 而不是 1。
2. 输入 **`aaaab`**：你会看到连续的 `nextval` 都是 0（因为字符全部相同，一直递归优化）。
:::

<KMPNextValPlayground />

### 1. 核心思想
解决 `next` 数组中“失配字符与跳转后字符相同”的冗余对比问题，优化跳转效率。

### 2. 示例代码图解
```cpp
nextval[1] = 0;
for (int j = 2;j < T.length;j++) {
    if (T.ch[next[j]] == T.ch[j])
        nextval[j] = nextval[next[j]];
    else
        nextval[j] = next[j];
}
```
![Img](/assets/串/55.png)
**`首先默认 nextval[1] = 0,然后继续求后面的 nextval 值;`
`方法:如果当前 next[ j ] 所指向的字符和目前 j 所指的字符他们两个不相等,那我们就让 nextval 的值 = next 的值.`**

![Img](/assets/串/56.png)
**`如图:`
`当前 next[2] 指向的字符为1, j = 1时所指向的模式串为a;`
`此时 a≠b;`
`所以 nextval[2]=next[2]=1.`**
 
![Img](/assets/串/57.png)
**`如图:`
`当前 next[3] 指向的字符为1, j = 1时所指向的模式串为a;`
`此时 a=a;`
`所以 nextval[3] = nextval[next[1]] = 0.`**

![Img](/assets/串/58.png)
**`如图:`
`当前 next[4] 指向的字符为2, j = 2时所指向的模式串为b;`
`此时 b = b;`
`所以 nextval[4] = nextval[next[2]] = 1.`**

![Img](/assets/串/59.png)
**`如图:`
`当前next[5]指向的字符为3, j = 3时所指向的模式串为a;`
`此时a=a;`
`所以nextval[5] = nextval[next[3]] = 0.`**

![Img](/assets/串/60.png)
**`如图:`
`当前next[6]指向的字符为4, j = 4时所指向的模式串为b;`
`此时a≠b;`
`所以nextval[6] = next[6] = 4.`**
————————————————
### 3. 示例
next数组:
![](/assets/串/02.png)
nextval数组:
![](/assets/串/01.png)

 
## 终极对比：Next vs NextVal

通过下方的动态演示，你可以直观地看到 **NextVal 数组是如何在 Next 数组的基础上进行"再优化"的**。

:::info 观察指南
**绿色格子**代表触发了优化逻辑。
输入 **`aaaaa`**：你会看到 Next 是 `01234`，而 NextVal 是 `00004`（极度优化）。
输入 **`ababaa`**：观察第 3 位和第 5 位，为什么 NextVal 会变成 0。
:::

<KMPComparisonPlayground />