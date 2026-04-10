#!/usr/bin/env node
/**
 * Context Monitor — PostToolUse hook
 *
 * Tracks tool call depth per session and warns when context may be getting heavy.
 * Warns at 50 calls and every 50 calls thereafter, suggesting /compact.
 *
 * State is stored in a temp file keyed by session ID so warnings are session-scoped.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Read tool input from stdin
let input = {};
try {
  const raw = fs.readFileSync(0, 'utf8'); // fd 0 = stdin, works on Windows
  input = JSON.parse(raw);
} catch {
  // If we can't parse input, exit silently — never block tool execution
  process.exit(0);
}

const sessionId = (input.session_id ?? 'default').replace(/[^a-zA-Z0-9_-]/g, '_');
const counterFile = path.join(os.tmpdir(), `aintern-ctx-${sessionId}.json`);

// Load existing state
let state = { count: 0 };
try {
  state = JSON.parse(fs.readFileSync(counterFile, 'utf8'));
} catch {
  // First call in this session
}

state.count++;

// Save updated state
try {
  fs.writeFileSync(counterFile, JSON.stringify(state));
} catch {
  // Ignore write errors — never block tool execution
}

// Warn at thresholds
const c = state.count;
if (c >= 50 && c % 50 === 0) {
  process.stderr.write(
    `[Context Monitor] ${c} tool calls in this session. ` +
    `If responses feel slow or incomplete, run /compact to reclaim context.\n`
  );
}

process.exit(0);
