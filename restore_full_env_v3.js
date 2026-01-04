const fs = require('fs');

// Replace 'prisma+postgres://' with 'prisma://'
// This protocol change is required for the Prisma Accelerate client to validate the URL correctly.
let prismaUrl = 'DATABASE_URL="prisma://localhost:51213/?api_key=eyJkYXRhYmFzZVVybCI6InBvc3RncmVzOi8vcG9zdGdyZXM6cG9zdGdyZXNAbG9jYWxob3N0OjUxMjE0L3RlbXBsYXRlMT9zc2xtb2RlPWRpc2FibGUmY29ubmVjdGlvbl9saW1pdD0xJmNvbm5lY3RfdGltZW91dD0wJm1heF9pZGxlX2Nvbm5lY3Rpb25fbGlmZXRpbWU9MCZwb29sX3RpbWVvdXQ9MCZzaW5nbGVfdXNlX2Nvbm5lY3Rpb25zPXRydWUmc29ja2V0X3RpbWVvdXQ9MCIsIm5hbWUiOiJkZWZhdWx0Iiwic2hhZG93RGF0YWJhc2VVcmwiOiJwb3N0Z3JlczovL3Bvc3RncmVzOnBvc3RncmVzQGxvY2FsaG9zdDo1MTIxNS90ZW1wbGF0ZTE_c3NsbW9kZT1kaXNhYmxlJmNvbm5lY3Rpb25fbGltaXQ9MSZjb25uZWN0X3RpbWVvdXQ9MCZtYXhfaWRsZV9jb25uZWN0aW9uX2xpZmV0aW1lPTAmcG9vbF90aW1lb3V0PTAmc2luZ2xlX3VzZV9jb25uZWN0aW9ucz10cnVlJnNvY2tldF90aW1lb3V0PTAifQ"\n';

// Read user's provided API key file
let apiKeyContent = "";
try {
    apiKeyContent = fs.readFileSync('apikey.md', 'utf-8');
} catch (e) {
    console.error("Could not read apikey.md");
    process.exit(1);
}

// Combine
const finalEnvContent = prismaUrl + apiKeyContent;

// Write to .env and .env.local
fs.writeFileSync('.env', finalEnvContent, 'utf-8');
fs.writeFileSync('.env.local', finalEnvContent, 'utf-8');
console.log("✅ Restored .env with 'prisma://' Protocol.");
