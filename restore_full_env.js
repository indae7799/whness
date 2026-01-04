const fs = require('fs');
const path = require('path');

// The Direct PostgreSQL URL (Decoded from the base64 token found earlier)
// This bypasses the 'prisma+postgres://' proxy requirement which was causing issues.
const directDbUrl = 'DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=1&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&single_use_connections=true&socket_timeout=0"\n';

// Read the user's provided API key file
let apiKeyContent = "";
try {
    apiKeyContent = fs.readFileSync('apikey.md', 'utf-8');
    console.log("✅ Read apikey.md successfully.");
} catch (e) {
    console.error("❌ Could not read apikey.md. Ensure it exists in the root directory.");
    process.exit(1);
}

// Combine: Put DATABASE_URL at the top, followed by the rest of the config
const finalEnvContent = directDbUrl + apiKeyContent;

// Write to .env and .env.local to ensure both Prisma and Next.js pick it up
try {
    fs.writeFileSync('.env', finalEnvContent, 'utf-8');
    fs.writeFileSync('.env.local', finalEnvContent, 'utf-8');
    console.log("✅ restored .env and .env.local successfully.");
} catch (e) {
    console.error("❌ Failed to write env files:", e);
    process.exit(1);
}
