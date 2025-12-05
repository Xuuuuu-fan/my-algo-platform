---
id: operate
title: 二、串的基本操作
sidebar_position: 2
---

import StringOpsGallery from '@site/src/components/AlgoScenes/StringOpsGallery';

下方演示了**求串长**、**串联接**和**求子串**这三个最核心操作的内部执行过程。

点击上方按钮切换不同的操作场景。

<StringOpsGallery />

假设串 `T=""`，`S="iPhone 11 Pro Max?"`，`W="Pro"`，核心操作如下：
- `StrAssign(&T, chars)`：赋值，将串 T 赋值为 chars；
- `StrCopy(&T,S)`：复制，由串 S 复制得到串 T；
- `StrEmpty(S)`：判空，空串返回 TRUE，否则返回 FALSE；
- `StrLength(S)`：求串长，返回串 S 的元素个数；
- `ClearString(&S)`：清空，将 S 清为空串；
- `DestroyString(&S)`：销毁，回收串 S 的存储空间；
- `Concat(&T,S1,S2)`：串联接，T 返回 S1 和 S2 联接的新串（例：`Concat(&T, S, W)` 后，`T="iPhone 11 Pro Max?Pro"`）；
- `SubString(&Sub, S, pos, len)`：求子串，Sub 返回串 S 第 pos 个字符起长度为 len 的子串（例：`SubString(&T, S, 4, 6)` 后，`T="one 11"`）；
- `Index(S,T)`：定位，主串 S 中存在与 T 相同的子串时，返回第一次出现的位置，否则返回 0（例：`Index(S, W)` 返回 11）；
- `StrCompare(S,T)`：比较，S>T 返回>0，S=T 返回 0，S<T 返回<0（例：`"abandon"<"abgard"`，`"abstract"<"abstraction"`）。
