---
id: intro
title: 1. 树的定义与术语
sidebar_position: 1
---

待续

import GraphOperationsGallery from '@site/src/components/AlgoScenes/GraphOperationsGallery';

## 1.图的基本操作动态演示

图的操作效率很大程度上取决于存储结构。
下方对比了**邻接矩阵**和**邻接表**在"添加边"和"删除顶点"时的不同表现。

:::tip 考研重点
*   **邻接矩阵**：删点极慢 O(|V|²)，因为要搬移大量数组元素。加边极快 O(1)。
*   **邻接表**：删点较慢 O(|E|)，因为要遍历所有边表找入边。加边极快 O(1) (头插法)。
:::

<GraphOperationsGallery />

import GraphStorageGallery from '@site/src/components/AlgoScenes/GraphStorageGallery';

[//]: # (## 2.图的存储结构演示)

[//]: # ()
[//]: # (图的存储方法多种多样，除了基础的矩阵和邻接表，还有专门解决特定问题的**十字链表**和**邻接多重表**。)

[//]: # ()
[//]: # (:::tip 难点解析)

[//]: # (*   **十字链表**：用于**有向图**。它像一个矩阵，但每个“格子”是一个链表节点。绿线代表出度（Tail），橙线代表入度（Head）。容易求顶点的出度和入度。)

[//]: # (*   **邻接多重表**：用于**无向图**。解决了邻接表中“一条边存两遍”的冗余，且删除边时不需要遍历两个链表。)

[//]: # (:::)

[//]: # ()
[//]: # (<GraphStorageGallery />)


[//]: # (// import CustomGraphBuilder from '@site/src/components/AlgoScenes/CustomGraphBuilder';)

[//]: # (## 🚀 实验室：自定义有向图与十字链表)

[//]: # ()
[//]: # (你可以自由创建节点和连线，算法会实时为你构建十字链表。)

[//]: # ()
[//]: # (<CustomGraphBuilder />)

[//]: # ()
[//]: # (**使用说明：**)

[//]: # (1. 点击 **添加顶点** 增加节点（支持拖拽移动）。)

[//]: # (2. 在下拉框选择起点和终点，点击 **添加/删除连线**。)

[//]: # (3. 观察右侧生成的十字链表：)

[//]: # (   - 绿色线连接同一行的节点（从 V0 出发的边）。)

[//]: # (   - 橙色线连接同一列的节点（指向 V1 的边）。)

[//]: # (- ---)

[//]: # (id: storage)

[//]: # (title: 图的存储结构)

[//]: # (---)

[//]: # (import OrthogonalListVisualizer from '@site/src/components/AlgoScenes/OrthogonalListVisualizer';)

[//]: # ()
[//]: # (# 图的存储结构)

[//]: # ()
[//]: # (## 4. 十字链表 &#40;Orthogonal List&#41;)

[//]: # ()
[//]: # (十字链表是有向图的另一种链式存储结构。可以看作是**邻接表**和**逆邻接表**的结合。)

[//]: # ()
[//]: # (### 核心特性)

[//]: # (- **顶点结点**：包含数据域 `data`，入边链头 `firstIn`，出边链头 `firstOut`。)

[//]: # (- **弧结点**：包含尾域 `tailVex` &#40;起点&#41;，头域 `headVex` &#40;终点&#41;，链头链域 `hLink` &#40;指向下一条同入度的边&#41;，链尾链域 `tLink` &#40;指向下一条同出度的边&#41;。)

[//]: # ()
[//]: # (### 交互演示)

[//]: # (下方左侧是逻辑图，右侧是十字链表在内存中的形态。)

[//]: # (- **添加/删除连线**，观察右侧 **橙色&#40;tLink&#41;** 和 **绿色&#40;hLink&#41;** 线条的变化。)

[//]: # (- **橙色实线**：表示 `tLink`，连接所有**起点相同**的边（相当于邻接表）。)

[//]: # (- **绿色虚线**：表示 `hLink`，连接所有**终点相同**的边（相当于逆邻接表）。)

[//]: # ()
[//]: # (<OrthogonalListVisualizer />)
## 2.十字链表
import OrthogonalListDemo from '@site/src/components/AlgoScenes/OrthogonalListDemo';

<OrthogonalListDemo />


## 3.邻接多重表
import AdjacencyMultilistDemo from '@site/src/components/AlgoScenes/AdjacencyMultilistDemo';

<AdjacencyMultilistDemo />

## 4.邻接矩阵法
可切换有向图/无向图

import AdjacencyMatrixDemo from '@site/src/components/AlgoScenes/AdjacencyMatrixDemo';

<AdjacencyMatrixDemo />

## 5.邻接表法
import AdjacencyListDemo from '@site/src/components/AlgoScenes/AdjacencyListDemo';

<AdjacencyListDemo />

## 6.深度遍历
import DFSVisualizer from '@site/src/components/AlgoScenes/DFSVisualizer';

<DFSVisualizer />


## 7.广度遍历
import BFSVisualizer from '@site/src/components/AlgoScenes/BFSVisualizer';

<BFSVisualizer />

## 8.广度/深度最小生成树
import GraphTreeDemo from '@site/src/components/AlgoScenes/GraphTreeDemo';

<GraphTreeDemo />

## 9.prime
import PrimVisualizer from '@site/src/components/AlgoScenes/PrimVisualizer';

<PrimVisualizer />

## 10.kruskal
import KruskalVisualizer from '@site/src/components/AlgoScenes/KruskalVisualizer';

<KruskalVisualizer />

## 11.最短路径.bfs
import BFSShortestPath from '@site/src/components/AlgoScenes/BFSShortestPath';

<BFSShortestPath />

## 12.最短路径.dijkstra
import DijkstraVisualizer from '@site/src/components/AlgoScenes/DijkstraVisualizer';

<DijkstraVisualizer />

## 13.最短路径.floyd
import FloydVisualizer from '@site/src/components/AlgoScenes/FloydVisualizer';

<FloydVisualizer />

## 14.拓扑排序
import TopologicalSortVisualizer from '@site/src/components/AlgoScenes/TopologicalSortVisualizer';

<TopologicalSortVisualizer />

## 15.关键路径
import CPMVisualizer from '@site/src/components/AlgoScenes/CPMVisualizer';

<CPMVisualizer />