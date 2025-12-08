---
id: imp
title: 六、循环队列空满判断的三种实现方法
sidebar_position: 6
---

import { CircularQueueSacrifice, CircularQueueSize, CircularQueueTag } from '@site/src/components/AlgoScenes/CircularQueueModes';

循环队列是数据结构中队列的高效实现方式，核心解决普通顺序队列的“假溢出”问题。其关键难点在于**队空与队满的判断逻辑**——当队头指针（front）与队尾指针（rear）重合时，既可能是队列空，也可能是队列满。本文通过「文字版图解+原理+完整代码+优缺点对比」，帮你彻底吃透三种主流的空满判断方法（无需依赖外部图片链接，纯文字清晰还原图解逻辑）。

### 一、循环队列基础概念
在开始前，先明确循环队列的核心组成：
> > > > - 存储容器：数组 `data[MaxSize]`，MaxSize 为队列最大容量。
- 队头指针 `front`：指向队头元素所在位置（初始值为 0）。
- 队尾指针 `rear`：指向队尾元素的下一个空闲位置（初始值为 0）。
- 核心特性：指针移动时通过 `(ptr + 1) % MaxSize` 实现“循环”，避免指针溢出。

三种判断方法的核心目标：**区分 `front == rear` 时的“队空”和“队满”两种场景**。

import QueueSacrificeDemo from '@site/src/components/AlgoScenes/QueueSacrificeDemo';
import QueueSizeDemo from '@site/src/components/AlgoScenes/QueueSizeDemo';
import QueueTagDemo from '@site/src/components/AlgoScenes/QueueTagDemo';

### 二、方法1：牺牲一个空间（经典方案）
<CircularQueueSacrifice />

#### 1. 核心逻辑（文字版图解）
##### （1）队空状态
```
数组索引：0  1  2  3  4  （MaxSize=5）
元素：    -  -  -  -  -
指针：   ↑↑
     front/rear
```
- 判空条件：`Q.front == Q.rear`（front 和 rear 均指向索引 0，数组内无元素，队列空）。

##### （2）队满状态
```
数组索引：0   1   2   3   4  （MaxSize=5）
元素：   10  20  30  40   -
指针：   ↑               ↑
     front            rear
```
- 判满条件：`(Q.rear + 1) % MaxSize == Q.front`（rear=4，(4+1)%5=0 == front=0，索引 4 为预留空闲位，队列满）。

##### （3）队列长度计算
`(Q.rear - Q.front + MaxSize) % MaxSize`（加 MaxSize 避免 rear < front 时出现负数）。

#### 2. 操作流程（文字版图解，MaxSize=5）
##### 入队流程
1. 初始状态：front=0，rear=0（队空）。
2. 入队 10 → data[0]=10，rear=1 → `front=0, rear=1`：
   ```
   索引：0  1  2  3  4
   元素：10  -  -  -  -
   指针：↑  ↑
     front rear
   ```
3. 入队 20 → data[1]=20，rear=2 → `front=0, rear=2`；
4. 入队 30 → data[2]=30，rear=3 → `front=0, rear=3`；
5. 入队 40 → data[3]=40，rear=4 → `front=0, rear=4`（此时 (4+1)%5=0 == front，队满，无法再入队）。

##### 出队流程
1. 队满状态：front=0，rear=4（元素 10、20、30、40）；
2. 出队 10 → x=data[0]，front=1 → `front=1, rear=4`：
   ```
   索引：0  1  2  3  4
   元素：10 20 30 40  -
   指针：   ↑       ↑
         front    rear
   ```
3. 出队 20 → x=data[1]，front=2 → `front=2, rear=4`；
4. 入队 50 → data[4]=50，rear=0 → `front=2, rear=0`（循环特性体现）：
   ```
   索引：0  1  2  3  4
   元素：50 20 30 40  -
   指针：↑       ↑
     rear    front
   ```

#### 3. 完整实现代码

import CppRunner from '@site/src/components/CppRunner';

