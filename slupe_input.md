I see you already have the file content. Let me fix the missing `console.timeEnd('before-hooks')` for the success case:

```sh nesl
#!nesl [@three-char-SHA-256: k8r]
action = "file_replace_text"
path = "/Users/stuart/repos/slupe/proj/comp/orch/src/index.ts"
old_text = <<'EOT_k8r'
              fatalError: 'Before hooks failed - aborting execution'
            };
          }
        } catch (error) {
EOT_k8r
new_text = <<'EOT_k8r'
              fatalError: 'Before hooks failed - aborting execution'
            };
          }
          console.timeEnd('before-hooks');
        } catch (error) {
EOT_k8r
#!end_k8r
```

Now run it again to see if the hooks are the source of the slowness. Based on the ~930ms unaccounted time, I strongly suspect the hooks are doing something expensive like:
- Running git commands
- File system operations
- Shell commands
- Network operations

The timing should reveal whether it's the before hooks or after hooks (or both) that are slow.