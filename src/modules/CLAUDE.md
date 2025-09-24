# Modules

This folder aims at holding different modules based on specific purposes

All modules should be orginized the same way

- `server.ts` to export the main functionnality and important data to ease import from other server parts of the code
- `server` folder to hold all server files
- `client.ts` to export the main functionnality and important data to ease import from other client parts of the code
- `client` folder to hold all client files
- `constants.ts` for zod validation and other data shared by client and server
- `<moduleName>.config.ts` for information that developer will for sure have to make changes to (routes, jobs, etc...)
