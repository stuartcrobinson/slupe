
Issues revealed by execute.md test design:

Missing gitCommit field in expected results
Context operations not tested - are they NESL actions?
Git state check not tested - what if dirty repo?
Directory creation for file operations unclear


---


https://claude.ai/chat/f2f318e7-0f4c-4a5a-b9ee-35c8c7a83a06
Next step: Add executor: fs-ops to all file/dir operations in the YAML when convenient. The system will work without it due to the inference fallback.

---

add malformed sha id error to nesl-js  so it reeturns a good error for:


```sh nesl
#!nesl [@nesl-id: 567]
action = "file_replace_text"
path = "/tmp/replace-test.txt"
old_text = "Hello"
new_text = "Hi"
#!end_567
```

(should be )


```sh nesl
#!nesl [@three-char-SHA-256: 567]
action = "file_replace_text"
path = "/tmp/replace-test.txt"
old_text = "Hello"
new_text = "Hi"
#!end_567
```