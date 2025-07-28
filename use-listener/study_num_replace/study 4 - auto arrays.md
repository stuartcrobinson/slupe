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
array1 = "arValue0"
array1 = "arValue1"
array1 = <<'EOT_q8r'
arValue2 line 1
arValue2 line 2
EOT_q8r
array1 = "arValue2"
#!end_q8r


#!nesl [@three-char-SHA-256: q8r]
action = "file_replace_text"
path = "/path/to/file.txt"

old_text = "Who hath relieved you?"
new_text = <<'EOT_h4m'
Who hath relieved you?
Which loyal soldier takes your weary place
EOT_h4m

old_text = <<'EOT_h4m'
one two three
four five
EOT_h4m
new_text = "lalala"
#!end_q8r
```

Constraints:
- Block ID must be exactly 3 characters
- Always use heredocs (`<<'EOT_[id]'...EOT_[id]`) for file contents
- All paths must be absolute

## Tools

### `file_write`
Write content to file (creates or overwrites)  
- `path`
- `content`

### `file_replace_text`
Replace exactly one text occurrence  
- `path`
- `old_text`
- `new_text` 

### `file_replace_lines`
Replace the given line(s) with the supplied `new_content` string
- `path`
- `lines` eg "3" or a range like "2-13"
- `new_content` 

### `file_read`
Read file contents  
- `path` 

### `file_read_numbered`
Read file with line numbers  
- `path`

### `files_read`
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

use a nesl tool to replace all the questions in the ham.md file above with a few more lines of dialog expanding on the question a little.  feel free to use arrays in a single nesl block