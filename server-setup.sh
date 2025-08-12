#!/bin/bash

# Server Setup Script for Keyword Alchemist
# Run this script on your Hetzner server

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Setting up Keyword Alchemist on Hetzner VPS${NC}"

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    rm get-docker.sh
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}🔧 Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create project directory
echo -e "${YELLOW}📁 Creating project directory...${NC}"
mkdir -p /opt/keyword-alchemist
cd /opt/keyword-alchemist

# Install Git if not already installed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Git...${NC}"
    apt install -y git
fi

# Clone the repository (you'll need to run this manually with your repo URL)
echo -e "${YELLOW}📥 Ready to clone repository${NC}"
echo -e "${GREEN}Run this command to clone your repo:${NC}"
echo "git clone https://github.com/3vr1m/keyword-alchemist.git ."

# Set up nginx configuration (if using nginx as reverse proxy)
echo -e "${YELLOW}🌐 Setting up Nginx configuration...${NC}"

# Check if nginx is installed
if command -v nginx &> /dev/null; then
    # Create nginx site configuration
    cat > /etc/nginx/sites-available/keyword-alchemist << 'EOF'
server {
    listen 80;
    server_name keywords.yourdomain.com;  # Change this to your domain

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers for API calls
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    }
}
EOF

    # Enable the site
    ln -sf /etc/nginx/sites-available/keyword-alchemist /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    nginx -t && systemctl reload nginx
    
    echo -e "${GREEN}✅ Nginx configuration created${NC}"
    echo -e "${YELLOW}⚠️  Don't forget to update the server_name in /etc/nginx/sites-available/keyword-alchemist${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx not found. Install it if you want to use it as a reverse proxy${NC}"
fi

# Create systemd service for auto-start (optional)
cat > /etc/systemd/system/keyword-alchemist.service << 'EOF'
[Unit]
Description=Keyword Alchemist Docker Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/keyword-alchemist
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl enable keyword-alchemist.service

echo -e "${GREEN}✅ Server setup completed!${NC}"
echo -e "${BLUE}📝 Next steps:${NC}"
echo "1. Update domain name in /etc/nginx/sites-available/keyword-alchemist"
echo "2. Set up GitHub secrets for deployment"
echo "3. Push your code to trigger the first deployment"
echo "4. Set up SSL certificate with certbot (optional)"
