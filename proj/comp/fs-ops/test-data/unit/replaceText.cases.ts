export const cases = [
  {
    name: "simple replacement",
    input: ["hello world", "world", "universe"],
    expected: {
      result: "hello universe",
      replacements: 1,
    },
  },
  {
    name: "multiple replacements",
    input: ["foo bar foo baz", "foo", "qux"],
    expected: {
      result: "qux bar qux baz",
      replacements: 2,
    },
  },
  {
    name: "limited replacements",
    input: ["foo bar foo baz foo", "foo", "qux", 2],
    expected: {
      result: "qux bar qux baz foo",
      replacements: 2,
    },
  },
  {
    name: "multiline content replacement",
    input: [
`function oldName() {
  console.log('oldName');
  return oldName;
}`,
      "oldName",
      "newName",
    ],
    expected: {
      result: 
`function newName() {
  console.log('newName');
  return newName;
}`,
      replacements: 3,
    },
  },
  {
    name: "multiline search and replace",
    input: [
`const config = {
  old: {
    setting: true
  },
  other: false
};`,
`old: {
    setting: true
  }`,
`new: {
    setting: false,
    extra: 'value'
  }`,
    ],
    expected: {
      result: 
`const config = {
  new: {
    setting: false,
    extra: 'value'
  },
  other: false
};`,
      replacements: 1,
    },
  },
  {
    name: "replace code block with limit",
    input: [
`// TODO: fix this
function broken() {
  // TODO: fix this
  return null;
}
// TODO: fix this`,
      "// TODO: fix this",
      "// FIXED",
      2,
    ],
    expected: {
      result: 
`// FIXED
function broken() {
  // FIXED
  return null;
}
// TODO: fix this`,
      replacements: 2,
    },
  },
  {
    name: "no matches in multiline",
    input: [
`Line 1
Line 2
Line 3`,
      "Line 4",
      "Line X",
    ],
    expected: {
      result: 
`Line 1
Line 2
Line 3`,
      replacements: 0,
    },
  },
  {
    name: "empty old text",
    input: ["hello world", "", "xyz"],
    throws: "old_text cannot be empty",
  },
  {
    name: "overlapping replacements",
    input: ["aaaa", "aa", "b"],
    expected: {
      result: "bb",
      replacements: 2,
    },
  },
  {
    name: "replace with empty string",
    input: ["foo bar foo", "foo ", ""],
    expected: {
      result: "bar foo",
      replacements: 1,
    },
  },
  {
    name: "windows line endings",
    input: ["line1\r\nline2\r\nline3", "\r\n", "\n"],
    expected: {
      result: "line1\nline2\nline3",
      replacements: 2,
    },
  },
  {
    name: "indent-sensitive replacement",
    input: [
`class OldClass:
    def method(self):
        pass`,
      "OldClass",
      "NewClass",
    ],
    expected: {
      result: 
`class NewClass:
    def method(self):
        pass`,
      replacements: 1,
    },
  },
];
