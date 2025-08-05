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
=== START FILE: /Users/stuart/repos/slupe/use-listener/test-files/ham.md ===

The Tragedy of Hamlet, Prince of Denmark
Shakespeare homepage | Hamlet | Entire play
ACT I
SCENE I. Elsinore. A platform before the castle.
FRANCISCO at his post. Enter to him BERNARDO
BERNARDO
Who's there?
FRANCISCO
Nay, answer me: stand, and unfold yourself.
BERNARDO
Long live the king!
FRANCISCO
Bernardo?
BERNARDO
He.
FRANCISCO
You come most carefully upon your hour.
BERNARDO
'Tis now struck twelve; get thee to bed, Francisco.
FRANCISCO
For this relief much thanks: 'tis bitter cold,
And I am sick at heart.
BERNARDO
Have you had quiet guard?
FRANCISCO
Not a mouse stirring.
BERNARDO
Well, good night.
If you do meet Horatio and Marcellus,
The rivals of my watch, bid them make haste.
FRANCISCO
I think I hear them. Stand, ho! Who's there?
Enter HORATIO and MARCELLUS

HORATIO
Friends to this ground.
MARCELLUS
And liegemen to the Dane.
FRANCISCO
Give you good night.
MARCELLUS
O, farewell, honest soldier:
Who hath relieved you?
FRANCISCO
Bernardo has my place.
Give you good night.
Exit
=== END FILE: [numbered] /Users/stuart/repos/slupe/use-listener/test-files/ham.md ===
```

use a nesl tool to replace all the questions in the ham.md file above with a few more lines of dialog expanding on the question a little