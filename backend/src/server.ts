import { createApp } from './app';
import { config } from './config';
import { getDb } from './db';

const app = createApp();

// Initialize database
getDb();

app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`  AI Food Scanner Backend Server Running`);
  console.log(`  Port: http://localhost:${config.port}`);
  console.log(`  Health Check: http://localhost:${config.port}/health`);
  console.log(`=========================================`);
});
