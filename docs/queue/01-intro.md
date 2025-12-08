---
id: intro
title: 一、队列的基础定义与基本操作
sidebar_position: 1
---

### 1. 队列的核心概念
队列（Queue）是只允许在**一端插入**、**另一端删除**的线性表，涉及以下关键术语：
- **队头**：允许删除元素的一端
- **队尾**：允许插入元素的一端
- **空队列**：不含任何元素的队列

### 2. 队列的基本操作
队列的操作围绕“增删查”展开，且大多仅访问队头元素，核心操作如下：
- `InitQueue(&Q)`：初始化队列，构造一个空队列Q
- `DestroyQueue(&Q)`：销毁队列，释放队列占用的内存空间
- `EnQueue(&Q, x)`：入队，若队列未满，将元素x加入队尾
- `DeQueue(&Q, &x)`：出队，若队列非空，删除队头元素并用x返回其值
- `GetHead(Q, &x)`：读队头元素，若队列非空，将队头元素赋值给x
- `QueueEmpty(Q)`：判断队列是否为空，空则返回true，否则返回false


import QueueVisualizer from '@site/src/components/AlgoScenes/QueueVisualizer';

<QueueVisualizer />