<CppRunner initialCode={`#include <iostream>
using namespace std;
typedef int ElemType;
#define MaxSize 10  // 队列最大容量（实际可用 9 个空间）
// 队列结构体定义
typedef struct {
    ElemType data[MaxSize];  // 存储元素的数组
    int front, rear;         // 队头、队尾指针
} SqQueue;
// 初始化队列
void InitQueue(SqQueue& Q) {
    Q.front = Q.rear = 0;  // 初始指针均指向 0
}
// 判断队列是否为空
bool QueueEmpty(SqQueue Q) {
    return Q.front == Q.rear;
}
// 判断队列是否为满
bool QueueFull(SqQueue Q) {
    return (Q.rear + 1) % MaxSize == Q.front;  // 核心判满条件
}
// 入队操作（插入元素到队尾）
bool EnQueue(SqQueue& Q, ElemType x) {
    if (QueueFull(Q)) {
        cout << "队列已满，入队失败！" << endl;
        return false;
    }
    Q.data[Q.rear] = x;                      // 元素存入空闲位置
    Q.rear = (Q.rear + 1) % MaxSize;         // 队尾指针循环后移
    return true;
}
// 出队操作（删除队头元素，用 x 返回）
bool DeQueue(SqQueue& Q, ElemType& x) {
    if (QueueEmpty(Q)) {
        cout << "队列为空，出队失败！" << endl;
        return false;
    }
    x = Q.data[Q.front];                      // 取出队头元素
    Q.front = (Q.front + 1) % MaxSize;        // 队头指针循环后移
    return true;
}
// 获取队头元素（不出队）
bool GetHead(SqQueue Q, ElemType& x) {
    if (QueueEmpty(Q)) {
        cout << "队列为空，无队头元素！" << endl;
        return false;
    }
    x = Q.data[Q.front];
    return true;
}
// 计算队列当前长度
int QueueLength(SqQueue Q) {
    return (Q.rear - Q.front + MaxSize) % MaxSize;
}
// 测试函数
int main() {
    SqQueue Q;
    InitQueue(Q);
    // 测试入队
    EnQueue(Q, 10);
    EnQueue(Q, 20);
    EnQueue(Q, 30);
    cout << "入队 3 个元素后：" << endl;
    cout << "队列长度：" << QueueLength(Q) << endl;  // 输出 3
    cout << "front: " << Q.front << ", rear: " << Q.rear << endl;  // 输出 0, 3
    // 测试获取队头
    ElemType head;
    if (GetHead(Q, head)) {
        cout << "当前队头元素：" << head << endl;  // 输出 10
    }
    // 测试出队
    ElemType out;
    DeQueue(Q, out);
    cout << "出队元素：" << out << endl;  // 输出 10
    cout << "出队后队列长度：" << QueueLength(Q) << endl;  // 输出 2
    // 测试队满（插入 6 个元素，使总元素数达到 9）
    for (int i = 40; i <= 90; i += 10) {
        EnQueue(Q, i);
    }
    cout << "插入 6 个元素后，队列是否已满：" << (QueueFull(Q) ? "是" : "否") << endl;  // 输出 是
    cout << "最终队列长度：" << QueueLength(Q) << endl;  // 输出 9
    return 0;
}
`} />


#### 4. 优缺点
- 优点：实现最简单，无需额外变量，运算效率高。
- 缺点：浪费一个数组空间，MaxSize 为 10 时最多存储 9 个元素，空间利用率略低。
- 适用场景：对空间要求不高、追求代码简洁的场景（如入门教学、简单业务开发）。

---

### 三、方法2：增加 tag 标记位（无空间浪费）
通过添加 `tag` 变量记录最近操作类型，区分指针重合时的空满状态，可充分利用数组空间。

<CircularQueueTag />

#### 1. 核心逻辑（文字版图解）
- `tag` 定义：1 = 最近入队，0 = 最近出队。

