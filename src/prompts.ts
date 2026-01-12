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
 * Greeting prompt with style options.
 */
function registerGreetPrompt(server: McpServer): void {
  server.prompt(
    'greet',
    'Generate a greeting in a specific style',
    {
      name: z.string().describe('Name of the person to greet'),
      style: z.string().optional().describe('The greeting style (formal, casual, enthusiastic)'),
    },
    async ({ name, style }) => {
      const styles: Record<string, string> = {
        formal: `Please compose a formal, professional greeting for ${name}.`,
        casual: `Write a casual, friendly hello to ${name}.`,
        enthusiastic: `Create an excited, enthusiastic greeting for ${name}!`,
      };

      const text = styles[style || 'casual'] || styles.casual;

      return {
        messages: [{ role: 'user', content: { type: 'text', text } }],
      };
    }
  );
}

/**
 * Code review prompt with focus areas.
 */
function registerCodeReviewPrompt(server: McpServer): void {
  server.prompt(
    'code_review',
    'Request a code review with specific focus areas',
    {
      code: z.string().describe('The code to review'),
      language: z.string().describe('Programming language'),
      focus: z
        .string()
        .optional()
        .describe('What to focus on (security, performance, readability, all)'),
    },
    async ({ code, language, focus }) => {
      const focusInstructions: Record<string, string> = {
        security: 'Focus on security vulnerabilities and potential exploits.',
        performance: 'Focus on performance optimizations and efficiency issues.',
        readability: 'Focus on code clarity, naming, and maintainability.',
        all: 'Provide a comprehensive review covering security, performance, and readability.',
      };

      const instruction = focusInstructions[focus || 'all'] || focusInstructions.all;

      const text = `Please review the following ${language} code. ${instruction}

\`\`\`${language}
${code}
\`\`\``;

      return {
        messages: [{ role: 'user', content: { type: 'text', text } }],
      };
    }
  );
}
