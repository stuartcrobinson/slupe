#!nesl [@three-char-SHA-256: f2p]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/listener/test/unit/clipboard.test.ts"
old_text = <<'EOT_f2p'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 100
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        for (const input of testCase.inputs) {
          await clipboard.write(input.content);
          if (input.delay) {
            await new Promise(resolve => setTimeout(resolve, input.delay));
          }
        }
EOT_f2p
new_text = <<'EOT_f2p'
        handle = await startListener({
          filePath: inputFile,
          useClipboard: true,
          debounceMs: 100
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Write unique content to ensure clipboard monitor detects changes
        await clipboard.write(`init-${testCase.name}-${Date.now()}`);
        await new Promise(resolve => setTimeout(resolve, 30));
        
        for (const input of testCase.inputs) {
          await clipboard.write(input.content);
          if (input.delay) {
            await new Promise(resolve => setTimeout(resolve, input.delay));
          }
        }
EOT_f2p
#!end_f2p