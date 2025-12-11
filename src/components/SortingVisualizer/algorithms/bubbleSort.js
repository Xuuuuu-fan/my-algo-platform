export const bubbleSort = {
  name: "冒泡排序 (Bubble)",
  code: [
    "for i from 0 to n-1:",
    "  for j from 0 to n-i-1:",
    "    if arr[j] > arr[j+1]:",
    "      swap(arr[j], arr[j+1])"
  ],
  run: function* (arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      yield { arr: [...arr], line: 0, active: [], sorted: [] };
      for (let j = 0; j < n - i - 1; j++) {
        yield { arr: [...arr], line: 1, active: [j, j + 1], sorted: [] };
        // 比较
        yield { arr: [...arr], line: 2, active: [j, j + 1], sorted: [] };
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          // 交换
          yield { arr: [...arr], line: 3, active: [j, j + 1], swap: true, sorted: [] };
        }
      }
    }
    yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
  }
};