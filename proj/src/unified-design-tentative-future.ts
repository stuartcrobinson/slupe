
export const NESL_SYNTAX_EXAMPLE = `\`\`\`sh nesl
#!nesl [@three-char-SHA-256: k7m]
action = "file_write"
path = "/tmp/\\"hello\\".txt"
content = <<'EOT_k7m'
Hello world!
how are you?
EOT_k7m
#!end_k7m
\`\`\``;

export const ActionDefinitions = {
  // TODO
  file_replace_text_range: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Replace first and only instance of text range in file. must exist only once',
    accessibility: ['llm'] as const,
    output_display: 'never' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' },
      old_text_beginning: { type: 'string', required: true },
      old_text_end: { type: 'string', required: true },
      new_text: { type: 'string', required: true }
    },
    returns: { success: 'boolean', replacements_made: 'integer?', error: 'string?' }
  },
  

  // TODO
  files_replace_all_text: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Replace all occurrences of substring in multiple files. Processes each file independently',
    accessibility: ['llm'] as const,
    parameters: {
      paths: { type: 'string', format: 'multiline_absolute_paths' },
      old_text: { type: 'string', required: true },
      new_text: { type: 'string', required: true }
    },
    returns: {
      success: 'boolean',
      results: {
        type: 'array',
        items: {
          path: 'string',
          replacements_made: 'integer',
          error: 'string?'
        }
      },
      error: 'string?'
    }
  },

  // TODO
  // rename
  files_replace_text_in_parents: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Replace all occurrences of substring in a given node of a parsed file that supports grouping, like markdown, code (ast), etc',
    accessibility: ['llm'] as const,
    parameters: {
      path: { type: 'string', required: true },
      parents: { type: 'string', required: true, format: 'multiline_absolute_paths' },
      old_text: { type: 'string', required: true },
      new_text: { type: 'string', required: true }
    },
    returns: { success: 'boolean', error: 'string?' }
  },

  // TODO
  file_append: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Append to file',
    accessibility: ['llm'] as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' },
      content: { type: 'string', required: true }
    },
    returns: { success: 'boolean', error: 'string?' }
  },
  
  
  file_move: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Move/rename file',
    accessibility: ['llm'] as const,
    output_display: 'never' as const,
    primary_param: 'old_path' as const,
    parameters: {
      old_path: { type: 'string', required: true, format: 'absolute_path' },
      new_path: { type: 'string', required: true, format: 'absolute_path' }
    },
    returns: { success: 'boolean', error: 'string?' }
  },

  ls: {
    type: 'read' as const,
    executor: 'fs-ops' as const,
    description: 'List directory contents',
    accessibility: ['llm'] as const,
    output_display: 'always' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' }
    },
    returns: {
      success: 'boolean',
      data: {
        type: 'array',
        items: {
          name: 'string',
          type: 'string',
          size: 'integer',
          modified: 'timestamp'
        }
      },
      error: 'string'
    }
  },
  
  ripgrep: {
    type: 'read' as const,
    description: 'Search pattern in files',
    accessibility: ['llm'] as const,
    output_display: 'always' as const,
    primary_param: 'pattern' as const,
    parameters: {
      pattern: { type: 'string', required: true },
      path: { type: 'string', required: true, format: 'absolute_path' },
      include: { type: 'string', required: false }
    },
    returns: {
      success: 'boolean',
      data: {
        type: 'array',
        items: {
          file: 'string',
          line_number: 'integer',
          line: 'string'
        }
      },
      error: 'string'
    }
  },
  
  glob: {
    type: 'read' as const,
    description: 'Find files matching pattern',
    accessibility: ['llm'] as const,
    output_display: 'always' as const,
    primary_param: 'pattern' as const,
    parameters: {
      pattern: { type: 'string', required: true },
      base_path: { type: 'string', required: true, format: 'absolute_path' }
    },
    returns: {
      success: 'boolean',
      data: {
        type: 'array',
        items: 'string'
      },
      error: 'string'
    }
  },
  
  exec: {
    type: 'dynamic' as const,
    description: 'Execute code',
    accessibility: ['llm'] as const,
    output_display: 'conditional' as const,
    primary_param: 'lang' as const,
    parameters: {
      code: { type: 'string', required: true },
      lang: { type: 'enum', values: ['python', 'javascript', 'bash'], required: true },
      version: { type: 'string', required: false },
      cwd: { type: 'string', required: false, format: 'absolute_path' },
      return_output: { type: 'boolean', required: false, default: true }
    },
    returns: { success: 'boolean', stdout: 'string?', stderr: 'string?', exit_code: 'integer?', error: 'string?' }
  },

  context_add: {
    type: 'meta' as const,
    description: 'Add item to working context (persistent)',
    accessibility: ['llm', 'user'] as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' }
    },
    returns: { success: 'boolean', error: 'string?' }
  },
  
  context_remove: {
    type: 'meta' as const,
    description: 'Remove item from working context',
    accessibility: ['llm', 'user'] as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' }
    },
    returns: { success: 'boolean', error: 'string?' }
  },
  
  context_list: {
    type: 'meta' as const,
    description: 'List items in working context',
    accessibility: ['llm', 'user'] as const,
    parameters: {},
    returns: {
      success: 'boolean',
      data: {
        type: 'array',
        items: {
          path: 'string',
          size: 'integer'
        }
      },
      error: 'string'
    }
  },
  
  context_prune: {
    type: 'meta' as const,
    description: 'Remove unused items from working context',
    accessibility: ['llm', 'user'] as const,
    parameters: {},
    returns: { success: 'boolean', removed: 'array of strings', error: 'string?' }
  },
  
  context_clear: {
    type: 'meta' as const,
    description: 'Clear all working context items',
    accessibility: ['llm', 'user'] as const,
    parameters: {},
    returns: { success: 'boolean', error: 'string?' }
  },
  
  git_squash: {
    type: 'git' as const,
    description: 'Squash commits',
    slash_command: true,
    parameters: {
      mode: { type: 'enum', values: ['auto_ai', 'ai_messages', 'hours', 'days', 'contiguous_only=true', 'msg_contains'], required: true },
      message: { type: 'string', required: false },
      hours: { type: 'integer', required: false, when: 'mode=hours' },
      days: { type: 'integer', required: false, when: 'mode=days' },
      msg_target: { type: 'string', required: false, when: 'mode=msg_contains' }
    },
    returns: { success: 'boolean', error: 'string?' }
  },
  
  undo: {
    type: 'git' as const,
    description: 'Undo last AI changes',
    accessibility: ['user'] as const,
    constraints: ['No changes since last AI operation'],
    parameters: {},
    returns: { success: 'boolean', error: 'string?' }
  },
  
  git_step_back: {
    type: 'git' as const,
    description: 'Move to previous commit',
    accessibility: ['user'] as const,
    behavior: 'Stashes untracked changes',
    parameters: {},
    returns: { success: 'boolean', stashed_files: 'array of strings', error: 'string?' }
  },
  
  git_step_forward: {
    type: 'git' as const,
    description: 'Move to next commit',
    accessibility: ['user'] as const,
    behavior: 'Attempts to pop stashed changes',
    parameters: {},
    returns: { success: 'boolean', conflicts: 'array of strings', error: 'string?' }
  }
} as const;