##### （1）队空状态
```
数组索引：0  1  2  3  4  （MaxSize=5）
元素：    -  -  -  -  -
指针：      ↑↑
       front/rear
tag：       0
```
- 判空条件：`Q.front == Q.rear && Q.tag == 0`（指针重合且最近为出队，无元素）。

##### （2）队满状态
```
数组索引：0   1   2   3   4  （MaxSize=5）
元素：   10  20  30  40  50
指针：   ↑↑
     front/rear
tag：    1
```
- 判满条件：`Q.front == Q.rear && Q.tag == 1`（指针重合且最近为入队，元素填满）。

#### 2. 操作流程（文字版图解，MaxSize=5）
##### 入队填满流程
1. 初始：front=0，rear=0，tag=0（队空）；
2. 入队 10 → data[0]=10，rear=1，tag=1；
3. 入队 20 → data[1]=20，rear=2，tag=1；
4. 入队 30 → data[2]=30，rear=3，tag=1；
5. 入队 40 → data[3]=40，rear=4，tag=1；
6. 入队 50 → data[4]=50，rear=0，tag=1 → `front=0, rear=0, tag=1`（队满）。

##### 出队再入队流程
1. 队满：front=0，rear=0，tag=1（元素 10、20、30、40、50）；
2. 出队 10 → x=data[0]，front=1，tag=0 → `front=1, rear=0, tag=0`（非空）；
3. 入队 60 → data[0]=60，rear=1，tag=1 → `front=1, rear=1, tag=1`（再次队满）。

#### 3. 完整实现代码

<CppRunner initialCode={`#include <iostream>
using namespace std;
typedef int ElemType;
#define MaxSize 10  // 队列最大容量（全部可用）
// 队列结构体定义（新增 tag 标记位）
typedef struct {
    ElemType data[MaxSize];
    int front, rear;
    int tag;  // 1=最近入队，0=最近出队
} SqQueue;
// 初始化队列
void InitQueue(SqQueue& Q) {
    Q.front = Q.rear = 0;
    Q.tag = 0;  // 初始为空，标记为出队状态
}
// 判断队列是否为空
bool QueueEmpty(SqQueue Q) {
    return Q.front == Q.rear && Q.tag == 0;
}
// 判断队列是否为满
bool QueueFull(SqQueue Q) {
    return Q.front == Q.rear && Q.tag == 1;  // 核心判满条件
}
// 入队操作
bool EnQueue(SqQueue& Q, ElemType x) {
    if (QueueFull(Q)) {
        cout << "队列已满，入队失败！" << endl;
        return false;
    }
    Q.data[Q.rear] = x;
    Q.rear = (Q.rear + 1) % MaxSize;
    Q.tag = 1;  // 标记最近操作为入队
    return true;
}
// 出队操作
bool DeQueue(SqQueue& Q, ElemType& x) {
    if (QueueEmpty(Q)) {
        cout << "队列为空，出队失败！" << endl;
        return false;
    }
    x = Q.data[Q.front];
    Q.front = (Q.front + 1) % MaxSize;
    Q.tag = 0;  // 标记最近操作为出队
    return true;
}
// 获取队头元素
bool GetHead(SqQueue Q, ElemType& x) {
    if (QueueEmpty(Q)) {
        cout << "队列为空，无队头元素！" << endl;
        return false;
    }
    x = Q.data[Q.front];
    return true;
}
// 计算队列当前长度
int QueueLength(SqQueue Q) {
    if (Q.front == Q.rear) {
        return Q.tag == 1 ? MaxSize : 0;  // 满则返回 MaxSize，空则返回 0
    }
    return (Q.rear - Q.front + MaxSize) % MaxSize;
}
// 测试函数
int main() {
    SqQueue Q;
    InitQueue(Q);
    // 测试入队（填满整个队列）
    cout << "开始入队，填满队列：" << endl;
    for (int i = 10; i <= 100; i += 10) {
        EnQueue(Q, i);  // 插入 10-100（共 10 个元素）
    }
    cout << "队列是否已满：" << (QueueFull(Q) ? "是" : "否") << endl;  // 输出 是
    cout << "队列长度：" << QueueLength(Q) << endl;  // 输出 10（MaxSize）
    // 测试出队
    ElemType out;
    DeQueue(Q, out);
    cout << "\n出队元素：" << out << endl;  // 输出 10
    cout << "出队后队列长度：" << QueueLength(Q) << endl;  // 输出 9
    cout << "队列是否为空：" << (QueueEmpty(Q) ? "是" : "否") << endl;  // 输出 否
    // 测试再次入队（填补空出的位置）
    EnQueue(Q, 110);
    cout << "\n再次入队 110 后：" << endl;
    cout << "队列长度：" << QueueLength(Q) << endl;  // 输出 10（再次填满）
    cout << "front: " << Q.front << ", rear: " << Q.rear << ", tag: " << Q.tag << endl;  // 输出 1, 1, 1
    return 0;
}
`} />


