# Keyword Alchemist Deployment Guide

This guide will help you deploy the Keyword Alchemist application to your server.

## Prerequisites

- A server with Ubuntu/Debian Linux
- SSH access to your server with root privileges
- Your server's IP address
- Gemini API key

## Quick Deployment

### Step 1: Setup Your Server

First, prepare your server with Docker and other dependencies:

```bash
./setup-server.sh YOUR_SERVER_IP
```

This script will:
- Update the system packages
- Install Docker and Docker Compose
- Set up firewall rules
- Create the application directory

### Step 2: Deploy the Application

Deploy your application to the server:

```bash
./deploy.sh YOUR_SERVER_IP
```

**Important**: On first deployment, the script will create a `.env.production` file on your server. You'll need to:

1. SSH into your server: `ssh root@YOUR_SERVER_IP`
2. Navigate to the app directory: `cd /opt/keyword-alchemist`
3. Edit the environment file: `nano .env.production`
4. Add your Gemini API key: `GEMINI_API_KEY=your-actual-api-key-here`
5. Save and exit (Ctrl+X, then Y, then Enter)
6. Run the deploy script again: `./deploy.sh YOUR_SERVER_IP`

### Step 3: Verify Deployment

Check if your application is running:

```bash
# Check container status
ssh root@YOUR_SERVER_IP "cd /opt/keyword-alchemist && docker compose -f docker-compose.prod.yml ps"

# Test the API
curl http://YOUR_SERVER_IP:3002/api/health

# Test the frontend
curl -I http://YOUR_SERVER_IP:3001
```

## Production Setup (Recommended)

### Set up Reverse Proxy with Nginx

1. Install Nginx on your server:
```bash
ssh root@YOUR_SERVER_IP "apt-get update && apt-get install -y nginx"
```

2. Create Nginx configuration:
```bash
ssh root@YOUR_SERVER_IP "cat > /etc/nginx/sites-available/keyword-alchemist << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF"
```

3. Enable the site:
```bash
ssh root@YOUR_SERVER_IP "ln -s /etc/nginx/sites-available/keyword-alchemist /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx"
```

### Set up SSL with Let's Encrypt

1. Install Certbot:
```bash
ssh root@YOUR_SERVER_IP "apt-get install -y certbot python3-certbot-nginx"
```

2. Obtain SSL certificate:
```bash
ssh root@YOUR_SERVER_IP "certbot --nginx -d your-domain.com"
```

## File Structure

```
/opt/keyword-alchemist/
├── docker-compose.prod.yml    # Production Docker Compose config
├── .env.production           # Production environment variables
├── Dockerfile               # Frontend Dockerfile
├── backend/
│   ├── Dockerfile          # Backend Dockerfile
│   ├── .dockerignore       # Backend build exclusions
│   └── ...                 # Backend source code
└── ...                     # Frontend source code
```

## Environment Variables

The `.env.production` file should contain:

```bash
# Required
GEMINI_API_KEY=your-actual-gemini-api-key

# Optional
LOG_LEVEL=info
```

## Troubleshooting

### Check Container Logs

```bash
# Check backend logs
ssh root@YOUR_SERVER_IP "cd /opt/keyword-alchemist && docker compose -f docker-compose.prod.yml logs backend"

# Check frontend logs
ssh root@YOUR_SERVER_IP "cd /opt/keyword-alchemist && docker compose -f docker-compose.prod.yml logs frontend"
```

### Restart Services

```bash
# Restart all containers
ssh root@YOUR_SERVER_IP "cd /opt/keyword-alchemist && docker compose -f docker-compose.prod.yml restart"

# Restart specific service
ssh root@YOUR_SERVER_IP "cd /opt/keyword-alchemist && docker compose -f docker-compose.prod.yml restart backend"
```

### Update Deployment

To update your application, just run the deploy script again:

```bash
./deploy.sh YOUR_SERVER_IP
```

## Security Notes

- Change the default ports (3001, 3002) to internal-only after setting up reverse proxy
- Keep your environment variables secure
- Regularly update your server and containers
- Consider using a non-root user for enhanced security

## Support

If you encounter any issues during deployment, check the container logs and ensure all environment variables are properly set.
