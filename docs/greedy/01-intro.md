---
id: intro
title: 贪心算法
sidebar_position: 1
---


这份**贪心算法进阶与考研实战指南**，专门针对计算机考研（408或自主命题）及算法面试。

在考研中，贪心算法通常出现在**算法设计题**（大题）或**选择题**（如求哈夫曼树WPL、最小生成树权值）中。

---

### 一、 贪心算法的“考研视角”

在考试中，贪心算法的本质是：**排序 + 策略**。
绝大多数贪心题目，第一步都是**排序**（结构体排序或优先队列）。

**判断能否用贪心的两个标准（交换论证法）：**
如果你不确定某种贪心策略是否正确，可以尝试**“微扰”**（Exchange Argument）：
> 假设最优解不是按照你的贪心策略排列的，如果我们交换其中两个相邻元素的位置，结果变差了或没变，说明原本的顺序就是最优的。

---

### 二、 考研高频模型详解

#### 模型一：区间问题（最经典）


import GreedyInterval from '@site/src/components/AlgoScenes/GreedyInterval';

##### 贪心算法：活动安排问题演示

下面是一个交互式演示。尝试添加你自己的数据，或者点击“开始演示”查看算法如何通过**最早结束时间**策略来选择最多的活动。

<GreedyInterval />

**题目类型**：活动安排、区间覆盖、甚至是一些变种的操作系统进程调度。

**【考研例题】活动安排问题**
> **题目描述**：设有 $n$ 个活动 $E = \{1, 2, ..., n\}$，每个活动 $i$ 都有开始时间 $s_i$ 和结束时间 $f_i$。如果选择了活动 $i$，则在 $[s_i, f_i)$ 区间内不能安排其他活动。求最多能安排多少个活动？

**核心考点**：排序策略的选择。
1.  按开始时间早排？❌ (反例：[0, 24] 挡住了所有活动)
2.  按持续时间短排？❌ (反例：[4,6] 卡在 [1,5] 和 [5,9] 中间)
3.  **按结束时间早排**？✅ (给后面留出的空闲时间越多，能装下的活动就越多)

**代码实现 (C++)**：

<CppRunner initialCode={`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
struct Activity {
    int id;
    int start;
    int end;
};
// 关键：结束时间早的排前面
bool cmp(Activity a, Activity b) {
    return a.end < b.end;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<Activity> acts(n);
    for (int i = 0; i < n; ++i) {
        acts[i].id = i;
        cin >> acts[i].start >> acts[i].end;
    }
    // 1. 排序
    sort(acts.begin(), acts.end(), cmp);
    // 2. 贪心选择
    int count = 1;              // 第一个活动必定选中
    int last_end = acts[0].end;
    for (int i = 1; i < n; ++i) {
        if (acts[i].start >= last_end) { // 不冲突
            ++count;
            last_end = acts[i].end;
        }
    }
    cout << "最多活动数: " << count ;
    return 0;
}`} />



---

#### 模型二：哈夫曼模型 (Huffman / 合并果子)

import HuffmanVis from '@site/src/components/AlgoScenes/HuffmanVis';

##### 哈夫曼编码动态演示

哈夫曼树通过贪心策略构建：**“只要权重最小的，合并起来就是局部最优。”**

<HuffmanVis />

**题目类型**：求最小带权路径长度 (WPL)、合并文件的最小代价。这是**数据结构选择题**和**算法题**的常客。

**【考研例题】合并果子 (类 POJ 3253)**
> **题目描述**：有 $n$ 堆果子，每堆数量不同。每次可以将任意两堆果子合并成一堆，合并的代价是两堆果子的数量之和。求将所有果子合并成一堆的最小总代价。
> *输入：3堆果子，数量分别为 10, 2, 9*
> *过程：先合并2和9(代价11)，剩10, 11；再合并10, 11(代价21)，总代价 11+21=32。*

**核心考点**：优先队列 (小顶堆)。
贪心策略是：**每次总是合并当前最小的两堆**。
如果用数组每合并一次就重新排序，复杂度是 $O(N^2 \log N)$ 或 $O(N^2)$，会超时。必须使用**小顶堆**，复杂度降为 $O(N \log N)$。

**代码实现 (C++)**：

<CppRunner initialCode={`#include <iostream>
#include <vector>
#include <queue>   // 小顶堆必须
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    // 小顶堆：每次取最小两堆合并
    priority_queue<int, vector<int>, greater<int>> pq;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        pq.push(x);
    }
    long long total_cost = 0;
    while (pq.size() > 1) {
        int first  = pq.top(); pq.pop();
        int second = pq.top(); pq.pop();
        int combined = first + second;
        total_cost += combined;
        pq.push(combined);
    }
    cout << "最小代价: " << total_cost;
    return 0;
}`} />


---

