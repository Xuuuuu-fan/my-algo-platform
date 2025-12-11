---
id: compare
title: 五、代码实现
sidebar_position: 5
---


import HashTableVisualizer from '@site/src/components/AlgoScenes/HashTableVisualizer';

<HashTableVisualizer />


为了演示底层原理，我们手动实现一个简单的哈希表（Key 为 int）。

```cpp
#include <iostream>
#include <vector>
#include <list>

using namespace std;

// 哈希表的大小（通常选择素数以减少冲突）
const int TABLE_SIZE = 7; 

class HashTable {
private:
    // 使用 vector 作为数组，list 作为桶(链表)
    vector<list<int>> table;

    // 哈希函数
    int hashFunction(int key) {
        return key % TABLE_SIZE;
    }

public:
    HashTable() {
        table.resize(TABLE_SIZE);
    }

    // 1. 插入数据
    void insertItem(int key) {
        int index = hashFunction(key);
        table[index].push_back(key); // 挂在链表后面
    }

    // 2. 删除数据
    void deleteItem(int key) {
        int index = hashFunction(key);
        // 遍历链表寻找目标
        list<int>::iterator i;
        for (i = table[index].begin(); i != table[index].end(); i++) {
            if (*i == key) {
                table[index].erase(i);
                return;
            }
        }
    }

    // 3. 打印哈希表
    void displayHash() {
        for (int i = 0; i < TABLE_SIZE; i++) {
            cout << "Bucket " << i << ": ";
            for (int x : table[i]) {
                cout << x << " -> ";
            }
            cout << "NULL" << endl;
        }
    }
};

int main() {
    HashTable ht;
    int a[] = {15, 11, 27, 8, 12};
    // 15 % 7 = 1
    // 11 % 7 = 4
    // 27 % 7 = 6
    // 8  % 7 = 1 (冲突！15和8在同一个桶)
    // 12 % 7 = 5
    
    for(int x : a) ht.insertItem(x);
    
    ht.displayHash();
    return 0;
}
```

### 输出示例：
```text
Bucket 0: NULL
Bucket 1: 15 -> 8 -> NULL  <-- 冲突处理成功
Bucket 2: NULL
Bucket 3: NULL
Bucket 4: 11 -> NULL
Bucket 5: 12 -> NULL
Bucket 6: 27 -> NULL
```

---