export const TransactionModel = {
  strategy: 'operation_group',
  conflict_detection: {
    methods: [
      'mtime comparison (fast but unreliable)',
      'checksum comparison (slower but accurate)',
      'git status check (catches git-tracked changes)'
    ],
    timing: [
      'Check immediately before operation group',
      'Check after each write operation',
      'Final check before commit'
    ]
  },
  implementation: [
    'Begin: git commit current state',
    'Execute: track all operations',
    'Validate: check for external modifications',
    'Success: git commit with summary',
    'Failure: git reset --hard to start'
  ],
  atomicity: 'none'
};

export const SecurityModel = {
  path_validation: {
    type: 'allowlist',
    allowed_roots: ['/home/user/projects', '/tmp/ai-coder'],
    blacklist_patterns: ['.*\\.ssh.*', '.*\\.git/config', '/etc/.*', '/sys/.*', '/proc/.*']
  },
  canonicalization: 'required'
};

export const SystemConfig = {
  encoding: 'utf-8',
  line_endings: 'preserve',
  max_file_size: 10485760,
  git_auto_push: false,
  commit_message_format: 'AI: {operation_summary}'
};

export type ActionName = keyof typeof ActionDefinitions;
export type ActionDef<T extends ActionName> = typeof ActionDefinitions[T];