#### 模型三：拼接最大/最小数 (排序策略变种)

**题目类型**：给定一组数字（或字符串），将其拼接成一个最大的整数。
**例如**：`[3, 30, 34, 5, 9]` $\rightarrow$ 拼接最大数为 `9534330`。

**【考研例题】**
如果直接按字典序排序：`3` 比 `30` 大（字符串比较），但 `330` < `303`？不对。
**贪心策略**：
对于两个字符串 $a$ 和 $b$：
*   如果 $a + b > b + a$，则 $a$ 应该排在 $b$ 前面。
*   反之 $b$ 排在 $a$ 前面。

**代码实现 (C++)**：

import CppRunner from '@site/src/components/CppRunner';


<CppRunner initialCode={`#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
// 自定义排序：如果 a+b > b+a，则 a 排在前面
bool cmp(const string &a, const string &b) {
    return a + b > b + a;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<string> nums = {"3", "30", "34", "5", "9"};
    // 排序
    sort(nums.begin(), nums.end(), cmp);
    // 拼接
    string res;
    for (const string &s : nums) res += s;
    // 处理前导 0 情况
    if (res.empty() || res[0] == '0') cout << "0";
    else cout << res;
    return 0;
}`} />

---

#### 模型四：覆盖问题 (贪心 + 几何思维)

**题目类型**：用最少的点刺破所有气球，或者用最少的区间覆盖线段。

**【考研例题】LeetCode 452. 用最少数量的箭引爆气球**
> **题目描述**：气球在一个平面上，由区间 $[start, end]$ 表示。一支箭可以选择从 $x$ 点垂直射出，如果 $start \le x \le end$，则气球被引爆。求引爆所有气球所需的最少箭数。

**思路**：
1.  按**结束坐标**从小到大排序。
2.  第一支箭射向第一个气球的**结束位置**（因为这样最可能覆盖到后面开始的气球）。
3.  遍历后续气球，如果它的**开始位置**在当前箭的射程内，说明这支箭能顺便把它带走；否则，需要一支新箭。

**代码实现 (C++)**：

<CppRunner initialCode={`#include <algorithm>
#include <vector>
#include <iostream>
using namespace std;
int findMinArrowShots(vector<vector<int>>& points) {
    if (points.empty()) return 0;
    // 按结束坐标升序排序
    sort(points.begin(), points.end(), [](const vector<int>& a, const vector<int>& b) {
        return a[1] < b[1];
    });
    int arrows = 1;
    int current_arrow_pos = points[0][1]; // 第一支箭射在第一个气球边缘
    for (size_t i = 1; i < points.size(); ++i) {
        if (points[i][0] > current_arrow_pos) { // 需要新箭
            arrows++;
            current_arrow_pos = points[i][1];
        }
    }
    return arrows;
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<vector<int>> points(n, vector<int>(2));
    for (int i = 0; i < n; ++i) {
        cin >> points[i][0] >> points[i][1]; // 输入每个气球的 [start, end]
    }
    cout << findMinArrowShots(points) ;
    return 0;
}
`} />



---

### 三、 考研答题模板（针对算法设计大题）

如果在考研专业课（如408数据结构）的大题中遇到贪心题，建议按以下格式作答，得分率最高：

1.  **算法思想**：
    > "本题采用贪心算法。首先将所有元素按照 [某某特征] 进行 [升序/降序] 排序。然后依次遍历，每次选择 [满足某条件] 的元素加入结果集。这种策略保证了局部最优从而达到全局最优。"

2.  **数据结构定义**：
    > "定义结构体 Node 包含属性 x, y... 使用快速排序算法对数组进行排序..."

3.  **代码实现**：
    > (写出 C/C++ 代码，注意关键部分的注释)

4.  **复杂度分析**（必写，占分）：
    > "时间复杂度：主要消耗在排序上，为 $O(N \log N)$。遍历过程为 $O(N)$，故总时间复杂度为 $O(N \log N)$。"
    > "空间复杂度：$O(1)$（如果原地排序）或 $O(N)$（如果用了辅助结构）。"

### 四、 总结：贪心算法常见“变身”

| 题目关键词 | 推荐贪心策略 | 备注 |
| :--- | :--- | :--- |
| **区间/活动/调度** | 按**右端点**（结束时间）升序排序 | 最不容易出错的策略 |
| **合并果子/哈夫曼** | 使用**优先队列**（小顶堆） | 每次取最小的两个 |
| **最大整数/拼接** | 自定义排序 `a+b > b+a` | 不要直接比大小 |
| **背包 (可切分)** | 按**性价比**（价值/重量）降序排序 | 注意只能用于分数背包 |
| **覆盖/点集** | 排序后维护一个覆盖范围 `end` | 几何思维 |

掌握以上这四种模型，基本能覆盖考研和面试中 90% 的贪心算法题目。