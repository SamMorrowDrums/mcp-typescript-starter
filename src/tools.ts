/**
 * MCP TypeScript Starter - Tools
 *
 * All tool definitions for the MCP server.
 * Tools are functions that the client can invoke to perform actions.
 *
 * ## Tool Annotations
 *
 * Every tool SHOULD have annotations to help AI assistants understand behavior:
 * - readOnlyHint: Tool only reads data, doesn't modify state
 * - destructiveHint: Tool can permanently delete or modify data
 * - idempotentHint: Repeated calls with same args have same effect
 * - openWorldHint: Tool accesses external systems (web, APIs, etc.)
 *
 * @see https://modelcontextprotocol.io/docs/concepts/tools
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

let bonusToolLoaded = false;

/**
 * Register all tools with the server.
 */
export function registerTools(server: McpServer): void {
  registerHelloTool(server);
  registerWeatherTool(server);
  registerAskLlmTool(server);
  registerLongTaskTool(server);
  registerLoadBonusTool(server);
  registerConfirmActionTool(server);
  registerGetFeedbackTool(server);
}

/**
 * Basic greeting tool with annotations.
 */
function registerHelloTool(server: McpServer): void {
  server.tool(
    'hello',
    'A friendly greeting tool that says hello to someone',
    {
      name: z.string().describe('The name to greet'),
    },
    {
      title: 'Say Hello',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ name }) => ({
      content: [{ type: 'text', text: `Hello, ${name}! Welcome to MCP.` }],
    })
  );
}

/**
 * Weather tool with structured output.
 */
function registerWeatherTool(server: McpServer): void {
  server.tool(
    'get_weather',
    'Get current weather for a location (simulated)',
    {
      location: z.string().describe('City name or coordinates'),
    },
    {
      title: 'Get Weather',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false, // Results vary due to simulation
      openWorldHint: false, // Simulated, not real external calls
    },
    async ({ location }) => {
      const weather = {
        location,
        temperature: Math.round(15 + Math.random() * 20),
        unit: 'celsius',
        conditions: ['sunny', 'cloudy', 'rainy', 'windy'][Math.floor(Math.random() * 4)],
        humidity: Math.round(40 + Math.random() * 40),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(weather, null, 2) }],
        structuredContent: weather,
      };
    }
  );
}

/**
 * Tool that invokes LLM sampling.
 */
