
so ultimately the point of all this is to allow an LLM to edit a specific block of text.  don'est matter if ew find it cos its a literal AST strucutre.  like if we get a string match, like for this:


```yaml
- name: chained_method_calls
  content: |2
    class Builder {
      build() {
        return this
          .step1()
          .step2();
      }
    }
  target: |
    Builder
    build
    .step1()
  expected: |
    .step1()
```


we need to be able to confirm that the string match for .step1 is indeed in the Builder > build path.  if not, we dotn care about it. 


---

For .step1() Example

Find all occurrences of .step1() via text search
For each match, verify it's within build method of Builder class
Return only matches with correct ancestry


appraoch?

Either:

- Pure AST approach: Only target actual AST nodes, use tree-sitter node types
- Hybrid approach: Text search with AST-based scope validation (what you seem to want)

The hybrid approach matches your test cases but requires careful definition of what constitutes a "parent" for non-AST-node targets.  yes. hybrid approach