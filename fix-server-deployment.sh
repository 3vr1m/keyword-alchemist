#!/bin/bash

# Server Deployment Fix Script
# Run this script on your Hetzner server to fix the deployment issues

set -e  # Exit on any error

echo "🔧 Starting server deployment fix..."
echo "======================================"

# Navigate to project directory
cd /opt/keyword-alchemist

echo "📍 Current directory: $(pwd)"
echo "📂 Directory contents:"
ls -la

echo ""
echo "🔍 Checking current Docker containers..."
docker ps -a

echo ""
echo "🔍 Checking what's using ports 3001 and 3002..."
echo "Port 3001:"
netstat -tlnp | grep :3001 || echo "Port 3001 is free"
echo "Port 3002:"
netstat -tlnp | grep :3002 || echo "Port 3002 is free"

echo ""
echo "🛑 Stopping all Docker services..."
docker compose down --remove-orphans

echo ""
echo "🧹 Cleaning up Docker containers and networks..."
docker container prune -f
docker network prune -f

echo ""
echo "🔧 Fixing git merge conflict..."
echo "Current git status:"
git status

echo "Stashing local changes..."
git stash

echo "Pulling latest code..."
git pull origin main

echo ""
echo "🐳 Starting services with fresh build..."
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🔍 Checking running containers..."
docker ps

echo ""
echo "🔍 Checking container logs..."
echo "Frontend logs (last 10 lines):"
docker compose logs --tail=10 keyword-alchemist

echo ""
echo "🧪 Testing services..."
echo "Testing frontend (port 3001):"
curl -I http://localhost:3001 || echo "❌ Frontend not responding"

echo "Testing backend (port 3002):"
curl -I http://localhost:3002/api/health || echo "❌ Backend not responding"

echo ""
echo "🔍 Final status check..."
docker compose ps

echo ""
echo "✅ Deployment fix completed!"
echo "======================================"
echo "If services are running, your app should be available at:"
echo "🌐 Frontend: http://95.217.121.99:3001"
echo "🔧 Backend: http://95.217.121.99:3002/api/health"
