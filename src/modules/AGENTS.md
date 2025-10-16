# Modules

This folder aims at holding different modules based on specific purposes

All modules should be orginized the same way

1. Structure

- `server.ts` to export the main functionnality and important data to ease import from other server parts of the code
- `server/` folder to hold all server files
  - `api.ts` for legacy api endpoints
  - `api-admin.ts` for legacy api endpoints for admin
  - `trpc-routes.ts` for TRPC routes
- `client.ts` to export the main functionnality and important data to ease import from other client parts of the code
- `client/` folder to hold all client files
- `commands.ts` for CLI commands (see section 3)
- `constants.ts` for zod validation and other data shared by client and server
- `<moduleName>.config.ts` for information that developer will for sure have to make changes to (routes, jobs, etc...)
- `types.ts` to re-export types and/or share them
- `.env.example` to let user know which .env variables he needs to add.
```
# <moduleName> module
NEXT_MODULE_API_KEY=string
NEXT_PUBLIC_MODULE_SOMETHING=string
```

2. Rules

- Imports within the module should not use `@/modules` but `./` or `../`
- client should never import from server, even for types. Create a types.ts at the root that will re-export types if needed

3. CLI Commands

If your module provides CLI commands:

- Create `commands.ts` at module root that exports a `register<ModuleName>Commands(parentProgram: Command)` function
- Register commands under a module-specific namespace: `parentProgram.command('<moduleName>')`
- Import and call the register function in `scripts/cli.ts`

Example:

```typescript
// src/modules/mymodule/commands.ts
import { type Command } from '@commander-js/extra-typings';

export function registerMyModuleCommands(parentProgram: Command) {
  const program = parentProgram.command('mymodule').description('Commands for mymodule');

  program
    .command('do-something')
    .description('Does something')
    .action(async () => {
      // implementation
    });
}

// In scripts/cli.ts
import { registerMyModuleCommands } from '@/modules/mymodule/commands';
registerMyModuleCommands(program);
```
