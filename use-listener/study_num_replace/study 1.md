```

```sh nesl
#!nesl [@three-char-SHA-256: rr1]
action = "write_file"
path = "/tmp/t_replace-line-range/code.js"
content = <<'EOT_rr1'
function oldImplementation() {
  console.log('line 2');
  console.log('line 3');
  console.log('line 4');
  return 'old';
}
EOT_rr1
#!end_rr1
```

```sh nesl
#!nesl [@three-char-SHA-256: rr2]
action = "replace_lines_in_file"
path = "/tmp/t_replace-line-range/code.js"
lines = "2-5"
new_content = <<'EOT_rr2'
  // New implementation
  return 'new';
EOT_rr2
#!end_rr2
```


/tmp/t_replace-line-range/code.js content:
```
function oldImplementation() {
  // New implementation
  return 'new';
}
```
```

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

generate nesl action code to replace all the questions in the ham.md file above with a few more lines of dialog expanding on the question a little