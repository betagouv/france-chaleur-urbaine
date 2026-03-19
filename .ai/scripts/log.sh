#!/bin/bash
# Append timestamped entries to agent.log
# Usage: .ai/scripts/log.sh "Read src/foo.ts" "Edit src/bar.ts" "Bash pnpm ts"
for entry in "$@"; do
  [[ -n "$entry" ]] && echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): $entry"
done >> "$(dirname "$0")/../agent.log"
