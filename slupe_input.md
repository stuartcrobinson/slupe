You're right, let's make all clipboard writes properly synchronous by polling for verification after each write. Here's the update to ensure every clipboard write is verified through polling:

```sh nesl
#!nesl [@three-char-SHA-256: n2k]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_n2k'
          await clipboard.write(input.content);
          
          // Verify the write
          const written = await clipboard.read();
          console.log(`  Verified write - length: ${written.length}, matches: ${written === input.content}`);
EOT_n2k
new_text = <<'EOT_n2k'
          await clipboard.write(input.content);
          
          // Poll to verify the write
          let writeVerified = false;
          for (let i = 0; i < 50; i++) { // max 500ms
            const written = await clipboard.read();
            if (written === input.content) {
              writeVerified = true;
              console.log(`  Verified write after ${i * 10}ms - length: ${written.length}`);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          if (!writeVerified) {
            throw new Error(`Failed to verify clipboard write for input ${idx + 1}`);
          }
EOT_n2k
#!end_n2k
```

And let's also add the same polling verification when writing the unique content at the end of each test:

```sh nesl
#!nesl [@three-char-SHA-256: r5m]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_r5m'
        // Rewrite unique content before stopping monitor
        if (handle) {
          console.log(`[TEST ${testCase.name}] Rewriting unique content before cleanup:`, uniqueContent);
          await clipboard.write(uniqueContent);
EOT_r5m
new_text = <<'EOT_r5m'
        // Rewrite unique content before stopping monitor
        if (handle) {
          console.log(`[TEST ${testCase.name}] Rewriting unique content before cleanup:`, uniqueContent);
          await clipboard.write(uniqueContent);
          
          // Poll to verify cleanup write
          let cleanupVerified = false;
          for (let i = 0; i < 50; i++) { // max 500ms
            const current = await clipboard.read();
            if (current === uniqueContent) {
              cleanupVerified = true;
              console.log(`[TEST ${testCase.name}] Cleanup write verified after ${i * 10}ms`);
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          if (!cleanupVerified) {
            console.log(`[TEST ${testCase.name}] Warning: Failed to verify cleanup clipboard write`);
          }
EOT_r5m
#!end_r5m
```

This should make all clipboard operations properly synchronous and eliminate any race conditions between tests.