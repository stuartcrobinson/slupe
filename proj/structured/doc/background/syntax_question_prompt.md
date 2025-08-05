# Control Flow Targeting for LLM-Based Code Editing

## Problem Statement

We're building tree-sitter-based structure operations for LLMs to edit code. Named structures (functions, classes) have obvious targeting syntax: `UserAuth.validate`. But control flow structures (if/for/while) lack stable identities.

## Core Challenges

1. **No natural names**: Loops and conditionals are identified by position or content, not names
2. **Frequent duplication**: Multiple identical conditions common in same scope
3. **Nesting ambiguity**: "Which `if` block?" when several exist at different depths
4. **Syntax collision**: Most separators (`->`, `::`, `.`) already have language-specific meanings

## Candidate Syntaxes

### A. Dot notation with quoted conditions
```
UserAuth.validate."for item in items"."if item.valid"
```

### B. Arrow separators
```
UserAuth.validate -> for item in items -> if item.valid
```

### C. Mixed separators by type
```
UserAuth.validate > for(item in items) > if(item.valid)
```

### D. Positional indexing
```
UserAuth.validate.for[0].if[0]
UserAuth.validate.for#1.if#1
```

### E. Type + occurrence
```
UserAuth.validate.for-loop-1.if-statement-1
UserAuth.validate::for[1]::if[1]
```

### F. Content matching with parens
```
UserAuth.validate.for(item in items).if(item.valid)
```

### G. Slash paths
```
UserAuth/validate/for item in items/if item.valid
```

### H. Bracketed conditions
```
UserAuth.validate.[for item in items].[if item.valid]
```

### I. Type labels
```
UserAuth.validate:for:if
UserAuth.validate::loop::condition
```

### J. Line number fallback
```
UserAuth.validate:45
UserAuth.validate:45-67
```

### K. Prohibit control flow targeting
```
# Only allow named structures
UserAuth.validate  # OK
for item in items  # ERROR: Extract to named function first
```

## Evaluation Criteria

1. **Natural for LLMs**: What would you instinctively write?
2. **Unambiguous parsing**: No collision with language syntax
3. **Handles duplicates**: Strategy for multiple identical conditions
4. **Consistent**: Same pattern across languages (Python, JS, TS, etc.)
5. **Readable**: Clear intent from syntax alone

## Test Cases

Any solution must handle:

```python
class UserAuth:
    def validate(self, items):
        for item in items:  # Target: "first for loop"
            if item.valid:  # Target: "if inside first for"
                for item in items:  # Target: "nested for"
                    if item.valid:  # Target: "if inside nested for"
                        process(item)
        
        for item in items:  # Target: "second for loop"
            if item.expired:  # Target: "different condition"
                delete(item)
```

## Questions for LLM Reviewers

1. Which syntax would you naturally write without documentation?
2. Which feels most wrong/unnatural?
3. Would you prefer explicit indices (`for#2`) or content matching (`for item in items`)?
4. Is prohibition (option K) acceptable if you could extract code to named functions?
5. What syntax do you use in your internal reasoning when thinking about code locations?