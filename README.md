[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/sammorrowdrums-mcp-typescript-starter-badge.png)](https://mseep.ai/app/sammorrowdrums-mcp-typescript-starter)

# MCP TypeScript Starter

[![CI](https://github.com/SamMorrowDrums/mcp-typescript-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/SamMorrowDrums/mcp-typescript-starter/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-purple)](https://modelcontextprotocol.io/)

A feature-complete Model Context Protocol (MCP) server template in TypeScript. This starter demonstrates all major MCP features with clean, production-ready code.

## 📚 Documentation

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Building MCP Servers](https://modelcontextprotocol.io/docs/develop/build-server)

## ✨ Features

| Category | Feature | Description |
|----------|---------|-------------|
| **Tools** | `hello` | Basic tool with annotations |
| | `get_weather` | Tool with structured output schema |
| | `ask_llm` | Tool that invokes LLM sampling |
| | `long_task` | Tool with 5-second progress updates |
| | `load_bonus_tool` | Dynamically loads a new tool |
| **Resources** | `info://about` | Static informational resource |
| | `file://example.md` | File-based markdown resource |
| **Templates** | `greeting://{name}` | Personalized greeting |
| | `data://items/{id}` | Data lookup by ID |
| **Prompts** | `greet` | Greeting in various styles |
| | `code_review` | Code review with focus areas |

## 🚀 Quick Start

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/SamMorrowDrums/mcp-typescript-starter.git
cd mcp-typescript-starter

# Install dependencies
npm install

# Build
npm run build
```

### Running the Server

**stdio transport** (for local development):
```bash
npm run start:stdio
```

**HTTP transport** (for remote/web deployment):
```bash
npm run start:http
# Server runs on http://localhost:3000
```

## 🔧 VS Code Integration

This project includes VS Code configuration for seamless development:

1. Open the project in VS Code
2. The MCP configuration is in `.vscode/mcp.json`
3. Build with `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac)
4. Test the server using VS Code's MCP tools

### Using DevContainers

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open command palette: "Dev Containers: Reopen in Container"
3. Everything is pre-configured and ready to use!

## 📁 Project Structure

```
.
├── src/
│   ├── tools.ts       # Tool definitions (hello, get_weather, ask_llm, etc.)
│   ├── resources.ts   # Resource and template definitions
│   ├── prompts.ts     # Prompt definitions
│   ├── server.ts      # Server orchestration (combines all modules)
│   ├── stdio.ts       # stdio transport entrypoint
│   └── http.ts        # HTTP transport entrypoint
├── .vscode/
│   ├── mcp.json       # MCP server configuration
│   ├── tasks.json     # Build/run tasks
│   └── extensions.json
├── .devcontainer/
│   └── devcontainer.json
├── package.json
├── tsconfig.json
├── .prettierrc        # Prettier configuration
└── eslint.config.js
```

## 🛠️ Development

```bash
# Development mode with live reload
npm run dev

# Build for production
npm run build

# Format code
npm run format

# Lint
npm run lint

# Clean build
npm run clean && npm run build
```

### Live Reload

The `npm run dev` command uses `tsx watch` for instant reloads during development.
Changes to any `.ts` file will automatically restart the server.

## 🔍 MCP Inspector

The [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) is an essential development tool for testing and debugging MCP servers.

### Running Inspector

```bash
npx @modelcontextprotocol/inspector -- npx tsx src/stdio.ts
```

### What Inspector Provides

- **Tools Tab**: List and invoke all registered tools with parameters
- **Resources Tab**: Browse and read resources and templates
- **Prompts Tab**: View and test prompt templates
- **Logs Tab**: See JSON-RPC messages between client and server
- **Schema Validation**: Verify tool input/output schemas

### Debugging Tips

1. Start Inspector before connecting your IDE/client
2. Use the "Logs" tab to see exact request/response payloads
3. Test tool annotations are exposed correctly
4. Verify progress notifications appear for `long_task`

## 📖 Feature Examples

### Tool with Annotations

```typescript
server.tool(
  "hello",
  {
    title: "Say Hello",
    description: "A friendly greeting tool",
    annotations: { readOnlyHint: true },
  },
  { name: z.string() },
  async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  })
);
```

### Resource Template

```typescript
server.resourceTemplate(
  "greeting://{name}",
  { name: "Personalized Greeting", mimeType: "text/plain" },
  async ({ name }) => ({
    contents: [{
      uri: `greeting://${name}`,
      text: `Hello, ${name}!`,
    }],
  })
);
```

### Tool with Progress Updates

```typescript
server.tool(
  "long_task",
  { title: "Long Task" },
  { taskName: z.string() },
  async ({ taskName }, { sendProgress }) => {
    for (let i = 0; i < 5; i++) {
      await sendProgress({ progress: i / 5, total: 1.0 });
      await sleep(1000);
    }
    return { content: [{ type: "text", text: "Done!" }] };
  }
);
```

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |

## 🤝 Contributing

Contributions welcome! Please ensure your changes maintain feature parity with other language starters.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
