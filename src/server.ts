/**
 * MCP TypeScript Starter - Server
 *
 * Creates and configures the MCP server by combining
 * tools, resources, and prompts from their respective modules.
 *
 * @see https://modelcontextprotocol.io/
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools.js';
import { registerResources } from './resources.js';
import { registerPrompts } from './prompts.js';

/**
 * Server instructions for AI assistants.
 *
 * These instructions help AI models understand how to use this server effectively.
 * Include: available capabilities, recommended workflows, and best practices.
 */
const SERVER_INSTRUCTIONS = `
# MCP TypeScript Starter Server

A demonstration MCP server showcasing TypeScript SDK capabilities.

## Available Tools

### Greeting & Demos
- **hello**: Simple greeting - use to test connectivity
- **get_weather**: Returns simulated weather data
- **long_task**: Demonstrates progress reporting (takes ~5 seconds)

### LLM Interaction
- **ask_llm**: Invoke LLM sampling to ask questions (requires client support)

### Dynamic Features
- **load_bonus_tool**: Dynamically adds a calculator tool at runtime
- **bonus_calculator**: Available after calling load_bonus_tool

## Available Resources

- **config://settings**: Server configuration as JSON
- **status://server**: Current server status
- **notes://{name}**: Dynamic notes by name (e.g., notes://example)

## Available Prompts

- **greeting**: Generates a personalized greeting
- **code_review**: Structured code review prompt

## Recommended Workflows

1. **Testing Connection**: Call \`hello\` with your name to verify the server is responding
2. **Weather Demo**: Call \`get_weather\` with a location to see structured output
3. **Progress Demo**: Call \`long_task\` to see progress notifications
4. **Dynamic Loading**: Call \`load_bonus_tool\`, then refresh tools to see \`bonus_calculator\`

## Tool Annotations

All tools include annotations indicating:
- Whether they modify state (readOnlyHint)
- If they're safe to retry (idempotentHint)
- Whether they access external systems (openWorldHint)

Use these hints to make informed decisions about tool usage.
`.trim();

/**
 * Creates and configures the MCP server with all features.
 */
export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: 'mcp-typescript-starter',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  registerTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}
