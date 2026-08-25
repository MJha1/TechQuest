import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info("api_listening", { url: `http://localhost:${env.PORT}`, env: env.NODE_ENV });
});
