# 🚨 PRODUCTION DEPLOYMENT STRATEGY

## Critical Issue: GitHub vs Production Mismatch

**The production servers have critical configurations that are NOT in GitHub:**
- Custom port configurations (4001 for Shorts Analyzer)
- Production Docker Compose files
- Nginx configurations
- SSL certificates
- Environment files

## Current Production Setup ✅

### Server: 23.88.106.121

| Project | Domain | Ports | Status |
|---------|---------|-------|---------|
| **Keyword Alchemist** | keywordalchemist.com | 3001, 3002 | ✅ LIVE + SSL |
| **Shorts Analyzer** | shortsanalyzer.com | 4001 | ✅ LIVE + SSL |
| **Future Project** | - | 5001, 5002 | 🎯 Reserved |

## SAFE DEPLOYMENT STRATEGY

### Option A: Commit Production Changes ⚠️ 
**Push production configs to GitHub first:**

```bash
# Shorts Analyzer
cd /opt/shorts-analyzer
git add docker-compose.prod.yml
git commit -m "Add production config with port 4001"
git push origin main

# Then deploy safely from GitHub
```

### Option B: Protected Production Files 🔒
**Create `.gitignore` entries for production files:**

```bash
# In both repos, add to .gitignore:
docker-compose.prod.yml
.env.production
nginx-configs/
```

### Option C: Separate Production Branch 🌳
**Create production-specific branches:**

```bash
git checkout -b production
git add docker-compose.prod.yml .env.production
git commit -m "Production configuration"
git push origin production
```

## DEPLOYMENT COMMANDS (SAFE)

### Before ANY deployment:
```bash
# 1. Backup current containers
docker ps > /opt/containers_backup.txt

# 2. Backup Nginx configs
cp -r /etc/nginx/sites-available /opt/nginx_backup/

# 3. Test current setup
curl -I https://keywordalchemist.com/
curl -I https://shortsanalyzer.com/
```

### Deployment Workflow:
```bash
# 1. Pull latest from YOUR branch (not main if unsafe)
cd /opt/[project]
git stash  # Save local changes
git pull origin main
git stash pop  # Restore local changes

# 2. Deploy with production config
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# 3. Verify deployment
docker ps
curl -I https://[domain].com/
```

## ROLLBACK STRATEGY

```bash
# If deployment fails:
cd /opt/[project]
git reset --hard HEAD~1  # Go back to previous commit
docker compose -f docker-compose.prod.yml up -d --build
```

## RECOMMENDED NEXT STEPS:

1. **First**: Backup all server configurations
2. **Second**: Commit production changes to a safe branch
3. **Third**: Test deployment on a copy/staging environment
4. **Finally**: Deploy with rollback plan ready

## Files We CANNOT Lose:

### Shorts Analyzer:
- `/opt/shorts-analyzer/docker-compose.prod.yml` (port 4001)
- `/opt/shorts-analyzer/.env.production`

### Server Configs:
- `/etc/nginx/sites-available/shortsanalyzer.com`
- `/etc/letsencrypt/live/shortsanalyzer.com/`

### Keyword Alchemist:
- `/opt/keyword-alchemist/docker-compose.prod.yml` (ports 3001-3002)
- `/opt/keyword-alchemist/.env.production`

## Emergency Contact Info:
- Server IP: 23.88.106.121
- Production Guide: `/opt/PRODUCTION_DEPLOYMENT_GUIDE.md`

---
**⚠️ NEVER run `git pull` without first backing up production configurations!**
