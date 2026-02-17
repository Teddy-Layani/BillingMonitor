# SAP Business Application Studio - Vue/Vite App Architecture

This document describes the correct file architecture for Vue 3 + Vite applications running in SAP Business Application Studio (BAS) with on-premise connectivity.

## Complete Directory Structure

```
/home/user/projects/BillingMonitor/          # Project root
│
├── .vscode/                                   # VSCode configuration
│   ├── launch.json                            # Debug/run configurations
│   ├── settings.json                          # Editor settings
│   └── tasks.json                             # Build tasks
│
├── node_modules/                              # Root-level dependencies
│   └── @sap/html5-repo-mock/                  # SAP HTML5 mock server
│
├── package.json                               # Root package.json for workspace
├── package-lock.json
│
├── mta.yaml                                   # Multi-Target Application descriptor
├── xs-security.json                           # ✓ Security config at root
│
└── BillingMonitor/                            # Application folder
    │
    ├── .env.local                             # Environment variables (local)
    ├── .env.prod                              # Environment variables (production)
    ├── .env.test                              # Environment variables (test)
    ├── .envNaN                                # ✓ SAP Destinations config
    │
    ├── xs-app.json                            # ✓ Approuter config (app level ONLY)
    │
    ├── package.json                           # Application dependencies
    ├── vite.config.mjs                        # Vite configuration
    ├── index.html                             # Entry point
    │
    ├── public/                                # Static assets
    │   └── assets/
    │       └── logo.png
    │
    └── src/                                   # Source code
        ├── main.js                            # Vue app entry
        ├── App.vue                            # Root component
        │
        ├── router/                            # Vue Router
        │   └── index.js
        │
        ├── stores/                            # Pinia stores
        │   ├── app.js
        │   └── lookups.js
        │
        ├── core/                              # Core utilities
        │   └── api/
        │       └── client.js                  # OData client
        │
        ├── composables/                       # Vue composables
        │   └── useBillingData.js
        │
        ├── pages/                             # Page components
        │   └── Home.vue
        │
        └── components/                        # Reusable components
            └── ...
```

## Critical Files and Their Locations

### ❌ WRONG - Files That Should NOT Exist

```
/home/user/projects/BillingMonitor/xs-app.json    ❌ DO NOT CREATE HERE
```

**Reason:** The `xs-app.json` file should only exist in the application folder. Having it at the root causes approuter validation conflicts.

### ✓ CORRECT - Required Files

#### 1. xs-app.json (Application Level Only)

**Location:** `/home/user/projects/BillingMonitor/BillingMonitor/xs-app.json`

```json
{
  "welcomeFile": "/index.html",
  "authenticationMethod": "route",
  "logout": {
    "logoutEndpoint": "/do/logout"
  },
  "routes": [
    {
      "authenticationType": "none",
      "csrfProtection": false,
      "source": "^/GW_SSO/(.*)$",
      "destination": "GW_SSO",
      "target": "$1"
    },
    {
      "source": "^(.*)$",
      "target": "$1",
      "service": "html5-apps-repo-rt",
      "authenticationType": "xsuaa"
    }
  ]
}
```

#### 2. .envNaN (SAP Destinations)

**Location:** `/home/user/projects/BillingMonitor/BillingMonitor/.envNaN`

```json
destinations=[{"name":"GW_SSO","url":"http://GW_SSO.dest","proxyHost":"http://127.0.0.1","proxyPort":"8887"}]
```

**Purpose:** Defines SAP BAS destinations for on-premise connectivity.

#### 3. vite.config.mjs (Vite Configuration)

**Location:** `/home/user/projects/BillingMonitor/BillingMonitor/vite.config.mjs`

```javascript
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { HttpsProxyAgent } from 'https-proxy-agent';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

export default defineConfig({
    plugins: [
        vue(),
        vuetify({ autoImport: true })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 3000,
        proxy: {
            '/GW_SSO': {
                target: 'https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/',
                changeOrigin: true,
                secure: false,
                agent: new HttpsProxyAgent('http://127.0.0.1:8887')  // ✓ Critical for BAS
            }
        }
    }
});
```

**Key Points:**
- The `HttpsProxyAgent` is **required** for BAS on-premise connectivity
- Points to local proxy on port 8887
- Proxy forwards to port 6004 (BAS destination endpoint)

