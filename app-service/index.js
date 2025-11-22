const WebSocket = require('ws');
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim();
                process.env[key] = value;
            }
        });
    }
}

loadEnv();

// MSSQL Configuration
const dbConfig = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true
    }
};

// Database connection pool
let pool = null;

// Initialize database connection
async function initDatabase() {
    try {
        pool = await sql.connect(dbConfig);
        console.log('Connected to MSSQL database');
        return pool;
    } catch (err) {
        console.error('Database connection error:', err);
        throw err;
    }
}

// Execute SQL query
async function executeQuery(query, params = {}) {
    try {
        if (!pool) {
            await initDatabase();
        }
        
        const request = pool.request();
        
        // Add parameters if provided
        Object.keys(params).forEach(key => {
            request.input(key, params[key]);
        });
        
        const result = await request.query(query);
        return {
            success: true,
            data: result.recordset,
            rowsAffected: result.rowsAffected[0]
        };
    } catch (err) {
        console.error('Query execution error:', err);
        return {
            success: false,
            error: err.message
        };
    }
}

// WebSocket Server
const PORT = process.env.WS_PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server starting on port ${PORT}...`);

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`New client connected from ${clientIp}`);
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to Windows Service',
        timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received command:', data);
            
            await handleCommand(ws, data);
        } catch (err) {
            console.error('Message handling error:', err);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format',
                error: err.message
            }));
        }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
        console.log(`Client disconnected: ${clientIp}`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Handle commands from WebSocket clients
async function handleCommand(ws, data) {
    const { command, params } = data;
    
    switch (command) {
        case 'query':
            await handleQueryCommand(ws, params);
            break;
            
        case 'select':
            await handleSelectCommand(ws, params);
            break;
            
        case 'insert':
            await handleInsertCommand(ws, params);
            break;
            
        case 'update':
            await handleUpdateCommand(ws, params);
            break;
            
        case 'delete':
            await handleDeleteCommand(ws, params);
            break;
            
        case 'ping':
            ws.send(JSON.stringify({
                type: 'response',
                command: 'ping',
                message: 'pong',
                timestamp: new Date().toISOString()
            }));
            break;
            
        default:
            ws.send(JSON.stringify({
                type: 'error',
                message: `Unknown command: ${command}`
            }));
    }
}

// Execute custom SQL query
async function handleQueryCommand(ws, params) {
    const { query, parameters } = params;
    
    if (!query) {
        ws.send(JSON.stringify({
            type: 'error',
            command: 'query',
            message: 'Query parameter is required'
        }));
        return;
    }
    
    const result = await executeQuery(query, parameters || {});
    
    ws.send(JSON.stringify({
        type: 'response',
        command: 'query',
        result: result,
        timestamp: new Date().toISOString()
    }));
}

// Handle SELECT command
async function handleSelectCommand(ws, params) {
    const { table, columns, where, orderBy, limit } = params;
    
    if (!table) {
        ws.send(JSON.stringify({
            type: 'error',
            command: 'select',
            message: 'Table parameter is required'
        }));
        return;
    }
    
    // Build SELECT query
    const cols = columns ? columns.join(', ') : '*';
    let query = `SELECT ${limit ? `TOP ${limit}` : ''} ${cols} FROM ${table}`;
    
    if (where) {
        query += ` WHERE ${where}`;
    }
    
    if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
    }
    
    const result = await executeQuery(query);
    
    ws.send(JSON.stringify({
        type: 'response',
        command: 'select',
        result: result,
        timestamp: new Date().toISOString()
    }));
}

// Handle INSERT command
async function handleInsertCommand(ws, params) {
    const { table, data } = params;
    
    if (!table || !data) {
        ws.send(JSON.stringify({
            type: 'error',
            command: 'insert',
            message: 'Table and data parameters are required'
        }));
        return;
    }
    
    const columns = Object.keys(data).join(', ');
    const values = Object.keys(data).map(key => `@${key}`).join(', ');
    const query = `INSERT INTO ${table} (${columns}) VALUES (${values})`;
    
    const result = await executeQuery(query, data);
    
    ws.send(JSON.stringify({
        type: 'response',
        command: 'insert',
        result: result,
        timestamp: new Date().toISOString()
    }));
}

// Handle UPDATE command
async function handleUpdateCommand(ws, params) {
    const { table, data, where } = params;
    
    if (!table || !data || !where) {
        ws.send(JSON.stringify({
            type: 'error',
            command: 'update',
            message: 'Table, data, and where parameters are required'
        }));
        return;
    }
    
    const setClause = Object.keys(data).map(key => `${key} = @${key}`).join(', ');
    const query = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    
    const result = await executeQuery(query, data);
    
    ws.send(JSON.stringify({
        type: 'response',
        command: 'update',
        result: result,
        timestamp: new Date().toISOString()
    }));
}

// Handle DELETE command
async function handleDeleteCommand(ws, params) {
    const { table, where } = params;
    
    if (!table || !where) {
        ws.send(JSON.stringify({
            type: 'error',
            command: 'delete',
            message: 'Table and where parameters are required'
        }));
        return;
    }
    
    const query = `DELETE FROM ${table} WHERE ${where}`;
    const result = await executeQuery(query);
    
    ws.send(JSON.stringify({
        type: 'response',
        command: 'delete',
        result: result,
        timestamp: new Date().toISOString()
    }));
}

// Initialize database on startup
initDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    
    if (pool) {
        await pool.close();
        console.log('Database connection closed');
    }
    
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});

console.log('Windows Service started successfully');