stuart@Stuarts-MacBook-Pro ~/r/c/s/c/errors (main)> npx ts-node file-spike.ts

(node:23139) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
stuart@Stuarts-MacBook-Pro ~/r/c/s/c/errors (main)> npx tsc file-spike.ts
                                                    node file-spike.js

```sh
--- TOP OF FILE ---
=== Node.js File Operation Error Spike ===

Script started!
Main is running

--- Simple write to /tmp ---
SUCCESS: Wrote /tmp/test-check.txt

--- Delete non-existent file ---
ERROR CODE: ENOENT
ERROR MESSAGE: ENOENT: no such file or directory, unlink '/tmp/spike-test/does-not-exist.txt'
ERROR SYSCALL: unlink
ERROR PATH: /tmp/spike-test/does-not-exist.txt
ERROR DEST: undefined
FULL ERROR: Error: ENOENT: no such file or directory, unlink '/tmp/spike-test/does-not-exist.txt'
    at async unlink (node:internal/fs/promises:1060:10) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'unlink',
  path: '/tmp/spike-test/does-not-exist.txt'
}

--- Delete from /root/ ---
ERROR CODE: ENOENT
ERROR MESSAGE: ENOENT: no such file or directory, unlink '/root/test.txt'
ERROR SYSCALL: unlink
ERROR PATH: /root/test.txt
ERROR DEST: undefined
FULL ERROR: Error: ENOENT: no such file or directory, unlink '/root/test.txt'
    at async unlink (node:internal/fs/promises:1060:10) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'unlink',
  path: '/root/test.txt'
}

--- Move non-existent file ---
ERROR CODE: ENOENT
ERROR MESSAGE: ENOENT: no such file or directory, rename '/tmp/spike-test/ghost.txt' -> '/tmp/spike-test/moved.txt'
ERROR SYSCALL: rename
ERROR PATH: /tmp/spike-test/ghost.txt
ERROR DEST: /tmp/spike-test/moved.txt
FULL ERROR: Error: ENOENT: no such file or directory, rename '/tmp/spike-test/ghost.txt' -> '/tmp/spike-test/moved.txt'
    at async rename (node:internal/fs/promises:779:10) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'rename',
  path: '/tmp/spike-test/ghost.txt',
  dest: '/tmp/spike-test/moved.txt'
}

--- Move to non-existent directory ---
ERROR CODE: ENOENT
ERROR MESSAGE: ENOENT: no such file or directory, rename '/tmp/spike-test/source.txt' -> '/tmp/spike-test/subdir/dest.txt'
ERROR SYSCALL: rename
ERROR PATH: /tmp/spike-test/source.txt
ERROR DEST: /tmp/spike-test/subdir/dest.txt
FULL ERROR: Error: ENOENT: no such file or directory, rename '/tmp/spike-test/source.txt' -> '/tmp/spike-test/subdir/dest.txt'
    at async rename (node:internal/fs/promises:779:10) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'rename',
  path: '/tmp/spike-test/source.txt',
  dest: '/tmp/spike-test/subdir/dest.txt'
}

--- Move from /root/ ---
ERROR CODE: ENOENT
ERROR MESSAGE: ENOENT: no such file or directory, rename '/root/source.txt' -> '/tmp/spike-test/dest.txt'
ERROR SYSCALL: rename
ERROR PATH: /root/source.txt
ERROR DEST: /tmp/spike-test/dest.txt
FULL ERROR: Error: ENOENT: no such file or directory, rename '/root/source.txt' -> '/tmp/spike-test/dest.txt'
    at async rename (node:internal/fs/promises:779:10) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'rename',
  path: '/root/source.txt',
  dest: '/tmp/spike-test/dest.txt'
}

--- Move to /root/ ---
ERROR CODE: ENOENT
ERROR MESSAGE: ENOENT: no such file or directory, rename '/tmp/spike-test/moveable.txt' -> '/root/dest.txt'
ERROR SYSCALL: rename
ERROR PATH: /tmp/spike-test/moveable.txt
ERROR DEST: /root/dest.txt
FULL ERROR: Error: ENOENT: no such file or directory, rename '/tmp/spike-test/moveable.txt' -> '/root/dest.txt'
    at async rename (node:internal/fs/promises:779:10) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'rename',
  path: '/tmp/spike-test/moveable.txt',
  dest: '/root/dest.txt'
}

--- Write to /root/ ---
ERROR CODE: ENOENT
ERROR MESSAGE: ENOENT: no such file or directory, open '/root/test.txt'
ERROR SYSCALL: open
ERROR PATH: /root/test.txt
ERROR DEST: undefined
FULL ERROR: Error: ENOENT: no such file or directory, open '/root/test.txt'
    at async open (node:internal/fs/promises:634:25)
    at async writeFile (node:internal/fs/promises:1208:14) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/root/test.txt'
}

--- Create directory in /root/ ---
ERROR CODE: ENOENT
ERROR MESSAGE: ENOENT: no such file or directory, mkdir '/root/testdir'
ERROR SYSCALL: mkdir
ERROR PATH: /root/testdir
ERROR DEST: undefined
FULL ERROR: Error: ENOENT: no such file or directory, mkdir '/root/testdir'
    at async mkdir (node:internal/fs/promises:853:10) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'mkdir',
  path: '/root/testdir'
}

--- Move overwriting existing file ---
SUCCESS: Overwrite successful. Content: "source"
stuart@Stuarts-MacBook-Pro ~/r/c/s/c/errors (main)> 
```