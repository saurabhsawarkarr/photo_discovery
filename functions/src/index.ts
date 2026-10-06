import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Example Function to test the backend environment
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase Backend!");
});
