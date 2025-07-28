
=== SLUPE RESULTS ===
v7x ✅ exec python
=== END ===



#!nesl [@three-char-SHA-256: v7x]
action = "exec"
lang = "python"
code = <<'EOT_v7x'
import sys

print("Python version:")
print(sys.version)
print("\nVersion info:")
print(sys.version_info)
EOT_v7x
#!end_v7x