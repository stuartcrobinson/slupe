# NESL Tool API Reference

## Syntax
```sh
#!nesl [@three-char-SHA-256: q8r]
action = "tool_name"
param1 = <<'EOT_q8r'
value line 1
value line 2
EOT_q8r
param2 = "value"
#!end_q8r
```

Constraints:
- Block ID must be exactly 3 characters
- Always use heredocs (`<<'EOT_[id]'...EOT_[id]`) for file contents
- All paths must be absolute

## Tools

### `write_file`
Write content to file (creates or overwrites)  
- `path`
- `content`

### `replace_text_in_file`
Replace exactly one text occurrence  
- `path`
- `old_text`
- `new_text` 

### `replace_lines_in_file`
Replace the given line(s) with the supplied `new_content` string
- `path`
- `lines` eg "3" or a range like "2-13"
- `new_content` 

### `read_file`
Read file contents  
- `path` 

### `read_file_numbered`
Read file with line numbers  
- `path`

### `read_files`
Read multiple files  
- `paths`

### `exec`
Execute shell commands  
- `lang`
- `code`

---


```
=== START FILE: [numbered] /Users/stuart/repos/slupe/use-listener/test-files/ham.md ===
 1: 
 2: The Tragedy of Hamlet, Prince of Denmark
 3: Shakespeare homepage | Hamlet | Entire play
 4: ACT I
 5: SCENE I. Elsinore. A platform before the castle.
 6: FRANCISCO at his post. Enter to him BERNARDO
 7: BERNARDO
 8: Who's there?
 9: FRANCISCO
10: Nay, answer me: stand, and unfold yourself.
11: BERNARDO
12: Long live the king!
13: FRANCISCO
14: Bernardo?
15: BERNARDO
16: He.
17: FRANCISCO
18: You come most carefully upon your hour.
19: BERNARDO
20: 'Tis now struck twelve; get thee to bed, Francisco.
21: FRANCISCO
22: For this relief much thanks: 'tis bitter cold,
23: And I am sick at heart.
24: BERNARDO
25: Have you had quiet guard?
26: FRANCISCO
27: Not a mouse stirring.
28: BERNARDO
29: Well, good night.
30: If you do meet Horatio and Marcellus,
31: The rivals of my watch, bid them make haste.
32: FRANCISCO
33: I think I hear them. Stand, ho! Who's there?
34: Enter HORATIO and MARCELLUS
35: 
36: HORATIO
37: Friends to this ground.
38: MARCELLUS
39: And liegemen to the Dane.
40: FRANCISCO
41: Give you good night.
42: MARCELLUS
43: O, farewell, honest soldier:
44: Who hath relieved you?
45: FRANCISCO
46: Bernardo has my place.
47: Give you good night.
48: Exit
=== END FILE: [numbered] /Users/stuart/repos/slupe/use-listener/test-files/ham.md ===
```

use a nesl tool to replace all the questions in the ham.md file above with a few more lines of dialog expanding on the question a little