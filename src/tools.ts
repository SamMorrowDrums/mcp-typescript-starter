/**
 * MCP TypeScript Starter - Tools
 *
 * All tool definitions for the MCP server.
 * Tools are functions that the client can invoke to perform actions.
 *
 * ## Tool Annotations
 *
 * Every tool MUST have annotations to help AI assistants understand behavior:
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
 * Common annotation patterns for reuse across tools.
 */
const ANNOTATIONS = {
  /** Read-only tool that doesn't modify any state */
  hello: {
    title: 'Say Hello',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  /** Tool that simulates external data (weather, APIs, etc.) */
  weather: {
    title: 'Get Weather',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false, // Results vary due to simulation
    openWorldHint: false, // Simulated, not real external calls
  },
  /** Tool that invokes LLM sampling */
  askLlm: {
    title: 'Ask LLM',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false, // LLM responses vary
    openWorldHint: false, // Uses connected client, not external
  },
  /** Long-running task tool */
  longTask: {
    title: 'Long Running Task',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  /** Tool that mutates server state */
  loadBonus: {
    title: 'Load Bonus Tool',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true, // Loading twice is safe
    openWorldHint: false,
  },
  /** Pure computation tool */
  calculator: {
    title: 'Bonus Calculator',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
} as const;

/**
 * Register all tools with the server.
 */
export function registerTools(server: McpServer): void {
  registerHelloTool(server);
  registerWeatherTool(server);
  registerAskLlmTool(server);
  registerLongTaskTool(server);
  registerLoadBonusTool(server);
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
    ANNOTATIONS.hello,
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
    ANNOTATIONS.weather,
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
    ANNOTATIONS.askLlm,
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
    ANNOTATIONS.longTask,
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
    ANNOTATIONS.loadBonus,
    async () => {
      if (bonusToolLoaded) {
        return {
          content: [
            { type: 'text', text: "Bonus tool is already loaded! Try calling 'bonus_calculator'." },
          ],
        };
      }

      // Register the bonus calculator with annotations
      server.tool(
        'bonus_calculator',
        'A calculator that was dynamically loaded',
        {
          a: z.number().describe('First number'),
          b: z.number().describe('Second number'),
          operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('Mathematical operation'),
        },
        ANNOTATIONS.calculator,
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

      return {
        content: [
          {
            type: 'text',
            text: "Bonus tool 'bonus_calculator' has been loaded! Refresh your tools list to see it.",
          },
        ],
      };
    }
  );
}
