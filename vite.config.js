import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import quoteHandler from "./api/quote.js";
import contactMessageHandler from "./api/contact-message.js";

function localApiPlugin(env) {
  const handlers = {
    "/api/quote": quoteHandler,
    "/api/contact-message": contactMessageHandler,
  };

  return {
    name: "local-api",
    configureServer(server) {
      Object.assign(process.env, env);

      Object.entries(handlers).forEach(([path, handler]) => {
        server.middlewares.use(path, async (req, res) => {
          if (req.method !== "POST") {
            await handler(req, res);
            return;
          }

          try {
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            req.body = Buffer.concat(chunks).toString("utf8");
            await handler(req, res);
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Local API error." }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), localApiPlugin(env)],
  };
});
