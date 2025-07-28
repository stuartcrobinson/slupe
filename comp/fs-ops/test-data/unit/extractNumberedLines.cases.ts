export const cases = [
  {
    name: "extract single line",
    input: ["Line 1\nLine 2\nLine 3", "2", ": "],
    expected: {
      result: "2: Line 2",
      lineCount: 3
    }
  },
  {
    name: "extract line range",
    input: ["First\nSecond\nThird\nFourth", "2-3", ": "],
    expected: {
      result: "2: Second\n3: Third",
      lineCount: 4
    }
  },
  {
    name: "custom delimiter",
    input: ["A\nB\nC", "1-2", "    "],
    expected: {
      result: "1    A\n2    B",
      lineCount: 3
    }
  },
  {
    name: "empty delimiter",
    input: ["One\nTwo\nThree", "2", ""],
    expected: {
      result: "2Two",
      lineCount: 3
    }
  },
  {
    name: "out of range line",
    input: ["Only\nTwo", "5", ": "],
    expected: {
      result: "",
      lineCount: 2,
      outOfRange: {
        requested: "5",
        actual: 2
      }
    }
  },
  {
    name: "out of range end",
    input: ["One\nTwo\nThree", "2-10", ": "],
    expected: {
      result: "2: Two\n3: Three",
      lineCount: 3,
      outOfRange: {
        requested: "2-10",
        actual: 3
      }
    }
  },
  {
    name: "empty content",
    input: ["", "1", ": "],
    expected: {
      result: "",
      lineCount: 0
    }
  },
  {
    name: "single line content",
    input: ["Just one line", "1", ": "],
    expected: {
      result: "1: Just one line",
      lineCount: 1
    }
  },
  {
    name: "large line numbers",
    input: [Array.from({length: 12}, (_, i) => `Line ${i + 1}`).join('\n'), "9-11", ": "],
    expected: {
      result: " 9: Line 9\n10: Line 10\n11: Line 11",
      lineCount: 12
    }
  },
  {
    name: "padding across digit boundaries - tens",
    input: [Array.from({length: 15}, (_, i) => `Line ${i + 1}`).join('\n'), "8-12", ": "],
    expected: {
      result: " 8: Line 8\n 9: Line 9\n10: Line 10\n11: Line 11\n12: Line 12",
      lineCount: 15
    }
  },
  {
    name: "padding across digit boundaries - hundreds", 
    input: [Array.from({length: 105}, (_, i) => `Line ${i + 1}`).join('\n'), "98-102", ": "],
    expected: {
      result: " 98: Line 98\n 99: Line 99\n100: Line 100\n101: Line 101\n102: Line 102",
      lineCount: 105
    }
  },
  {
    name: "invalid line spec - not a number",
    input: ["content", "abc", ": "],
    throws: "Invalid line specification 'abc'"
  },
  {
    name: "invalid line spec - negative",
    input: ["content", "-5", ": "],
    throws: "Invalid line specification '-5'"
  },
  {
    name: "invalid range - reversed",
    input: ["content", "5-3", ": "],
    throws: "Invalid line range '5-3' (start must be <= end)"
  },
  {
    name: "invalid range - negative start",
    input: ["content", "-1-5", ": "],
    throws: "Invalid line specification '-1-5'"
  },
  {
    name: "invalid range - too many parts",
    input: ["content", "1-2-3", ": "],
    throws: "Invalid line specification '1-2-3'"
  },
  {
    name: "undefined lineSpec - read all",
    input: ["Line A\nLine B\nLine C", undefined, ": "],
    expected: {
      result: "1: Line A\n2: Line B\n3: Line C",
      lineCount: 3
    }
  },
  {
    name: "undefined lineSpec - empty file",
    input: ["", undefined, ": "],
    expected: {
      result: "",
      lineCount: 0
    }
  }
];