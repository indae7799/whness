const net = require('net');
const ports = [5432, 5433, 51213, 51214, 51215];
console.log("Checking ports...");
ports.forEach(port => {
    const sock = new net.Socket();
    sock.setTimeout(500);
    sock.on('connect', () => {
        console.log(`✅ Port ${port} is OPEN`);
        sock.destroy();
    });
    sock.on('error', (e) => {
        // console.log(`❌ Port ${port} is closed`); 
    });
    sock.on('timeout', () => {
        // console.log(`⏰ Port ${port} timed out`); 
        sock.destroy();
    });
    sock.connect(port, 'localhost');
});
