// Import this module FIRST (before anything that reads process.env). ES module
// imports are hoisted and evaluated before the importing module's body, so
// calling dotenv.config() here — in an import that precedes the others —
// guarantees .env.local is loaded before env.ts / the routes read secrets.
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
