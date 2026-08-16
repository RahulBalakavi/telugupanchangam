import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { registerSeoRoutes } from "./seo";

// Digital Asset Links: proves to Android that the Play Store TWA
// (space.mytelugupanchangam.twa) and this site are the same publisher, which
// lets the app run fullscreen without a URL bar. Fingerprints are the SHA-256
// of the app signing certificates — the local upload key now, plus the Play
// App Signing certificate once the app is enrolled in the Play Console.
const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "space.mytelugupanchangam.twa",
      sha256_cert_fingerprints: [
        "56:C9:DB:0C:86:60:2C:A6:CF:1F:B2:8D:1F:5F:82:1F:0E:DA:2B:00:08:B8:1A:2C:40:C0:C8:2C:35:13:5D:40",
      ],
    },
  },
];

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Served explicitly because express.static ignores dotfile paths.
  app.get("/.well-known/assetlinks.json", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json(ASSET_LINKS);
  });

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
