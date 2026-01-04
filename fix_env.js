const fs = require('fs');

let content = fs.readFileSync('.env', 'utf-8');

// Fix the missing closing quote
content = content.replace(
    /GOOGLE_AI_STUDIO_API_KEY="AIzaSyDxpZfrDJ9bXZRWLCeIanfCpxmDBG2q3_s(?!")/g,
    'GOOGLE_AI_STUDIO_API_KEY="AIzaSyDxpZfrDJ9bXZRWLCeIanfCpxmDBG2q3_s"'
);

fs.writeFileSync('.env', content);
fs.writeFileSync('.env.local', content);

console.log('✅ Fixed GOOGLE_AI_STUDIO_API_KEY quote!');
console.log(content.match(/GOOGLE_AI_STUDIO.*/g));
