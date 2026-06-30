import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { registerSeoRoutes } from "./seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // SEO/AEO: render real content + JSON-LD for crawlable routes (and the
  // dynamic sitemap) BEFORE static serving, so "/" and content URLs aren't
  // served as the empty SPA shell.
  registerSeoRoutes(app, distPath);

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
