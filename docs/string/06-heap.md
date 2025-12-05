---
id: heap
title: 六、堆串操作
sidebar_position: 6
---

import HeapStringDemo from '@site/src/components/AlgoScenes/HeapStringGallery';

# 堆串的动态分配

堆串（Heap String）结合了顺序存储和链式存储的优点：
1. **物理上连续**：像数组一样连续存储，访问速度快。
2. **动态分配**：存储空间是在程序运行时动态申请的（malloc），不会浪费空间，也不受 MAXSIZE 限制。

### 动态演示：赋值与重新赋值

请注意观察演示中的第 5-7 步：
当给一个已经存在的串重新赋值时，**必须先 `free` 掉原来的旧空间**，否则会造成**内存泄漏 (Memory Leak)**。

<HeapStringDemo />

### 1. 类型定义
```cpp
typedef struct {
    char* ch;     // 指向动态分配的字符数组
    int length;   // 当前实际字符个数
} HString;
```
  - char*  而不是  char[] ：大小在编译期不确定，要到运行期才申请，所以叫“堆”串。
  - 如果只写  char* ch  而不初始化，它就是个野指针，访问即崩溃。
### 2. 核心操作
#### （1）初始化（分配空间）
```cpp
HString HS;
HS.ch = (char*)malloc(MAXLEN * sizeof(char));
HS.length = 0;  // 初始无有效字符
```
```__malloc(MAXLEN):__ ```

向操作系统要  MAXLEN  字节的** raw 内存**，返回  void* 。

```**(char):**```

明确告诉编译器“我要当字符数组用”，不写也可以，但 C++ 推荐强转。 

```**HS.length = 0 :**```

当前还没存任何有效字符，不是容量，而是实际长度。 

不写这行  malloc  → 后面  HS.ch[?]  就是野指针写入，直接 Segmentation Fault。
————————————————
#### （2）存储字符示例
- 示例里并没有往堆里放字符，只是打印了  length ，所以不会访问非法内存。
- 如果真要存字符，典型流程是：
```cpp
const char* src = "heap";
int len = strlen(src);
HS.ch = (char*)malloc(len + 1); // +1 留给 '\0'（可选）
for (int i = 0; i < len; ++i) HS.ch[i] = src[i];
HS.length = len;
```

#### （3）释放内存
```cpp
free(HS.ch); // 必须手动释放，避免内存泄漏
```
 1.malloc  得到的内存不会自动还，必须手动  free 。
 2.只写  free  一次；二次 free = 未定义行为。
 3.养成“谁 malloc 谁 free”的习惯，防止内存泄漏。

### 3. 定长顺序串与堆串对比
| 特性 | 定长顺序串（SString） | 堆串（HString） |
|------|------------------------|------------------|
| 数组大小 | 固定 MAXLEN | 运行期可扩/缩 |
| 存储位置 | 栈或静态存储 | 堆内存 |
| 内存管理 | 无泄漏风险 | 需手动 free |
| 下标使用 | 可从 1 开始 | 通常从 0 开始（支持从 1 开始） |
### 4.堆串完整代码
```//堆串定义
typedef struct {
    char* ch;   // 动态区，ch[1..length] 有效，ch[0] 闲置
    int  length;
} HString;	
 
/* 演示堆串初始化 */
	HString HS;
	HS.ch = (char*)malloc(MAXLEN * sizeof(char));
	HS.length = 0;
	cout << "堆串 HS 已初始化，length = " << HS.length << endl;
	free(HS.ch); // 避免内存泄漏
```
