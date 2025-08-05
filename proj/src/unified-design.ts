
// NESL SYNTAX EXAMPLE
// ```sh nesl
// #!nesl [@three-char-SHA-256: k7m]
// action = "write_file"
// path = "/tmp/\\"hello\\".txt"
// content = <<'EOT_k7m'
// Hello world!
// how are you?
// EOT_k7m
// #!end_k7m
// ```

export const ActionDefinitions = {
  write_file: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Create new file while creating any necessary parent dirs. overwrites if already exists',
    accessibility: ['llm'] as const,
    output_display: 'never' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' },
      content: { type: 'string', required: true }
    },
    returns: { success: 'boolean', error: 'string?' }
  },

  replace_text_in_file: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Replace first and only instance of substring in file. must exist only once',
    accessibility: ['llm'] as const,
    output_display: 'never' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' },
      old_text: { type: 'string', required: true },
      new_text: { type: 'string', required: true }
    },
    returns: { success: 'boolean', replacements_made: 'integer?', error: 'string?' }
  },

  replace_all_text_in_file: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Replace each matching substring in file. Number of matches (count) should usually be known and declared ahead of time.',
    accessibility: ['llm'] as const,
    output_display: 'never' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' },
      old_text: { type: 'string', required: true },
      new_text: { type: 'string', required: true },
      count: { type: 'integer', required: false }
    },
    returns: { success: 'boolean', replacements_made: 'integer?', error: 'string?' }
  },

  delete_file: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Delete file',
    accessibility: ['llm'] as const,
    output_display: 'never' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' }
    },
    returns: { success: 'boolean', error: 'string?' }
  },

  read_file: {
    type: 'read' as const,
    executor: 'fs-ops' as const,
    description: 'Read single file content',
    accessibility: ['llm'] as const,
    output_display: 'always' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' }
    },
    returns: { success: 'boolean', content: 'string?', error: 'string?' }
  },

  // TODO - this sucks, LLMs abuse it. should delete
  read_file_numbered: {
    type: 'read' as const,
    executor: 'fs-ops' as const,
    description: 'Read file content with line numbers for specified line range',
    accessibility: ['llm'] as const,
    output_display: 'always' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' },
      lines: { type: 'string', required: false, description: "Line range: single '4' or range '23-43'. If omitted, reads all lines." },
      delimiter: { type: 'string', required: false, default: ': ', description: 'Delimiter between line number and content' }
    },
    returns: { success: 'boolean', content: 'string?', error: 'string?' }
  },

  // TODO - this sucks, LLMs abuse it. should delete
  replace_lines_in_file: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Replace specified line range in file with new content',
    accessibility: ['llm'] as const,
    output_display: 'never' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' },
      lines: { type: 'string', required: true, description: "Line range: single '4' or range '23-43'" },
      new_content: { type: 'string', required: true, description: 'Content to replace the line range with' }
    },
    returns: { success: 'boolean', lines_replaced: 'integer?', error: 'string?' }
  },

  replace_text_range_in_file: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Replace text range from start marker to end marker (inclusive). Both markers must appear exactly once, with end after start.',
    accessibility: ['llm'] as const,
    output_display: 'never' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' },
      old_text_beginning: { type: 'string', required: true },
      old_text_end: { type: 'string', required: true },
      new_text: { type: 'string', required: true }
    },
    returns: { success: 'boolean', replacements: 'integer?', error: 'string?' }
  },

  read_files: {
    type: 'read' as const,
    executor: 'fs-ops' as const,
    description: 'Read and concatenate contents of multiple files into a single string, with clear file delimiters',
    accessibility: ['llm'] as const,
    output_display: 'always' as const,
    primary_param: 'paths' as const,
    parameters: {
      paths: {
        type: 'string',
        required: true,
        format: 'multiline_absolute_paths',
        description: 'One absolute file path per line. Empty lines are ignored.'
      }
    },
    returns: {
      success: 'boolean',
      data: {
        paths: 'array',
        content: 'array'
      },
      error: 'string?'
    },
  },


  move_file: {
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

  append_to_file: {
    type: 'write' as const,
    executor: 'fs-ops' as const,
    description: 'Append content to existing file. Creates file if it does not exist.',
    accessibility: ['llm'] as const,
    output_display: 'never' as const,
    primary_param: 'path' as const,
    parameters: {
      path: { type: 'string', required: true, format: 'absolute_path' },
      content: { type: 'string', required: true }
    },
    returns: { success: 'boolean', error: 'string?' }
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

} as const;
