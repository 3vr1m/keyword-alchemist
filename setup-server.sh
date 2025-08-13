#!/bin/bash

# Server Setup Script for Keyword Alchemist
# Usage: ./setup-server.sh [server-ip]

SERVER_IP=${1:-"your-server-ip"}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if server IP is provided
if [ "$SERVER_IP" = "your-server-ip" ]; then
    print_error "Please provide your server IP address:"
    echo "Usage: ./setup-server.sh your-server-ip"
    exit 1
fi

echo "🛠️  Setting up server $SERVER_IP for Keyword Alchemist deployment..."

print_status "Setting up server dependencies..."

ssh root@$SERVER_IP << 'EOF'
    # Update system
    apt-get update && apt-get upgrade -y
    
    # Install required packages
    apt-get install -y curl wget git
    
    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        
        # Start and enable Docker
        systemctl start docker
        systemctl enable docker
        
        echo "✅ Docker installed successfully"
    else
        echo "✅ Docker is already installed"
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose plugin not found. Please install Docker Compose."
        exit 1
    else
        echo "✅ Docker Compose is available"
    fi
    
    # Create application directory
    mkdir -p /opt/keyword-alchemist
    
    # Set up firewall rules (optional)
    if command -v ufw &> /dev/null; then
        echo "Setting up firewall rules..."
        ufw allow 22    # SSH
        ufw allow 80    # HTTP
        ufw allow 443   # HTTPS
        ufw allow 3001  # Application port (you can remove this after setting up reverse proxy)
        ufw --force enable
        echo "✅ Firewall configured"
    fi
    
    echo "✅ Server setup complete!"
    echo "📝 Server is ready for deployment"
EOF

if [ $? -eq 0 ]; then
    print_status "Server setup completed successfully!"
    print_warning "Next step: Run deployment script"
    echo "Usage: ./deploy.sh $SERVER_IP"
else
    print_error "Server setup failed. Please check the logs above."
    exit 1
fi
