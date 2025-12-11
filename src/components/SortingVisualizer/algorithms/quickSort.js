export const quickSort = {
  name: "快速排序 (Quick)",
  code: [
    "pivot = partition(arr, low, high)",
    "check left < right",
    "swap elements < pivot to left",
    "recurse(left, pivot), recurse(pivot+1, right)"
  ],
  run: function* (arr) {
    function* partition(low, high) {
      // ... (此处填入原代码中的 partition 逻辑)
    }
    function* sort(low, high) {
      // ... (此处填入原代码中的 sort 逻辑)
    }
    yield* sort(0, arr.length - 1);
    yield { arr: [...arr], line: -1, active: [], sorted: arr.map((_, i) => i) };
  }
};