# Redis Installation Guide for D4D HUB

This guide provides step-by-step instructions for installing and configuring Redis for use with the D4D HUB application.

## Prerequisites

- Windows 10/11 or Windows Server 2016+
- Administrator privileges
- At least 2GB RAM (4GB recommended)
- 100MB free disk space

## Installation Steps

### Method 1: Using Microsoft's Redis Port (Recommended for Windows)

1. Download Redis for Windows from the official Microsoft archive:
   - Visit: https://github.com/microsoftarchive/redis/releases
   - Download: Redis-x64-3.2.100.zip (or latest stable version)

2. Extract the ZIP file to a folder (e.g., `C:\Redis`)

3. Open Command Prompt as Administrator and navigate to the Redis folder:
   ```cmd
   cd C:\Redis
   ```

4. Install Redis as a Windows service:
   ```cmd
   redis-server.exe --service-install redis.windows.conf --loglevel verbose
   ```

5. Start the Redis service:
   ```cmd
   redis-server.exe --service-start
   ```

### Method 2: Using Windows Subsystem for Linux (WSL)

1. Install WSL2 if not already installed:
   ```powershell
   wsl --install
   ```

2. Install Ubuntu from Microsoft Store

3. Open Ubuntu and install Redis:
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

4. Start Redis service:
   ```bash
   sudo service redis-server start
   ```

## Configuration for D4D HUB

### Basic Configuration

1. Locate your Redis configuration file:
   - Windows native: `redis.windows.conf`
   - WSL: `/etc/redis/redis.conf`

2. Edit the configuration file to set appropriate values:

   ```conf
   # Bind to localhost only for security
   bind 127.0.0.1
   
   # Set port (default is 6379)
   port 6379
   
   # Enable persistence
   save 900 1
   save 300 10
   save 60 10000
   
   # Set memory policy
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   
   # Enable AOF for durability
   appendonly yes
   
   # Logging
   loglevel notice
   logfile "redis.log"
   ```

### Security Configuration

1. Set a password for Redis (in redis.conf):
   ```conf
   requirepass your_redis_password_here
   ```

2. If using Redis in production, consider additional security measures:
   - Use a firewall to restrict access
   - Change the default port
   - Disable dangerous commands
   - Use SSL/TLS if possible

## Testing the Installation

1. Open a new command prompt/terminal

2. Connect to Redis:
   ```cmd
   redis-cli
   ```

3. Test the connection:
   ```redis
   ping
   ```
   
   You should receive:
   ```
   PONG
   ```

4. Test basic operations:
   ```redis
   set test "D4D HUB Redis Test"
   get test
   ```

## Integration with D4D HUB

### Backend Configuration

1. Update your backend `.env` file with Redis connection details:
   ```env
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password_here
   REDIS_TTL=3600
   ```

2. Ensure the Redis service is running before starting the D4D HUB backend

### Starting/Stopping Redis Service

#### Windows Native Redis
```cmd
# Start Redis service
redis-server.exe --service-start

# Stop Redis service
redis-server.exe --service-stop

# Restart Redis service
redis-server.exe --service-stop
redis-server.exe --service-start
```

#### WSL Redis
```bash
# Start Redis service
sudo service redis-server start

# Stop Redis service
sudo service redis-server stop

# Restart Redis service
sudo service redis-server restart
```

## Troubleshooting

### Common Issues

1. **Redis service won't start**
   - Check if the port is already in use
   - Verify configuration file syntax
   - Ensure you have administrator privileges

2. **Connection refused errors**
   - Verify Redis is running
   - Check firewall settings
   - Confirm bind address in configuration

3. **Memory issues**
   - Adjust `maxmemory` setting in configuration
   - Consider using Redis eviction policies

### Log Files

- Windows native: Check Windows Event Viewer or specified log file in config
- WSL: `/var/log/redis/redis-server.log`

## Performance Tuning

1. Adjust memory settings based on your server capacity
2. Use connection pooling in your application
3. Implement proper key expiration policies
4. Monitor Redis performance with `redis-cli --stat`

## Backup and Recovery

1. Regularly backup your Redis data files:
   - RDB snapshots: `dump.rdb`
   - AOF logs: `appendonly.aof`

2. For production environments, consider setting up replication

## Conclusion

Redis is now configured and ready for use with D4D HUB. The caching layer will significantly improve application performance by reducing database load and providing fast access to frequently requested data.