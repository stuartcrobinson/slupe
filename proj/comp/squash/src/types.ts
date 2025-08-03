export interface SquashOptions {
  containing: string[];
  limit?: number;
  after?: string;
  message?: string;
  push?: boolean;
  force?: boolean;
  dryRun?: boolean;
}

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}

export interface SquashResult {
  squashedCount: number;
  newCommitHash?: string;
  files: string[];
}