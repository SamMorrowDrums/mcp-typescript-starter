/**
 * MCP TypeScript Starter - Resources
 *
 * All resource and resource template definitions.
 * Resources expose data to the client that can be read.
 *
 * @see https://modelcontextprotocol.io/docs/concepts/resources
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

/** Example data for dynamic resources */
const ITEMS_DATA: Record<string, { name: string; description: string }> = {
  '1': { name: 'Widget', description: 'A useful widget' },
  '2': { name: 'Gadget', description: 'A fancy gadget' },
  '3': { name: 'Gizmo', description: 'A mysterious gizmo' },
};

/**
 * Register all resources and templates with the server.
 */
export function registerResources(server: McpServer): void {
  registerAboutResource(server);
  registerGreetingTemplate(server);
  registerItemsTemplate(server);
}

/**
 * Static "about" resource with server information.
 */
function registerAboutResource(server: McpServer): void {
  server.resource(
    'About',
    'info://about',
    { description: 'Information about this MCP server', mimeType: 'text/plain' },
    async () => ({
      contents: [
        {
          uri: 'info://about',
          mimeType: 'text/plain',
          text: `MCP TypeScript Starter v1.0.0

This is a feature-complete MCP server demonstrating:
- Tools with annotations and structured output
- Resources (static and dynamic)
- Resource templates
- Prompts with completions
- Sampling, progress updates, and dynamic tool loading

For more information, visit: https://modelcontextprotocol.io`,
        },
      ],
    })
  );
}

/**
 * Template for personalized greetings.
 */
function registerGreetingTemplate(server: McpServer): void {
  server.resource(
    'Personalized Greeting',
    new ResourceTemplate('greeting://{name}', { list: undefined }),
    { description: 'Generate a personalized greeting', mimeType: 'text/plain' },
    async (uri, { name }) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/plain',
          text: `Hello, ${name}! This greeting was generated just for you.`,
        },
      ],
    })
  );
}

/**
 * Template for item data lookup.
 */
function registerItemsTemplate(server: McpServer): void {
  server.resource(
    'Item Data',
    new ResourceTemplate('data://items/{id}', { list: undefined }),
    { description: 'Get data for a specific item by ID', mimeType: 'application/json' },
    async (uri, { id }) => {
      const item = ITEMS_DATA[id as string];
      if (!item) {
        throw new Error(`Item not found: ${id}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ id, ...item }, null, 2),
          },
        ],
      };
    }
  );
}
