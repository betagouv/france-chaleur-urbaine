# Model Context Protocol (MCP) Configuration

This directory contains the configuration for MCP servers that can be used with your AI coding tools.

## What is MCP?

Model Context Protocol (MCP) is a standardized way to connect AI assistants to external data sources and tools. MCP servers provide capabilities like:

- Database access (PostgreSQL, SQLite, Airtable)
- File system operations
- API integrations (GitHub, Slack, etc.)
- Custom tools and data sources

## Configuration File

The `config.jsonc` file is the **single source of truth** for all MCP server configurations across all your IDEs (Claude Code, Cursor, Windsurf, VS Code, etc.).

### Structure

```jsonc
{
  "mcpServers": {
    "server-name": {
      "description": "Human-readable description",
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": ".env.API_KEY"
      }
    }
  }
}
```

### Fields

- **description** (optional): Human-readable description shown in `./ai/cli mcp list`
- **command**: Executable command (usually `npx` for Node.js packages)
- **args**: Array of command-line arguments
- **env**: Environment variables required by the server

## Environment Variables

Environment variables use the `.env.KEY` pattern and are automatically replaced with actual values from `.env.local` when running `./ai/cli mcp use`.

### Example

**In config.jsonc:**
```jsonc
{
  "env": {
    "AIRTABLE_API_KEY": ".env.AIRTABLE_API_KEY"
  }
}
```

**In .env.local:**
```bash
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
```

**Result in IDE config:**
```json
{
  "env": {
    "AIRTABLE_API_KEY": "keyXXXXXXXXXXXXXX"
  }
}
```

## CLI Commands

### Install/Update MCP Templates

Download the latest MCP configuration templates from GitHub:

```bash
./ai/cli mcp install
```

This is like the `update` command - it fetches the latest MCP examples and documentation.

### List Available Servers

Show all MCP servers defined in your config and their status:

```bash
./ai/cli mcp list
```

Output shows:
- Server name
- Description (if provided)
- Active status (enabled in IDE configs)

### Enable MCP Servers

Enable one or more MCP servers across ALL configured IDEs:

```bash
./ai/cli mcp use <server-name> [server-name2 ...]
```

Examples:
```bash
./ai/cli mcp use sqlite
./ai/cli mcp use github airtable postgres
```

This command:
1. Reads server configurations from `.ai/mcps/config.jsonc`
2. Replaces `.env.KEY` placeholders with actual values from `.env.local`
3. **Overwrites** MCP configuration files in ALL configured IDEs
4. Shows error if required environment variables are missing

### Disable MCP Servers

Remove one or more MCP servers from ALL configured IDEs:

```bash
./ai/cli mcp unuse <server-name> [server-name2 ...]
```

Examples:
```bash
./ai/cli mcp unuse sqlite
./ai/cli mcp unuse github airtable
```

This command:
1. Reads currently active servers from IDE configs
2. Removes specified servers
3. **Overwrites** MCP configuration files with remaining servers

## Supported IDEs

The MCP configuration is automatically synced to all configured IDEs:

### Cursor
- **Global**: `~/.cursor/mcp.json`

## Adding New MCP Servers

### Browse Available Servers

Find hundreds of MCP servers at **https://mcpservers.org/**

Popular servers include:
- **Trello** - Manage boards, lists, and cards
- **Make.com** - Turn Make scenarios into AI tools
- **Notion** - Official Notion integration
- **Google Calendar** - Manage events and schedules
- **Google Drive** - Access Drive, Sheets, and Docs
- **Gmail** - Search threads and create drafts
- **Next.js DevTools** - Next.js development tools
- **Context7** - Up-to-date library documentation

### Adding a Custom Server

1. Find an MCP server package on https://mcpservers.org/ or npm
2. Add it to `.ai/mcps/config.jsonc`:

```jsonc
{
  "mcpServers": {
    "my-server": {
      "description": "My custom MCP server",
      "command": "npx",
      "args": ["-y", "@my-org/mcp-server"],
      "env": {
        "API_KEY": ".env.MY_API_KEY"
      }
    }
  }
}
```

3. Add required environment variables to `.env.local`
4. Enable with `./ai/cli mcp use my-server`

## Troubleshooting

### Missing Environment Variables

**Error**: `❌ Missing environment variable: AIRTABLE_API_KEY`

**Solution**: Add the variable to `.env.local`:
```bash
echo "AIRTABLE_API_KEY=your-key-here" >> .env.local
```

### No IDEs Configured

**Error**: `❌ No IDE configured yet`

**Solution**: Configure at least one IDE first:
```bash
./ai/cli configure
```

### Server Not Found

**Error**: `❌ MCP server 'xyz' not found`

**Solution**: Check available servers:
```bash
./ai/cli mcp list
```

### IDE Not Detecting MCP Servers

1. Restart your IDE completely
2. Check IDE-specific MCP documentation
3. Verify the config file path for your platform
4. Check IDE logs for MCP connection errors

## Best Practices

1. **Commit `config.jsonc`** to git so your team shares the same MCP setup
2. **Don't commit `.env.local`** - keep credentials private
3. **Use descriptive names** for better `mcp list` output
4. **Test servers individually** before enabling multiple servers
5. **Document custom servers** in team documentation

## Resources

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [MCP Server Registry](https://github.com/modelcontextprotocol/servers)
- [Claude Desktop MCP Guide](https://support.claude.com/en/articles/10949351-getting-started-with-model-context-protocol-mcp-on-claude-for-desktop)
- [VS Code MCP Documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