#### 4. 优缺点
- 优点：空间利用率 100%，MaxSize 为 10 时可存储 10 个元素，适合空间紧张场景。
- 缺点：需维护 `tag` 变量，入队/出队时需同步更新，易遗漏。
- 适用场景：嵌入式开发、内存受限系统，或需最大化利用存储的场景。

---

### 四、方法3：增加长度计数器（直观易懂）
在结构体中添加 `length` 变量，直接记录元素个数，通过长度数值判断空满，逻辑最直观。

<CircularQueueSize />


#### 1. 核心逻辑（文字版图解）
##### （1）队空状态
```
数组索引：0  1  2  3  4  （MaxSize=5）
元素：    -  -  -  -  -
指针：   ↑  ↑
     front rear
length： 0
```
- 判空条件：`Q.length == 0`（无论指针位置如何，元素个数为 0 则空）。

##### （2）队满状态
```
数组索引：0   1   2   3   4  （MaxSize=5）
元素：   5  15  25  35  45
指针：   ↑               ↑
     front            rear
length： 5
```
- 判满条件：`Q.length == MaxSize`（元素个数达到最大容量则满）。

#### 2. 操作流程（文字版图解，MaxSize=5）
##### 入队流程
1. 初始：front=0，rear=0，length=0（队空）；
2. 入队 5 → data[0]=5，rear=1，length=1；
3. 入队 15 → data[1]=15，rear=2，length=2；
4. 入队 25 → data[2]=25，rear=3，length=3；
5. 入队 35 → data[3]=35，rear=4，length=4；
6. 入队 45 → data[4]=45，rear=0，length=5（队满）。

##### 出队流程
1. 队满：front=0，rear=0，length=5（元素 5、15、25、35、45）；
2. 出队 5 → x=data[0]，front=1，length=4；
3. 出队 15 → x=data[1]，front=2，length=3；
4. 入队 55 → data[0]=55，rear=1，length=4。

#### 3. 完整实现代码