function registerAskLlmTool(server: McpServer): void {
  server.tool(
    'ask_llm',
    'Ask the connected LLM a question using sampling',
    {
      prompt: z.string().describe('The question or prompt for the LLM'),
      maxTokens: z.number().optional().default(100).describe('Maximum tokens in response'),
    },
    {
      title: 'Ask LLM',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false, // LLM responses vary
      openWorldHint: false, // Uses connected client, not external
    },
    async ({ prompt, maxTokens }) => {
      try {
        const result = await server.server.createMessage({
          messages: [{ role: 'user', content: { type: 'text', text: prompt } }],
          maxTokens: maxTokens ?? 100,
        });

        return {
          content: [
            {
              type: 'text',
              text: `LLM Response: ${result.content.type === 'text' ? result.content.text : '[non-text response]'}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Sampling not supported or failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Long-running task with progress updates.
 */
function registerLongTaskTool(server: McpServer): void {
  server.tool(
    'long_task',
    'A task that takes 5 seconds and reports progress along the way',
    {
      taskName: z.string().describe('Name for this task'),
    },
    {
      title: 'Long Running Task',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ taskName }, extra) => {
      const steps = 5;

      for (let i = 0; i < steps; i++) {
        await extra.sendNotification({
          method: 'notifications/progress',
          params: {
            progressToken: 'long_task',
            progress: i / steps,
            total: 1.0,
          },
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return {
        content: [
          { type: 'text', text: `Task "${taskName}" completed successfully after ${steps} steps!` },
        ],
      };
    }
  );
}

/**
 * Tool that dynamically loads another tool at runtime.
 */
function registerLoadBonusTool(server: McpServer): void {
  server.tool(
    'load_bonus_tool',
    "Dynamically loads a bonus tool that wasn't available at startup",
    {},
    {
      title: 'Load Bonus Tool',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true, // Loading twice is safe
      openWorldHint: false,
    },
    async (_args, extra) => {
      if (bonusToolLoaded) {
        return {
          content: [
            { type: 'text', text: "Bonus tool is already loaded! Try calling 'bonus_calculator'." },
          ],
        };
      }

      // Register the bonus calculator with inline annotations
      server.tool(
        'bonus_calculator',
        'A calculator that was dynamically loaded',
        {
          a: z.number().describe('First number'),
          b: z.number().describe('Second number'),
          operation: z
            .enum(['add', 'subtract', 'multiply', 'divide'])
            .describe('Mathematical operation'),
        },
        {
          title: 'Bonus Calculator',
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        async ({ a, b, operation }) => {
          const ops: Record<string, number> = {
            add: a + b,
            subtract: a - b,
            multiply: a * b,
            divide: b !== 0 ? a / b : NaN,
          };
          return {
            content: [{ type: 'text', text: `${a} ${operation} ${b} = ${ops[operation]}` }],
          };
        }
      );

      bonusToolLoaded = true;

      // Notify clients that the tools list has changed
      await extra.sendNotification({
        method: 'notifications/tools/list_changed',
        params: {},
      });

      return {
        content: [
          {
            type: 'text',
            text: "Bonus tool 'bonus_calculator' has been loaded! The tools list has been updated.",
          },
        ],
      };
    }
  );
}

// =============================================================================
// Elicitation Tools - Request user input during tool execution
//
// WHY ELICITATION MATTERS:
// Elicitation allows tools to request additional information from users
// mid-execution, enabling interactive workflows. This is essential for:
//   - Confirming destructive actions before they happen
//   - Gathering missing parameters that weren't provided upfront
//   - Implementing approval workflows for sensitive operations
//   - Collecting feedback or additional context during execution
//
// TWO ELICITATION MODES:
// - Form (schema): Display a structured form with typed fields in the client
// - URL: Open a web page (e.g., OAuth flow, feedback form, documentation)
//
// RESPONSE ACTIONS:
// - "accept": User provided the requested information
// - "decline": User explicitly refused to provide information
// - "cancel": User dismissed the request without responding
// =============================================================================

/**
 * Tool that demonstrates form elicitation - requests user confirmation.
 */
function registerConfirmActionTool(server: McpServer): void {
  server.tool(
    'confirm_action',
    'Demonstrates elicitation - requests user confirmation before proceeding',
    {
      action: z.string().describe('The action to confirm with the user'),
    },
    {
      title: 'Confirm Action',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false, // User response varies
      openWorldHint: false,
    },
    async ({ action }) => {
      try {
        // Form elicitation: Display a structured form with typed fields
        // The client renders this as a dialog/form based on the JSON schema
        const result = await server.server.elicitInput({
          mode: 'form',
          message: `Please confirm: ${action}`,
          requestedSchema: {
            type: 'object',
            properties: {
              confirm: {
                type: 'boolean',
                title: 'Confirm',
                description: 'Confirm the action',
              },
              reason: {
                type: 'string',
                title: 'Reason',
                description: 'Optional reason for your choice',
              },
            },
            required: ['confirm'],
          },
        });

        if (result.action === 'accept') {
          const content = result.content ?? {};
          if (content.confirm) {
            const reason = (content.reason as string) || 'No reason provided';
            return {
              content: [{ type: 'text', text: `Action confirmed: ${action}\nReason: ${reason}` }],
            };
          }
          return {
            content: [{ type: 'text', text: `Action declined by user: ${action}` }],
          };
        } else if (result.action === 'decline') {
          return {
            content: [{ type: 'text', text: `User declined to respond for: ${action}` }],
          };
        } else {
          return {
            content: [{ type: 'text', text: `User cancelled elicitation for: ${action}` }],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Elicitation not supported or failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Tool that demonstrates URL elicitation - opens feedback form in browser.
 */
function registerGetFeedbackTool(server: McpServer): void {
  server.tool(
    'get_feedback',
    'Demonstrates URL elicitation - opens a feedback form in the browser',
    {
      topic: z.string().optional().describe('Optional topic for the feedback'),
    },
    {
      title: 'Get Feedback',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false, // User response varies
      openWorldHint: true, // Opens external URL
    },
    async ({ topic }) => {
      let feedbackUrl =
        'https://github.com/SamMorrowDrums/mcp-starters/issues/new?template=workshop-feedback.yml';
      if (topic) {
        feedbackUrl += `&title=${encodeURIComponent(topic)}`;
      }

      try {
        // URL elicitation: Open a web page in the user's browser
        // Useful for OAuth flows, external forms, documentation links, etc.
        const result = await server.server.elicitInput({
          mode: 'url',
          message:
            'Please provide feedback on MCP Starters by completing the form at the URL below:',
          elicitationId: `feedback-${Date.now()}`,
          url: feedbackUrl,
        });

        if (result.action === 'accept') {
          return {
            content: [
              {
                type: 'text',
                text: 'Thank you for providing feedback! Your input helps improve MCP Starters.',
              },
            ],
          };
        } else if (result.action === 'decline') {
          return {
            content: [
              {
                type: 'text',
                text: `No problem! Feel free to provide feedback anytime at: ${feedbackUrl}`,
              },
            ],
          };
        } else {
          return {
            content: [{ type: 'text', text: 'Feedback request cancelled.' }],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `URL elicitation not supported or failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nYou can still provide feedback at: ${feedbackUrl}`,
            },
          ],
        };
      }
    }
  );
}
