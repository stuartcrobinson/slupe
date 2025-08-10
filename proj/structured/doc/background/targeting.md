read the test cases and the docs.  make sense?  

 a structural char (`{};()[]/\ `)

check this out:



# ok so lets match in this order:


# NORM_WHITE & (then) REMOVE_TRAILING_BRACKET_OR_COLON
#   SKIP_PARENTS
# REMOVE_STRUCT
#   SKIP_PARENTS
# STARTS_WITH
#   SKIP_PARENTS



so first we want to normalize everythgin by whitespace (remove all whitespace per line spaces and tabs) and then remove the last char if its a { or : 

tehn if we do get any matches we're done, return them.  else, we allow the target pattern to skip parents.  so the target parent hierarchy could be like 


```
gradnparent
chidl
```

and we would allow that to pass. 

then if still nothign, we go back to NOT allowing skipping parents but instead we normalize everything by removing ALL structural chars.

if match? great. else, then allow skipping parents.  and check if matches then.

still nothing?  then isntead of tryhign to match our targets exactly per lines of code, we just check if a line of code STARTS WITH the target string (including all the normalization we've done up to now.)  and check for matches.

still nothing? we then add in allowing skipping parnets.  if still nothign? then we acept that there are no matches, and stop.

---

wdyt?  so then that should allow all our test cases to pass.  that little algorithm:


```

# NORM_WHITE & (then) REMOVE_TRAILING_BRACKET_OR_COLON
#   SKIP_PARENTS
# REMOVE_STRUCT
#   SKIP_PARENTS
# STARTS_WITH
#   SKIP_PARENTS


```


note: else and elif should always be considered chidren of the if case

note: the attached docs mention something abot "first 50 chars" thats old and wrong. ignore it

How do you handle multi-line declarations? Match only first line?
-- yes only the first line
