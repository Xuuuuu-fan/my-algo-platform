---
id: achieve
title: 五、基本操作的实现
sidebar_position: 5
---

import StringOpsGallery from '@site/src/components/AlgoScenes/StringOpsGallery';

下方演示了**求串长**、**串联接**和**求子串**这三个最核心操作的内部执行过程。

点击上方按钮切换不同的操作场景。

<StringOpsGallery />

### 1. 求子串
![Img](/assets/串/06.png)
```cpp
// 求子串：Sub 返回串 S 第 pos 个字符起长度为 len 的子串，越界返回 false
bool SubString(SString& Sub, SString S, int pos, int len) {
    if (pos + len - 1 > S.length)
        return false;
    for (int i = pos; i < pos + len; i++)
        Sub.ch[i - pos + 1] = S.ch[i];
    Sub.length = len;
    return true;
}
```

### 2. 比较操作
![Img](/assets/串/07.png)
![Img](/assets/串/08.png)
当S.ch和T2比较时;
扫描过的所有字符都相同,则比较长度:
S.length - T.length = 7 - 3 > 0;
则S.ch更长
 

如上图所示, 当S.ch和T1比较时 : 
从S.ch,T1字符串的第一个位置开始循环扫描:
   ```for (int i = 1;i <= S.length && i <= T.length;i++)```
如果发现两个字符串对应位置的字符不同时:
   ```if (S.ch[i] != T.ch[i])```
则返回两个值相减的值:
   ```return S.ch[i] - T.ch[i];```
如S.ch和T1所示, 则是返回了a - b的值, 又因为a - b < 0;
所有S.ch字符串比T1小, 则返回值 < 0.
————————————————
```cpp
// 比较：S>T返回>0，S=T返回0，S<T返回<0
int StringCompare(SString S, SString T) {
    for (int i = 1; i <= S.length && i <= T.length; i++) {
        if (S.ch[i] != T.ch[i])
            return S.ch[i] - T.ch[i];
    }
    // 所有字符相同，长度长的串更大
    return S.length - T.length;
}
```

### 3. 定位操作
![Img](/assets/串/09.png)
![Img](/assets/串/10.png)
首先求两个字符串的长度,才可以知道子串要取多长:
    ```n = StrLength(S), m = StrLength(T);```
子串长为T.length=m;
然后调用取子串基本操作,我们就可以取出长度为3的子串:
    ```SubString(sub, S, i, m);```
然后使用while循环就可以从头到尾取长度为3的子串:
   ``` while (i < n - m + 1);```
取下来子串后,使用比较的操作,观察取下来的子串与T是否相等:
如果相等则返回0,如果不等则说明还没有匹配,则 i++:
    ```if (StringCompare(sub, T) != 0)
        i++;```
最后返回子串在主串中的位置:
   ``` else return i;```
————————————————
```cpp
// 定位：主串 S 中存在与 T 相同的子串时，返回第一次出现的位置，否则返回 0
int Index(SString S, SString T) {
    int i = 1, n = StrLength(S), m = StrLength(T);
    SString sub;     // 暂存子串
    while (i <= n - m + 1) {
        SubString(sub, S, i, m);
        if (StringCompare(sub, T) != 0)
            i++;
        else return i;      // 返回子串在主串中的位置
    }
    return 0;     // S 中不存在与 T 相等的子串
}
```
