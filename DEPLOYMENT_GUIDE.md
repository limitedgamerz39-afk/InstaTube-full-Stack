## Security Considerations

1. Change all default passwords before deployment
2. Use HTTPS in production (configure SSL termination)
3. Restrict access to admin ports (27017, 9001)
4. Regularly update Docker images
5. Monitor logs for suspicious activity

## HTTPS/SSL Configuration

To enable HTTPS in production, you have several options:

### Option 1: Using Reverse Proxy (Nginx) with Let's Encrypt (Recommended)

1. **Install Certbot for Let's Encrypt:**
```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# On CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

2. **Obtain SSL Certificate:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Auto-renewal Setup:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Option 2: Using Traefik with Let's Encrypt (Docker)

Update your docker-compose.yml to include Traefik:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.9
    container_name: instatube_traefik
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.httpchallenge=true"
      - "--certificatesresolvers.myresolver.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.myresolver.acme.email=your-email@example.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
    networks:
      - instatube_network

  # Add labels to your frontend service
  frontend:
    # ... existing frontend configuration ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=myresolver"
      - "traefik.http.services.frontend.loadbalancer.server.port=80"
```

### Option 3: Manual SSL Certificate Configuration

1. **Obtain SSL Certificate from Certificate Authority**
2. **Place certificate files in a secure directory**
3. **Update Nginx configuration in frontend/nginx.conf:**

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # ... rest of your existing configuration ...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Option 4: Using Cloudflare SSL (Easiest)

1. **Sign up for Cloudflare**
2. **Point your domain's nameservers to Cloudflare**
3. **Enable SSL/TLS in Cloudflare dashboard**
4. **Choose "Flexible" SSL mode for easiest setup**

## Environment Configuration for HTTPS

Update your environment variables in docker-compose.yml:

```yaml
# Backend environment variables
- NODE_ENV=production
- FRONTEND_URL=https://yourdomain.com

# Frontend environment variables
- VITE_API_URL=https://yourdomain.com/api
- VITE_SOCKET_URL=https://yourdomain.com
```

Also update your backend/server.js to handle HTTPS properly:

```javascript
// ✅ HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && !req.secure) {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```