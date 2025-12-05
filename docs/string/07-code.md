---
id: code
title: 七、完整代码实现
sidebar_position: 7
---


### 1. 顺序存储 - 定长存储
```cpp
//--run--g++ $tmpFile.cpp -o $tmpFile.out &&$tmpFile.out
#include <iostream>
using namespace std;
#define MAXLEN 255

// 定长顺序串
typedef struct {
    char ch[MAXLEN + 1];
    int length;
} SString;

// 求串长
int StrLength(SString S) {
    return S.length;
}

// 求子串
bool SubString(SString& Sub, SString S, int pos, int len) {
    if (pos + len - 1 > S.length)
        return false;
    for (int i = pos; i < pos + len; i++)
        Sub.ch[i - pos + 1] = S.ch[i];
    Sub.length = len;
    return true;
}

// 比较操作
int StringCompare(SString S, SString T) {
    for (int i = 1; i <= S.length && i <= T.length; i++) {
        if (S.ch[i] != T.ch[i])
            return S.ch[i] - T.ch[i];
    }
    return S.length - T.length;
}

// 定位操作
int Index(SString S, SString T) {
    int i = 1, n = StrLength(S), m = StrLength(T);
    SString sub;
    while (i <= n - m + 1) {
        SubString(sub, S, i, m);
        if (StringCompare(sub, T) != 0)
            i++;
        else return i;
    }
    return 0;
}

// C风格字符串 -> SString（下标从1开始）
void InitString(SString& S, const char* str) {
    int len = 0;
    while (str[len])
        len++;
    S.length = len;
    for (int i = 1; i <= len; i++)
        S.ch[i] = str[i - 1];
}

int main() {
    // 初始化主串与模式串
    SString S, T;
    InitString(S, "hello world");
    InitString(T, "world");

    // 测试 SubString
    SString sub;
    if (SubString(sub, S, 7, 5)) {
        cout << "子串：";
        for (int i = 1; i <= sub.length; i++) cout << sub.ch[i];
        cout << endl;
    }

    // 测试 StringCompare
    cout << "Compare 结果 (S,T)：" << StringCompare(S, T) << endl;

    // 测试 Index
    int pos = Index(S, T);
    cout << "Index 结果：" << pos << endl;

    return 0;
}
```
- 运行结果：子串为 `world`，Compare 结果为 `-15`，Index 结果为 `7`。

### 2. 顺序存储 - 堆串
```cpp
//--run--g++ $tmpFile.cpp -o $tmpFile.out &&$tmpFile.out
#include <iostream>
#include <cstdlib>
#include <cstring>
using namespace std;

typedef struct {
    char* ch;   // 动态区，ch[1..length] 有效，ch[0] 闲置
    int  length;
} HString;

// 求串长
int StrLength(HString S) { return S.length; }

// 初始化堆串（C风格字符串 -> HString）
void InitString(HString& S, const char* str) {
    S.length = strlen(str);
    S.ch = (char*)malloc(S.length + 1);      // +1 给 ch[0] 留空
    for (int i = 1; i <= S.length; ++i) S.ch[i] = str[i - 1];
}

// 求子串
bool SubString(HString& Sub, HString S, int pos, int len) {
    if (pos < 1 || len < 0 || pos + len - 1 > S.length) return false;
    Sub.ch = (char*)malloc(len + 1);
    for (int i = 1; i <= len; ++i) Sub.ch[i] = S.ch[pos + i - 1];
    Sub.length = len;
    return true;
}

// 比较操作
int StringCompare(HString S, HString T) {
    int i = 1;
    while (i <= S.length && i <= T.length) {
        if (S.ch[i] != T.ch[i]) return S.ch[i] - T.ch[i];
        ++i;
    }
    return S.length - T.length;
}

// 定位操作
int Index(HString S, HString T) {
    int n = StrLength(S), m = StrLength(T);
    if (m == 0) return 0;
    HString sub;
    for (int i = 1; i <= n - m + 1; ++i) {
        SubString(sub, S, i, m);
        if (StringCompare(sub, T) == 0) {
            free(sub.ch);   // 释放临时堆区
            return i;
        }
        free(sub.ch);
    }
    return 0;
}

// 打印堆串
void PrintHString(HString S) {
    for (int i = 1; i <= S.length; ++i) cout << S.ch[i];
}

int main() {
    HString S, T;
    InitString(S, "hello world");
    InitString(T, "world");

    HString sub;
    if (SubString(sub, S, 7, 5)) {
        cout << "子串："; PrintHString(sub); cout << endl;
        free(sub.ch);
    }

    cout << "Compare 结果：" << StringCompare(S, T) << endl;
    cout << "Index 结果：" << Index(S, T) << endl;

    // 释放主串和模式串内存
    free(S.ch);
    free(T.ch);
    return 0;
}
```
- 运行结果：子串为 `world`，Compare 结果为 `-15`，Index 结果为 `7`。
