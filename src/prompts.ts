/**
 * MCP TypeScript Starter - Prompts
 *
 * All prompt template definitions.
 * Prompts are pre-configured message templates the client can use.
 *
 * @see https://modelcontextprotocol.io/docs/concepts/prompts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * Register all prompts with the server.
 */
export function registerPrompts(server: McpServer): void {
  registerGreetPrompt(server);
  registerCodeReviewPrompt(server);
}

/**
 * Greeting prompt.
 * 
 * NOTE: Zod schemas in TypeScript cannot add "title" metadata to individual properties,
 * only "description". This is a language/library limitation. Properties will have:
 * - ✓ description (via .describe())
 * - ✗ title (not supported in Zod v4)
 */
function registerGreetPrompt(server: McpServer): void {
  server.prompt(
    'greet',
    'Generate a greeting message',
    {
      name: z.string().describe('Name of the person to greet'),
      style: z.string().optional().describe('Greeting style (formal/casual)'),
    },
    async ({ name, style }) => {
      const styles: Record<string, string> = {
        formal: `Please compose a formal, professional greeting for ${name}.`,
        casual: `Write a casual, friendly hello to ${name}.`,
      };

      const text = styles[style || 'casual'] || styles.casual;

      return {
        messages: [{ role: 'user', content: { type: 'text', text } }],
      };
    }
  );
}

/**
 * Code review prompt.
 * 
 * NOTE: Zod schemas in TypeScript cannot add "title" metadata to individual properties,
 * only "description". This is a language/library limitation. Properties will have:
 * - ✓ description (via .describe())
 * - ✗ title (not supported in Zod v4)
 */
function registerCodeReviewPrompt(server: McpServer): void {
  server.prompt(
    'code_review',
    'Review code for potential improvements',
    {
      code: z.string().describe('The code to review'),
    },
    async ({ code }) => {
      const text = `Please review the following code for potential improvements, security issues, performance optimizations, and readability:

\`\`\`
${code}
\`\`\``;

      return {
        messages: [{ role: 'user', content: { type: 'text', text } }],
      };
    }
  );
}
