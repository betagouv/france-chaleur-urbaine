---
description: Auto-fix: TypeScript, Prettier, and ESLint warnings and errors
---

Your objective is to remove all TypeScript and ESLint warnings and errors, and format all files.

## Workflow

1. **Run the following commands:**
   - `pnpm lint`: Auto-fix linter errors and collect remaining warnings/errors.
   - `pnpm ts`: Collect all TypeScript errors and warnings.

2. **Fix all errors:**
   - Use `Read` to read all files with problems.
   - Use `Edit` tools to update these files.
   - **Important:** Split errors by file (ignore folder paths). Each agent should handle a specific list of files (max 5 files per agent) to allow parallel processing.
   - Ensure each agent updates different files.

3. **Agent Descriptions:**
   - In each agent's description, include the list of all file names being fixed, e.g.:
```
     Auto-fix: file1.ts, file2.ts, file3.ts, etc...
```

4. **Agent Prompts:**
   - In each agent's prompt, list the errors per file, e.g.:
```
     file1.ts:
     - error ts 1
     - error lint 2
     - error ts 3

     file2.ts:
     - error ts 4
     - error lint 5
```

5. **Repeat:**
   - Rerun `pnpm lint` and `pnpm ts` to verify that no errors remain.

## Notes

- Be sure to format all files.
- Always include the list of file names in the agent description.
- Always list errors per file in the agent prompt.
