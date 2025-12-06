---
id: know
title: 五、知识回顾
sidebar_position: 5
---


| 栈类型 | 核心参数 | 入栈操作 | 出栈操作 | 取栈顶操作 | 空/满条件 |
|--------|----------|----------|----------|------------|-----------|
| 顺序栈（top=-1初始化） | 静态数组+top指针 | `S.data[++S.top]=x` | `x=S.data[S.top--]` | `x=S.data[S.top]` | 空：top=-1；满：top=MaxSize-1 |
| 顺序栈（top=0初始化） | 静态数组+top指针 | `S.data[S.top++]=x` | `x=S.data[--S.top]` | `x=S.data[S.top-1]` | 空：top=0；满：top=MaxSize |
| 共享栈 | 静态数组+top0/top1指针 | 左栈：`S.data[++S.top0]=x`；右栈：`S.data[--S.top1]=x` | 左栈：`x=S.data[S.top0--]`；右栈：`x=S.data[S.top1++]` | - | 空：左栈top0=-1、右栈top1=MaxSize；满：top0+1==top1 |
