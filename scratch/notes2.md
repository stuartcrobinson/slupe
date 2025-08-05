

TODO:

- indicate in the unified yaml whether tools are implemented yet or not.  so if not they should be totally ignored from everything. 



ok all things are supposedly finished for release!!!!

so what next...


X review the allowed/exisitng tools/actions
    X clean up fs-ops action handlers
    x rename them to actions? -- mostly done? good enough?
    X drop dumb stuff like 'dir_create'
        X lets thoroughly clean up the unified-design thing.  maybe rip out all the future stuff.  that should go in ... somethign else.
    X NO indicate in the unified yaml whether they're implemented yet or not.  so if not they should be totally ignored from everything. 
        dont do this.  totally pointeless
X exec just isn't working.  need to hardcode that its no supported        
    yes it is.  ... well error formatting is broken...
X fix exec error output
X listener human entry point
X cmd line option for auto copy/paste stuff
X paste file contents in output for failed file edit action
X new feature - listen for LLM output copy?  
    X yes!!!!  be watching the clipboard for when
        X contains nesl AND THEN
            x clipbaord changes within 1 or 2 seconds such that it contains the same nesl markers and ids (note that we cant do an exact match cos formatting syntax might be different from copy button vs select and copy)
            x so u click the copy button, then do ctrl-a, ctrl-v -- to immediately just copy the whole page
            x and this is how sloop will know that the first thing u copied was real nesl syntax that u want to get executed.  
            x no - should we integrate mac notifications?  prob too hard. deal w settings etc
- publish nesl to npm 
- publish slupe to npm 
- look for response from npm support about getting my account back...             
- rename to slupe
- cleanup, just delete trash or embarrassing bits

WHAT TO DO WHILE WAITING FOR NPM ACCESS?



- update all 'path' vars to support wildcard/glob expansion.  
    - maybe have param for all such actions like "dont_support_path_wildcards" or soemthing.  just meniotn it once and then share reminder in error or warning message if there's a real file continaign a * or soemthing
- file_replace_text_range
- file_read_node
- file_overwrite_node
- file_replace_in_node
- file_delete_node_
- file_insert_node_after
- and then something to do like sed using file pattern and regex?
- sd
- rg

- PUBLISH TO HACKER NEWS

v2: add some more tools, like:

- file_replace_in_node
- file_overwrite_node
- file_delete_node

-----

slupe-cli 


FIVE things i want to finish before release 


X LLM instructions generator (based on tools allowlist)

X hooks for custom git etc before and after executions

X fs permissions - read/write allowlist/denylist
X tools allowlist (to block cmd line stuff for file security)


- npx run usage
- settings file slupe.yaml - hooks, fs permissions 

LATER:


- secretly allow synonyms for tools (like file_create == file_write cos llm really wants to use file_create)
    - new feature maybe... synonyms.. (create_file write_file ???? idk if overkill)
    - .  file_create and file_copy  -
- search/replace by range file_replace_text_range
- copy paste mode 
    - include clipboard watcher to automatically execute outputs that have been copied and then if user copies "nesl" 
- git squash stuff
    
----


? slupe init -- create the slupe.yaml file with file permissions based on cwd
    i think this has been done already by claude? 


-----

TODO:

- allow case insensitive tool action names.  too hard to read evyerthing now in LLM raw output

- the error message should also show the intended file path
```
e5f ✅ file_write /Users/stuart/repos/slupe/proj/comp/hooks/src/interpolateCommand.ts
a1b ❌ FILE_WRITE ERROR: Unknown action: FILE_WRITE (line 25)

...

#!nesl [@three-char-SHA-256: a1b]
action = "FILE_WRITE"
path = "/Users/stuart/repos/slupe/proj/comp/hooks/src/formatHookResult.ts"
content = <<'EOT_a1b'
import type { CommandResult, HookResult } from './types.js';
```

---

- tell the LLM about how to read the pasted files snapshot.  it tries to find the specific file then gets confused. waste of time/tokens
```
Let me first check what's currently in the index.ts file and then implement the HooksManager:Analyzed dataView analysisjavascript// Check current index.ts
const indexContent = await window.fs.readFile('/Users/stuart/repos/slupe/proj/comp/hooks/src/index.ts', { encoding: 'utf8' });
console.log("Current index.ts:");
console.log(indexContent);
OutputResult

ErrorError

File not found: No file named "/Users/stuart/repos/slupe/proj/comp/hooks/src/index.ts"Let me check the paste content for the index.ts file. I can see it has the skeleton but no implementation.
```

- the /Users/stuart/repos/slupe/use-listener/test-listener-live.ts script is VERY SLOW TO USE!!! SLOW AT SAVING FILES!!! wtf why??? and i want it to prepend results to the input file AS EACH ITEM SUCCEEDS.  dont wait for the whole thing. and our debug needs more outputs for exec stuff.  show the whole stdout etc

---

claude is really bad at using numbered file reads.  it keeps requesting line ranges for numbered file reads that are totally stupid and terrible.  but then it never actually uses the replace by lines number function anyway.  it thinks about stuff per section.  need to give it that capability in search/repalce

---

future: no fs at all 

the whole point of nice little files is for humans.  w LLM it would be better if entire codebase was in one single file.  and an outline (that visually looked like a fs) was autogenerated based on parsed content.  

all the imports and dependency file locationn and formats is a big source of wasted time and mistakes and cognition.  save a lot of tokens and attention to have everythign in one file.  and the LLM just requests/edits specific nodes/classes/functions.  like... i just spent a lot of time doing a refactor to break all the code for tools/actions into their own files.  cos it feels nicer to me.  but v wasteful now in terms of all the imports that an LLM will have to wade through

---
