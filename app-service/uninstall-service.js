const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: 'AppWebSocketService',
    script: path.join(__dirname, 'index.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', () => {
    console.log('Service uninstalled successfully!');
    console.log('The service has been removed.');
});

svc.on('alreadyuninstalled', () => {
    console.log('Service is not installed.');
});

svc.on('error', (err) => {
    console.error('Uninstall error:', err);
});

// Uninstall the service
console.log('Uninstalling Windows Service...');
console.log('Note: This requires administrator privileges.');
svc.uninstall();
