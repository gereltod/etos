const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'AppWebSocketService',
    description: 'WebSocket service with MSSQL integration',
    script: path.join(__dirname, 'index.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ],
    env: [{
        name: "NODE_ENV",
        value: "production"
    }]
});

// Listen for the "install" event
svc.on('install', () => {
    console.log('Service installed successfully!');
    console.log('Starting service...');
    svc.start();
});

svc.on('alreadyinstalled', () => {
    console.log('Service is already installed.');
});

svc.on('start', () => {
    console.log('Service started successfully!');
    console.log('Service is now running.');
});

svc.on('error', (err) => {
    console.error('Service error:', err);
});

// Install the service
console.log('Installing Windows Service...');
console.log('Note: This requires administrator privileges.');
svc.install();
