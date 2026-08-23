"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const db_1 = require("./db");
const app = (0, app_1.createApp)();
// Initialize database
(0, db_1.getDb)();
app.listen(config_1.config.port, () => {
    console.log(`=========================================`);
    console.log(`  AI Food Scanner Backend Server Running`);
    console.log(`  Port: http://localhost:${config_1.config.port}`);
    console.log(`  Health Check: http://localhost:${config_1.config.port}/health`);
    console.log(`=========================================`);
});
