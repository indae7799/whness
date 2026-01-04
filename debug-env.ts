import "dotenv/config";
import { config } from "dotenv";

const envLocal = config({ path: ".env.local" });
console.log("Loaded .env.local:", envLocal.error ? "Error" : "Success");
if (envLocal.parsed) {
    console.log("DATABASE_URL in .env.local:", envLocal.parsed.DATABASE_URL ? envLocal.parsed.DATABASE_URL.split('@')[1] : "Not set");
}

console.log("process.env.DATABASE_URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : "Not set");