#### 4. API Client (OData Service Endpoint)

**Location:** `/home/user/projects/BillingMonitor/BillingMonitor/src/core/api/client.js`

```javascript
export const serviceEndpoint = import.meta.env.PROD
    ? '/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/'
    : '/GW_SSO/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/';
    //  ↑ CRITICAL: Leading slash required for Vite proxy
```

**Critical:** The leading `/` in `/GW_SSO` is **required** for Vite to match the proxy route.

#### 5. VSCode Launch Configuration

**Location:** `/home/user/projects/BillingMonitor/.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run BillingMonitor",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@sap/html5-repo-mock/index.js",
      "args": ["--standalone", "/BillingMonitor/index.html"],
      "cwd": "${workspaceFolder}/BillingMonitor",
      "env": {
        "PORT": "6004",
        "MOCK_LOOKUP_DIRS": "[\".\"]",
        "run.config": "{\"handlerId\":\"ui5_run_config_handler_id\",\"runnableId\":\"/home/user/projects/BillingMonitor/BillingMonitor\"}"
      },
      "envFile": "${workspaceFolder}/BillingMonitor/.envNaN",
      "preLaunchTask": "Build BillingMonitor"
    }
  ]
}
```

## SAP BAS On-Premise Connectivity Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser: http://localhost:6004/BillingMonitor/                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ @sap/html5-repo-mock (Approuter)                                │
│ - Reads xs-app.json                                             │
│ - Matches route: ^/GW_SSO/(.*)$                                 │
│ - Forwards to destination: GW_SSO                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ BAS Destination Service (port 8887)                             │
│ - Reads .envNaN for destination config                          │
│ - Proxies to configured destination                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ BAS Port 6004 Endpoint                                          │
│ - Routes to actual on-premise system via Cloud Connector        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ On-Premise SAP Gateway                                          │
│ /sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/                        │
└─────────────────────────────────────────────────────────────────┘
```

## Development Workflow

### Option 1: html5-repo-mock (Production-like)

**Use when:** Testing with actual SAP approuter behavior

```bash
# From VSCode
F5 → Select "Run BillingMonitor"

# Or from terminal
cd BillingMonitor
npm run build
cd ..
node node_modules/@sap/html5-repo-mock/index.js --standalone /BillingMonitor/index.html
```

**Access:** http://localhost:6004/BillingMonitor/

### Option 2: Vite Dev Server (Fast Development)

**Use when:** Rapid development with hot reload

```bash
cd BillingMonitor
npm run dev
```

**Access:** http://localhost:3000/ (or next available port)

**Requires:** `HttpsProxyAgent` configured in vite.config.mjs

## Common Issues and Solutions

### Issue 1: "Process exited with code 1" - Approuter Error

**Cause:** xs-app.json exists at project root
**Solution:** Remove `/home/user/projects/BillingMonitor/xs-app.json`

### Issue 2: 502 Bad Gateway

**Cause:** Missing `HttpsProxyAgent` in vite.config.mjs
**Solution:** Add proxy agent pointing to port 8887

### Issue 3: 404 Not Found on OData Requests

**Cause:** Missing leading slash in service endpoint
**Solution:** Use `/GW_SSO/...` not `GW_SSO/...`

### Issue 4: Destination Not Found

**Cause:** Missing or incorrect .envNaN file
**Solution:** Ensure `.envNaN` exists with proper destination config

## Required npm Packages

### Root Level
```json
{
  "devDependencies": {
    "@sap/html5-repo-mock": "latest"
  }
}
```

### Application Level
```json
{
  "dependencies": {
    "vue": "^3.x",
    "vuetify": "^3.x",
    "pinia": "^2.x",
    "vue-router": "^4.x"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "latest",
    "vite": "^6.x",
    "vite-plugin-vuetify": "latest",
    "https-proxy-agent": "latest"
  }
}
```

## Summary

✅ **DO:**
- Keep xs-app.json only in application folder
- Use HttpsProxyAgent for Vite proxy in BAS
- Include leading slash in proxy paths
- Copy .env files from working projects
- Match working project structure

❌ **DON'T:**
- Create xs-app.json at project root
- Forget the proxy agent in Vite config
- Omit leading slash in service endpoints
- Mix development approaches without understanding the flow
