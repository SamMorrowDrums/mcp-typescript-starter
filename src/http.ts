#!/usr/bin/env node
/**
 * MCP TypeScript Starter - Streamable HTTP Transport
 *
 * This entrypoint runs the MCP server using HTTP with SSE streams,
 * which is ideal for remote deployment and web-based clients.
 *
 * Usage:
 *   node dist/http.js
 *   PORT=8080 node dist/http.js
 *
 * @see https://modelcontextprotocol.io/docs/develop/transports#streamable-http
 */

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function main() {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Store transports for session management
  const transports = new Map<string, StreamableHTTPServerTransport>();

  /**
   * MCP endpoint - handles all MCP protocol messages
   */
  app.all('/mcp', async (req, res) => {
    // Get or create session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (req.method === 'GET') {
      // SSE stream for server-to-client messages
      if (!sessionId || !transports.has(sessionId)) {
        res.status(400).json({ error: 'Invalid or missing session ID' });
        return;
      }

      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (req.method === 'POST') {
      // Handle new sessions or existing session messages
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports.has(sessionId)) {
        transport = transports.get(sessionId)!;
      } else {
        // Create new session
        const server = createServer();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
        });

        transport.onclose = () => {
          const id = transport.sessionId;
          if (id) {
            transports.delete(id);
            console.log(`Session closed: ${id}`);
          }
        };

        await server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);

      // Store the transport after handleRequest so sessionId is set
      if (transport.sessionId && !transports.has(transport.sessionId)) {
        transports.set(transport.sessionId, transport);
        console.log(`New session: ${transport.sessionId}`);
      }
      return;
    }

    if (req.method === 'DELETE') {
      // Close session
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.close();
        transports.delete(sessionId);
        res.status(200).json({ message: 'Session closed' });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  });

  /**
   * Health check endpoint
   */
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      server: 'mcp-typescript-starter',
      version: '1.0.0',
      sessions: transports.size,
    });
  });

  app.listen(PORT, () => {
    console.log(`MCP TypeScript Starter running on http://localhost:${PORT}`);
    console.log(`  MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`  Health check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('Press Ctrl+C to exit');
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
