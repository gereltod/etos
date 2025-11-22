# Windows Service - WebSocket + MSSQL

A Windows service that listens to WebSocket connections and executes MSSQL commands.

## Features

- WebSocket server for real-time communication
- MSSQL database integration
- Command-based query execution
- Runs as a Windows service
- Easy installation and management

## Installation

1. Install dependencies:
```powershell
npm install
```

2. Configure the `.env` file with your database credentials:
```
WS_PORT=8080
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=your_database
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

3. Install as Windows Service (requires administrator):
```powershell
npm run install-service
```

## Usage

### Running in Development
```powershell
npm start
```

### WebSocket Commands

Connect to `ws://localhost:8080` and send JSON commands:

#### 1. Ping Command
```json
{
  "command": "ping"
}
```

#### 2. Custom Query
```json
{
  "command": "query",
  "params": {
    "query": "SELECT * FROM Users WHERE Age > @age",
    "parameters": {
      "age": 18
    }
  }
}
```

#### 3. Select Command
```json
{
  "command": "select",
  "params": {
    "table": "Users",
    "columns": ["id", "name", "email"],
    "where": "age > 18",
    "orderBy": "name ASC",
    "limit": 10
  }
}
```

#### 4. Insert Command
```json
{
  "command": "insert",
  "params": {
    "table": "Users",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "age": 25
    }
  }
}
```

#### 5. Update Command
```json
{
  "command": "update",
  "params": {
    "table": "Users",
    "data": {
      "email": "newemail@example.com"
    },
    "where": "id = 1"
  }
}
```

#### 6. Delete Command
```json
{
  "command": "delete",
  "params": {
    "table": "Users",
    "where": "id = 1"
  }
}
```

## Service Management

### Uninstall Service (requires administrator)
```powershell
npm run uninstall-service
```

### Check Service Status
```powershell
Get-Service -Name "AppWebSocketService"
```

### Start/Stop Service
```powershell
Start-Service -Name "AppWebSocketService"
Stop-Service -Name "AppWebSocketService"
```

## Testing with wscat

Install wscat globally:
```powershell
npm install -g wscat
```

Connect and send commands:
```powershell
wscat -c ws://localhost:8080
```

Then type commands:
```json
{"command": "ping"}
{"command": "select", "params": {"table": "Users", "limit": 5}}
```

## Logs

When running as a service, logs are stored in:
- Event Viewer: Application Logs
- Service logs: `C:\Windows\System32\config\systemprofile\AppData\Local\AppWebSocketService\`

## Security Notes

- Always use parameterized queries to prevent SQL injection
- Configure firewall rules for the WebSocket port
- Use SSL/TLS in production environments
- Restrict database user permissions appropriately
- Consider implementing authentication for WebSocket connections
