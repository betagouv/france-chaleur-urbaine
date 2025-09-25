# Modules

This folder aims at holding different modules based on specific purposes

All modules should be orginized the same way

1. Structure

- `server.ts` to export the main functionnality and important data to ease import from other server parts of the code
- `server` folder to hold all server files
  - `api.ts` for legacy api endpoints
  - `api-admin.ts` for legacy api endpoints for admin
  - `trpc-routes` for TRPC routes
- `client.ts` to export the main functionnality and important data to ease import from other client parts of the code
- `client` folder to hold all client files
- `constants.ts` for zod validation and other data shared by client and server
- `<moduleName>.config.ts` for information that developer will for sure have to make changes to (routes, jobs, etc...)
- `types.ts` to re-export types and/or share them
- `.env.example` to let user know which .env variables he needs to add. 
```
# <moduleName> module
NEXT_MODULE_API_KEY=string
NEXT_PUBLIC_MODULE_SOMETHING=string

2. Rules

- Imports within the module should not use `@/modules` but `./` or `../`
- client should never import from server, even for types. Create a types.ts at the root that will re-export types if needed
