---
id: deep
title: 八.深度优先遍历
sidebar_position: 8
---

### 1.代码
```cpp
bool visited[MAX_VERTEX_NUM]; //访问标记数组
void DFS(Graph G,int v){ //从顶点v出发, 深度优先遍历图G
    visit(v);             //访问顶点v
    visited[v]=TRUE;      //设已访问标记
    for(w=FirstNeighbor(G,v);w>=0;w=NextNeighbor(G,v,w))
        if(!visited[w]){  //w为u的尚未访问的邻接顶点
            DFS(G,w);
        } //if
}
```


import DFSVisualizer from '@site/src/components/AlgoScenes/DFSVisualizer';

<DFSVisualizer />

### 2.图解代码
**(访问顺序为从小到大)**
![Img](/assets/图/34.png)
``如果我们从2号顶点出发深度优先遍历整个图;``
- 所以,刚开始调用 DFS函数 传入v的值为2;同时将2的 visit 值标为 True;
![Img](/assets/图/38.png)
![Img](/assets/图/21.png)
``访问2的邻接顶点1:``
- 然后,根据DFS函数中的 for循环;2周围遍历的第一个数是1;`将1填入栈中,并将visit值改为True;`
![Img](/assets/图/39.png)

``访问1的邻接顶点2,5``:
- 2顶点已经被访问过了;访问5
- 将5填入栈中,并标记为True;
![Img](/assets/图/40.png)

``5的邻接顶点已经被访问``:
- 返回到上一层:1号顶点;
![Img](/assets/图/41.png)

``1的邻接顶点也已经遍历完成``:
- 继续返回上一层:2号顶点;
![Img](/assets/图/42.png)

``2号顶点的邻接顶点6没有被访问:``
- for循环访问6号顶点,填入栈;并visit值改为True;
![Img](/assets/图/43.png)

![Img](/assets/图/44.png)

``6号顶点的邻接顶点:2,3,7``:
- 2号顶点已经被访问,从小到大第一个应该访问3号顶点;
- 此时3号顶点进行DFS;

![Img](/assets/图/45.png)


``继续遍历操作:``
![Img](/assets/图/46.png)
![Img](/assets/图/47.png)
- 如上图所示:`最后遍历到8号顶点`;与之相邻的顶点 visit 值全为 True;-
- `此时遍历结束,返回上一层顶点`;
![Img](/assets/图/48.png)
类似,最终得到空栈:
![Img](/assets/图/49.png)

**从2出发的深度遍历序列: 2, 1, 5, 6, 3, 4, 7, 8**

### 3.特殊情况
![Img](/assets/图/50.png)
```cpp
bool visited[MAX_VERTEX_NUM]; //访问标记数组
void DFSTraverse(Graph G){ //对图G进行深度优先遍历
    for(v=0;v<G.vexnum;++v)
        visited[v]=FALSE;     //初始化已访问标记数据
    for(v=0;v<G.vexnum;++v)   //本代码中是从v=0开始遍历
        if(!visited[v])
            DFS(G,v);
}

void DFS(Graph G,int v){ //从顶点v出发, 深度优先遍历图G
    visit(v);             //访问顶点v
    visited[v]=TRUE;      //设已访问标记
    for(w=FirstNeighbor(G,v);w>=0;w=NextNeighbor(G,v,w))
        if(!visited[w]){  //w为u的尚未访问的邻接顶点
            DFS(G,w);
        } //if
}
```

深度优先遍历（DFS）的时间和空间复杂度，同样与**图的存储方式**和**图的结构**相关，以下是详细分析：

### 4.复杂度
#### (1)、时间复杂度
DFS的时间开销来自「访问所有顶点」和「遍历所有边」，核心由存储方式决定：
- **邻接表存储**：
  每个顶点的邻接链表会被遍历一次，总时间为「顶点数 \( n \)」+「边数 \( e \)」，时间复杂度为 \( \boldsymbol{O(n + e)} \)。
- **邻接矩阵存储**：
  需遍历每个顶点对应的整行（检查是否有边），总时间为 \( n^2 \)，时间复杂度为 \( \boldsymbol{O(n^2)} \)。


#### (2)、空间复杂度
DFS的空间开销主要来自「递归调用栈」（递归实现）或「手动栈」（非递归实现），以及「访问标记数组」：
1. **访问标记数组**：
   大小为 \( n \)（顶点数），空间复杂度为 \( O(n) \)。
2. **递归/手动栈**：
   栈的最大深度取决于「图的最深递归路径长度」（即图的**深度**）：
   - 最坏情况（如链式图：\( 0→1→2→…→n-1 \)）：栈深度为 \( n \)，空间复杂度为 \( O(n) \)；
   - 最好情况（如孤立顶点）：栈深度为 \( 1 \)，空间复杂度为 \( O(1) \)。

因此，DFS的**总空间复杂度为 \( \boldsymbol{O(n)} \)**（无论存储方式）。


#### (3).总结
| 存储方式   | 时间复杂度 | 空间复杂度 |
|------------|------------|------------|
| 邻接表     | \( O(n+e) \) | \( O(n) \)  |
| 邻接矩阵   | \( O(n^2) \) | \( O(n) \)  |

## 5.深度最小生成树
import GraphTreeDemo from '@site/src/components/AlgoScenes/GraphTreeDemo';

<GraphTreeDemo />

## 6.深度优先生成树和森林

import CustomGraphTraversal from '@site/src/components/AlgoScenes/CustomGraphTraversal';

#### 自定义图的遍历与森林生成

在这里，你可以自由绘制一个图（甚至是非连通图），然后观察 BFS 和 DFS 算法是如何运行的。

#### 交互说明
1.  **添加节点**：点击上方“+ 节点”按钮。
2.  **连线**：点击一个节点（变金），再点击另一个节点。
3.  **移动**：按住节点拖拽。
4.  **删除**：双击节点。
5.  **切换算法**：左上角选择 BFS 或 DFS。

<CustomGraphTraversal />

:::tip 实验建议
试着画两个互不相连的三角形，然后点击“开始生成森林”，观察算法是如何自动跳跃到第二个连通分量的。
:::

import DFSGenerateTree from '@site/src/components/AlgoScenes/DFSGenerateTree';

一个连通图的生成树是指一个极小连通子图，它包含图中所有顶点，但只有足以构成一棵树的 $n-1$ 条边。
通过 **深度优先搜索 (DFS)** 遍历图所经过的边和顶点构成的树，称为深度优先生成树。

#### 动态演示

*   **左侧 (原图)**：显示 DFS 遍历过程。橙色节点表示当前访问，绿色表示已访问。
*   **右侧 (生成树)**：同步显示生成的树结构。注意观察原图中的**回路**是如何被打破的（非树边被丢弃）。

<DFSGenerateTree />

#### 核心性质
1.  **无回路**：生成树中不存在环。
2.  **连通性**：包含原图的所有顶点。
3.  **边数**：如果有 $n$ 个顶点，生成树一定有 $n-1$ 条边。