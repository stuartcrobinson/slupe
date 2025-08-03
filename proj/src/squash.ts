#!/usr/bin/env node
import { squash } from '../comp/squash/src/index.js';

squash().catch(console.error);