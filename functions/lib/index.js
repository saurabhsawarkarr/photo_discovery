"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
// Example Function to test the backend environment
exports.helloWorld = (0, https_1.onRequest)((request, response) => {
    logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase Backend!");
});
//# sourceMappingURL=index.js.map