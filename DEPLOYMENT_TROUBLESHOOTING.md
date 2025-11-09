# Deployment Troubleshooting Guide

## Issue: Data Not Loading / Login Page Not Working

### Problem Summary

The website was not loading data and the login page was not displaying the login form, even though the code was correct locally.

### Root Cause

**Port 3000 was occupied by `http-server`**, preventing the Express server from starting. This caused:

- API endpoints returning 404 errors
- Frontend components unable to fetch data
- Login form not rendering (JavaScript couldn't load properly)

### Symptoms

1. Homepage showing empty "Models" section
2. Login page showing "Authentication Required" but no login form
3. Browser console showing no errors (because the server wasn't running)
4. API endpoints returning 404 when tested with `curl`

### Solution

#### Step 1: Check what's running on port 3000

```bash
ssh evcao@evcao-host.csse.dev
netstat -tlnp | grep :3000
# or
ss -tlnp | grep :3000
```

#### Step 2: Kill the conflicting process

```bash
# Kill http-server if it's running
pkill http-server

# Or kill any process on port 3000
# (Find the PID first, then kill it)
```

#### Step 3: Restart the Express server

```bash
cd /home/evcao/CSC437/packages/server

# Kill any existing Express server
pkill -f 'node.*dist/index.js'

# Rebuild and start
npm run build
nohup npm start > ../../nohup.out 2>&1 &

# Verify it's running
tail -f ../../nohup.out
```

#### Step 4: Verify the server is working

```bash
# Test the API
curl http://localhost:3000/api/cars

# Test the hello endpoint
curl http://localhost:3000/hello
```

### Prevention

1. **Always check port availability before starting the server:**

   ```bash
   netstat -tlnp | grep :3000
   ```

2. **Use a process manager** (like PM2) to manage the server:

   ```bash
   npm install -g pm2
   pm2 start npm --name "throttle-vault" -- start
   pm2 save
   pm2 startup
   ```

3. **Create a deployment script** that checks for conflicts:

   ```bash
   #!/bin/bash
   # Check if port is in use
   if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
       echo "Port 3000 is in use. Killing existing process..."
       pkill -f 'node.*dist/index.js'
       sleep 2
   fi

   # Start server
   cd /home/evcao/CSC437/packages/server
   npm run build
   nohup npm start > ../../nohup.out 2>&1 &
   ```

### Additional Issues Found and Fixed

1. **MongoDB Connection**: The `.env` file on the server was missing `TOKEN_SECRET` and had an incorrect password. Fixed by updating the `.env` file with correct credentials.

2. **Frontend Build**: The server's frontend build was outdated. Fixed by running `npm run build` in `packages/proto`.

### Quick Diagnostic Commands

```bash
# Check if Express server is running
ps aux | grep 'node.*dist/index.js'

# Check server logs
tail -f /home/evcao/CSC437/nohup.out

# Test API endpoint
curl http://localhost:3000/api/cars

# Check what's listening on port 3000
netstat -tlnp | grep :3000

# Check if JavaScript bundle is accessible
curl -I http://localhost:3000/assets/main-*.js
```

### Common Issues and Solutions

| Issue                         | Symptom                    | Solution                                                                     |
| ----------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| Port 3000 in use              | API returns 404            | Kill conflicting process, restart Express                                    |
| MongoDB not connected         | Server crashes on startup  | Check `.env` file credentials                                                |
| Frontend not loading          | Blank pages, no components | Rebuild frontend: `cd packages/proto && npm run build`                       |
| Outdated JavaScript bundle    | Components don't render    | Rebuild and check HTML references correct bundle                             |
| Missing environment variables | Authentication fails       | Ensure `.env` has `MONGO_USER`, `MONGO_PWD`, `MONGO_CLUSTER`, `TOKEN_SECRET` |

### Deployment Checklist

Before deploying:

- [ ] Pull latest code: `git pull --rebase`
- [ ] Check for port conflicts: `netstat -tlnp | grep :3000`
- [ ] Verify `.env` file exists and has all required variables
- [ ] Rebuild frontend: `cd packages/proto && npm run build`
- [ ] Rebuild backend: `cd packages/server && npm run build`
- [ ] Kill existing server processes
- [ ] Start server: `npm start`
- [ ] Verify server is running: `curl http://localhost:3000/hello`
- [ ] Test API: `curl http://localhost:3000/api/cars`
- [ ] Check logs: `tail -f nohup.out`

---

**Last Updated**: November 9, 2025
**Issue**: Port conflict preventing Express server from starting
**Resolution**: Killed `http-server`, restarted Express server
