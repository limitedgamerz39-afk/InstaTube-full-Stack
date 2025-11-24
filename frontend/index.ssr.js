import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import React from 'react';
import App from './src/App.jsx';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createSsrServer() {
  const app = express();
  
  // Create Vite server in middleware mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  
  // Use vite's connect instance as middleware
  app.use(vite.middlewares);
  
  // Serve static files
  app.use('/assets', express.static(path.resolve(__dirname, 'dist/assets')));
  
  // SSR endpoint
  app.use('*', async (req, res, next) => {
    try {
      // Get the transformed index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, 'index.html'),
        'utf-8'
      );
      
      template = await vite.transformIndexHtml(req.originalUrl, template);
      
      // Render the app
      const appHtml = renderToString(React.createElement(App));
      
      // Inject the rendered app HTML into the template
      const html = template.replace(`<!--app-html-->`, appHtml);
      
      // Send the rendered HTML
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  
  app.listen(5002, () => {
    console.log('SSR server running on http://localhost:5002');
  });
}

createSsrServer();