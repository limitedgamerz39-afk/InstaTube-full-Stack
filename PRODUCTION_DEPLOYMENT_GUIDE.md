# D4D HUB Production Deployment Guide

This guide will help you deploy the D4D HUB application to production using your domain names:
- Main site: https://d4dhub.com
- API endpoint: https://api.d4dhub.com
- WWW redirect: https://www.d4dhub.com

## Prerequisites

1. A server with Docker and Docker Compose installed
2. Your domain names registered and pointing to your server's IP address
3. SSL certificates for HTTPS (can be obtained using Let's Encrypt)

## Deployment Steps

### 1. Prepare Your Server

Ensure Docker and Docker Compose are installed:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone or Transfer Your Project

Transfer the project files to your server or clone the repository:
```bash
# If using git
git clone <your-repo-url>
cd InstaTube-full-Stack
```

### 3. Configure Environment Variables

The environment variables have already been configured in the docker-compose.prod.yml file:
- Strong passwords for MongoDB and MinIO
- Secure JWT and Session secrets
- Correct domain URLs for CORS and frontend

### 4. Deploy Using Docker Compose

Use the production docker-compose file:
```bash
# Navigate to project directory
cd /path/to/InstaTube-full-Stack

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 5. Set Up Reverse Proxy with Nginx

Create an Nginx configuration to handle your domains and SSL:

1. Install Nginx:
```bash
sudo apt update
sudo apt install nginx
```

2. Create Nginx configuration files:

For the main site (d4dhub.com):
```nginx
server {
    listen 80;
    server_name d4dhub.com www.d4dhub.com;
    return 301 https://d4dhub.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name d4dhub.com;

    # SSL Configuration (using Let's Encrypt certificates)
    ssl_certificate /etc/letsencrypt/live/d4dhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/d4dhub.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name www.d4dhub.com;

    # SSL Configuration (using Let's Encrypt certificates)
    ssl_certificate /etc/letsencrypt/live/d4dhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/d4dhub.com/privkey.pem;

    return 301 https://d4dhub.com$request_uri;
}
```

For the API (api.d4dhub.com):
```nginx
server {
    listen 80;
    server_name api.d4dhub.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.d4dhub.com;

    # SSL Configuration (using Let's Encrypt certificates)
    ssl_certificate /etc/letsencrypt/live/api.d4dhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.d4dhub.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the Nginx configurations:
```bash
sudo ln -s /etc/nginx/sites-available/d4dhub.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.d4dhub.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Set Up SSL Certificates with Let's Encrypt

Install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
```

Obtain SSL certificates:
```bash
sudo certbot --nginx -d d4dhub.com -d www.d4dhub.com
sudo certbot --nginx -d api.d4dhub.com
```

Set up auto-renewal:
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Configure Firewall

Open necessary ports:
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 9001/tcp  # MinIO Console (restrict in production)
sudo ufw enable
```

### 8. Final Checks

1. Verify all services are running:
```bash
docker-compose -f docker-compose.prod.yml ps
```

2. Check application logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

3. Test your domains:
- https://d4dhub.com (main site)
- https://api.d4dhub.com (API endpoint)
- https://www.d4dhub.com (should redirect to main site)

## Maintenance

### Updating the Application

To update your application:

1. Pull the latest code:
```bash
git pull origin main
```

2. Rebuild and restart services:
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup Database

Regularly backup your MongoDB data:
```bash
docker exec d4dhub_mongodb mongodump --out /backup/$(date +"%Y-%m-%d")
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the domains are correctly added to the allowedOrigins array in backend/server.js
2. **WebSocket Connection Issues**: Check Nginx proxy configuration for Socket.IO
3. **File Upload Problems**: Verify MinIO configuration and credentials
4. **Performance Issues**: Monitor resource usage and adjust Docker resource limits if needed

### Checking Logs

View logs for specific services:
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

## Security Considerations

1. Change default passwords in docker-compose.prod.yml
2. Use strong, unique secrets for JWT_SECRET and SESSION_SECRET
3. Restrict access to the MinIO console (port 9001) in production
4. Regularly update Docker images
5. Monitor logs for suspicious activity
6. Implement proper firewall rules
7. Keep your server OS and packages updated

Your D4D HUB application is now ready for production deployment on your domains!