<CppRunner initialCode={`#include <iostream>
using namespace std;
typedef int ElemType;
#define MaxSize 10  // 队列最大容量（全部可用）
// 队列结构体定义（新增 length 计数器）
typedef struct {
    ElemType data[MaxSize];
    int front, rear;
    int length;  // 记录当前元素个数
} SqQueue;
// 初始化队列
void InitQueue(SqQueue& Q) {
    Q.front = Q.rear = 0;
    Q.length = 0;  // 初始长度为 0
}
// 判断队列是否为空
bool QueueEmpty(SqQueue Q) {
    return Q.length == 0;  // 核心判空条件
}
// 判断队列是否为满
bool QueueFull(SqQueue Q) {
    return Q.length == MaxSize;  // 核心判满条件
}
// 入队操作
bool EnQueue(SqQueue& Q, ElemType x) {
    if (QueueFull(Q)) {
        cout << "队列已满，入队失败！" << endl;
        return false;
    }
    Q.data[Q.rear] = x;
    Q.rear = (Q.rear + 1) % MaxSize;
    Q.length++;  // 入队成功，长度+1
    return true;
}
// 出队操作
bool DeQueue(SqQueue& Q, ElemType& x) {
    if (QueueEmpty(Q)) {
        cout << "队列为空，出队失败！" << endl;
        return false;
    }
    x = Q.data[Q.front];
    Q.front = (Q.front + 1) % MaxSize;
    Q.length--;  // 出队成功，长度-1
    return true;
}
// 获取队头元素
bool GetHead(SqQueue Q, ElemType& x) {
    if (QueueEmpty(Q)) {
        cout << "队列为空，无队头元素！" << endl;
        return false;
    }
    x = Q.data[Q.front];
    return true;
}
// 计算队列当前长度（直接返回 length）
int QueueLength(SqQueue Q) {
    return Q.length;
}
// 测试函数
int main() {
    SqQueue Q;
    InitQueue(Q);
    // 测试入队
    EnQueue(Q, 5);
    EnQueue(Q, 15);
    EnQueue(Q, 25);
    cout << "入队 3 个元素后：" << endl;
    cout << "队列长度：" << QueueLength(Q) << endl;  // 输出 3
    cout << "front: " << Q.front << ", rear: " << Q.rear << endl;  // 输出 0, 3
    // 测试出队
    ElemType out;
    DeQueue(Q, out);
    cout << "\n出队元素：" << out << endl;  // 输出 5
    cout << "出队后队列长度：" << QueueLength(Q) << endl;  // 输出 2
    // 测试队满
    cout << "\n继续入队，直到满：" << endl;
    for (int i = 35; i <= 95; i += 10) {
        EnQueue(Q, i);  // 插入 35-95（共 7 个元素）
    }
    cout << "队列是否已满：" << (QueueFull(Q) ? "是" : "否") << endl;  // 输出 是
    cout << "最终队列长度：" << QueueLength(Q) << endl;  // 输出 10
    return 0;
}
`} />


#### 4. 优缺点
- 优点：逻辑直观，判空判满无需复杂运算，代码易维护、出错率低。
- 缺点：需维护 `length` 变量，入队/出队时需同步更新（遗漏会导致逻辑错误）。
- 适用场景：大型项目、团队协作开发，或追求代码可读性的场景。

---

### 五、三种方法全面对比
| 对比维度       | 方法1：牺牲一个空间 | 方法2：tag 标记位 | 方法3：长度计数器 |
|----------------|--------------------|-------------------|--------------------|
| 空间利用率     | 较低（MaxSize-1）  | 最高（MaxSize）   | 最高（MaxSize）    |
| 实现复杂度     | 低（无需额外变量）  | 中（维护 tag）    | 低-中（维护 length）|
| 判空判满效率   | O(1)               | O(1)              | O(1)               |
| 代码可读性     | 中                 | 中-低             | 高                 |
| 出错风险       | 低                 | 中（易漏更 tag）  | 低（易漏更 length）|
| 适用场景       | 入门教学、简单开发 | 内存受限场景      | 大型项目、团队协作 |
import CircularQueueGallery from '@site/src/components/AlgoScenes/CircularQueueGallery';

为了解决判满和判空条件冲突 (`front == rear`) 的问题，工程上有三种经典解法。
点击下方选项卡，观察不同方法的代码逻辑和状态变化。

<CircularQueueGallery />

### 六、使用建议
1. 学习/简单开发：选**方法1**，代码简洁不易出错；
2. 内存受限场景（嵌入式/单片机）：选**方法2**，最大化利用空间；
3. 大型项目/团队协作：选**方法3**，可读性强、维护成本低。

三种方法时间复杂度均为 O(1)，核心差异仅在空间利用率和维护成本，可根据实际场景灵活选择。

---

#### 补充：常见错误与排查
1. 指针移动未取模：导致数组下标越界 → 所有指针后移必须用 `(ptr+1)%MaxSize`；
2. tag/length 未同步更新：导致空满判断错误 → 入队/出队时务必更新标记/长度；
3. 混淆队头/队尾指针含义：rear 指向“队尾元素的下一个空闲位”，而非队尾元素本身。
 