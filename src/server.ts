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

## Recommended Workflows

1. **Test connectivity** → Call \`hello\` to verify the server responds
2. **Structured output** → Call \`get_weather\` to see typed response data
3. **Progress reporting** → Call \`long_task\` to observe real-time progress notifications
4. **Dynamic tools** → Call \`load_bonus_tool\`, then re-list tools to see \`bonus_calculator\` appear
5. **LLM sampling** → Call \`ask_llm\` to have the server request a completion from the client
6. **Elicitation** → Call \`confirm_action\` (form-based) or \`get_feedback\` (URL-based) to request user input

## Multi-Tool Flows

- **Full demo**: \`hello\` → \`get_weather\` → \`long_task\` → \`load_bonus_tool\` → \`bonus_calculator\`
- **Dynamic loading**: \`load_bonus_tool\` triggers a \`tools/list_changed\` notification — refresh your tool list to see \`bonus_calculator\`
- **User interaction**: \`confirm_action\` demonstrates schema elicitation, \`get_feedback\` demonstrates URL elicitation

## Notes

- All tools include annotations (readOnlyHint, idempotentHint, openWorldHint) to guide safe usage
- Resources and prompts are available for context and templating — use \`resources/list\` and \`prompts/list\` to discover them
`.trim();

/**
 * Creates and configures the MCP server with all features.
 *
 * ## Capabilities Alignment with Python Reference
 *
 * This server's capabilities are aligned with the Python reference implementation:
 * - `experimental: {}` - Included to match Python reference
 * - `resources.subscribe: false` - Explicitly set (not yet implemented)
 * - `tools.listChanged: true` - Dynamic tools via load_bonus_tool
 * - `prompts: {}` - Standard prompts capability
 */
export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: 'mcp-typescript-starter',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: {
          subscribe: false,
        },
        prompts: {},
        experimental: {},
      },
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  registerTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}
