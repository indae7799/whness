const fs = require('fs');

// Supabase Connection String
const supabaseDbUrl = 'DATABASE_URL="postgresql://postgres:wjddlseo21!@db.xokqnkyjomdupzfpizbi.supabase.co:5432/postgres"\n';

// Read apikey.md for other API keys
let apiKeyContent = "";
try {
    apiKeyContent = fs.readFileSync('apikey.md', 'utf-8');
} catch (e) {
    console.error("Could not read apikey.md");
}

// Combine
const finalEnvContent = supabaseDbUrl + apiKeyContent;

// Write to .env and .env.local
fs.writeFileSync('.env', finalEnvContent, 'utf-8');
fs.writeFileSync('.env.local', finalEnvContent, 'utf-8');
console.log("✅ .env configured with Supabase DATABASE_URL!");
