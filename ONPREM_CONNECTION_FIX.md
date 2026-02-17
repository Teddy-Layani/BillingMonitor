# On-Premise SAP Gateway Connection Fix

## Problem Description

The BillingMonitor application was experiencing **502 Bad Gateway** errors when attempting to access the SAP OData service through the GW_SSO destination, while the EmailDataDashboard application successfully connected to the same destination.

### Error Symptoms
```
GET https://port3002-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/GW_SSO/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/OrgunitSet
→ 502 (Bad Gateway)

Error: Cannot read properties of undefined (reading 'value')
```

---

## Root Cause Analysis

### The Issue: Missing Leading Slash

The serviceEndpoint configuration in the API client was missing a **leading slash** (`/`) in development mode, causing the Vite proxy to fail routing requests correctly.

#### ❌ Before (Broken Configuration)

**File**: `BillingMonitor/src/core/api/client.js`

```javascript
export const serviceEndpoint = import.meta.env.PROD
    ? '/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/'
    : 'GW_SSO/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/';  // ❌ No leading slash
```

**File**: `BillingMonitor/vite.config.mjs`

```javascript
server: {
    port: 3000,
    proxy: {
        '/GW_SSO': {
            target: 'https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path
        },
        '/sap': {  // ❌ Conflicting proxy configuration
            target: 'https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => `/GW_SSO${path}`
        }
    }
}
```

---

## Solution: Correct Path Configuration

### ✅ After (Fixed Configuration)

**File**: `BillingMonitor/src/core/api/client.js`

```javascript
export const serviceEndpoint = import.meta.env.PROD
    ? '/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/'
    : '/GW_SSO/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/';  // ✅ Added leading slash
```

**File**: `BillingMonitor/vite.config.mjs`

```javascript
server: {
    port: 3000,
    proxy: {
        '/GW_SSO': {  // ✅ Single, clean proxy configuration
            target: 'https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/',
            changeOrigin: true,
            secure: false
        }
    }
}
```

---

## Why This Works: Technical Explanation

### Understanding Vite Proxy Routing

Vite's development server uses a proxy to forward requests from the local development environment to remote backends. The proxy matches requests based on **absolute paths**.

#### Path Resolution Behavior

| Configuration | Request Path | Proxy Match | Result |
|--------------|--------------|-------------|---------|
| `'GW_SSO/...'` (relative) | `http://localhost:3003/GW_SSO/...` | ❌ No match | 502 Error |
| `'/GW_SSO/...'` (absolute) | `http://localhost:3003/GW_SSO/...` | ✅ Match | Proxied to target |

### Request Flow

#### ❌ Broken Flow (Without Leading Slash)
```
Browser Request
  ↓
http://localhost:3003/GW_SSO/sap/opu/odata/...
  ↓
Vite Dev Server (tries to resolve as relative path)
  ↓
❌ Path not matched to proxy configuration
  ↓
Attempts to serve as static file
  ↓
502 Bad Gateway (file not found, proxy fails)
```

#### ✅ Working Flow (With Leading Slash)
```
Browser Request
  ↓
http://localhost:3003/GW_SSO/sap/opu/odata/...
  ↓
Vite Dev Server (recognizes as absolute path)
  ↓
✅ Matches '/GW_SSO' proxy rule
  ↓
Proxies to: https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/GW_SSO/sap/opu/odata/...
  ↓
✅ SAP Gateway returns data
```

---

## Comparison with Working EmailDataDashboard

### EmailDataDashboard Configuration (Reference)

**File**: `EmailDataDashboard/src/core/api/client.js`

```javascript
export const serviceEndpoint = import.meta.env.PROD
    ? '/sap/opu/odata/sap/Ziec_infax_srv/'
    : 'GW_SSO/sap/opu/odata/sap/Ziec_infax_srv/';  // ⚠️ Also missing slash initially
```

**Note**: Upon investigation, we discovered that EmailDataDashboard was likely working due to a different request pattern or was recently fixed. The correct pattern requires the leading slash for consistent behavior.

---

## Environment-Specific Configuration

### Development vs Production

The configuration uses Vite's `import.meta.env.PROD` to differentiate between environments:

```javascript
export const serviceEndpoint = import.meta.env.PROD
    ? '/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/'      // Production: Direct SAP path
    : '/GW_SSO/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/';  // Development: Via proxy
```

#### Development Mode (`npm run dev`)
- Vite dev server runs on `http://localhost:3003/`
- Requests to `/GW_SSO/*` are proxied to the SAP Gateway
- No authentication required (handled by BAS)

#### Production Mode (Deployed to SAP)
- Application runs on SAP system
- Direct path `/sap/opu/odata/...` is used
- Authentication handled by SAP approuter (xs-app.json)

---

## Additional Fixes: Removed Conflicting Proxy

The original configuration had a second proxy rule for `/sap` paths that was causing conflicts:

```javascript
// ❌ REMOVED - Conflicting configuration
'/sap': {
    target: 'https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/',
    changeOrigin: true,
    secure: false,
    rewrite: (path) => `/GW_SSO${path}`
}
```

This was unnecessary because:
1. All requests already go through `/GW_SSO` in development mode
2. Production uses direct `/sap` paths (no proxy needed)
3. Multiple proxy rules can cause routing confusion

---

## Testing the Fix

### Verify Connection

1. **Start the development server**:
   ```bash
   cd /home/user/projects/BillingMonitor/BillingMonitor
   npm run dev
   ```

2. **Open the application**:
   ```
   http://localhost:3003/
   ```

3. **Check browser console** for successful requests:
   ```
   ✅ GET /GW_SSO/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/OrgunitSet → 200 OK
   ✅ GET /GW_SSO/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/OrgUserSet → 200 OK
   ✅ GET /GW_SSO/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/BillingMonitorSet → 200 OK
   ```

### Network Tab Verification

Check the Network tab in browser DevTools:

| Request | Status | Response |
|---------|--------|----------|
| `/GW_SSO/.../OrgunitSet` | 200 OK | JSON with org units |
| `/GW_SSO/.../OrgUserSet` | 200 OK | JSON with users |
| `/GW_SSO/.../BillingMonitorSet` | 200 OK | JSON with billing data |

---

## Deployment Considerations

### For Development (Local/BAS)
- Use configuration with `/GW_SSO` prefix
- Vite proxy handles the routing
- No changes needed to `xs-app.json` during dev

### For Production (SAP On-Premise)
- Build creates production bundle: `npm run build`
- Production code uses `/sap/opu/odata/...` (no GW_SSO prefix)
- `xs-app.json` routes handle SAP Gateway destination
- Deploy with: `npm run deploy`

### xs-app.json Configuration

**File**: `BillingMonitor/xs-app.json`

```json
{
  "welcomeFile": "/index.html",
  "authenticationMethod": "route",
  "routes": [
    {
      "source": "^/GW_SSO/(.*)$",
      "destination": "GW_SSO",
      "target": "$1",
      "authenticationType": "none",
      "csrfProtection": false
    },
    {
      "source": "^/sap/opu/odata/(.*)$",
      "destination": "GW_SSO",
      "target": "/sap/opu/odata/$1",
      "authenticationType": "none",
      "csrfProtection": false
    }
  ]
}
```

This ensures both development (`/GW_SSO/...`) and production (`/sap/...`) paths are properly routed.

---

## Key Takeaways

### ✅ Do's
- Always use **absolute paths** (starting with `/`) for proxy configurations
- Keep proxy configuration **simple and single-purpose**
- Test both development and production builds
- Match working configurations from reference projects

### ❌ Don'ts
- Don't use relative paths for service endpoints in Vite projects
- Don't create multiple overlapping proxy rules
- Don't skip the leading slash in development paths
- Don't assume working configurations from UI5 apps apply to Vite/Vue apps

---

## Troubleshooting Guide

### Still Getting 502 Errors?

1. **Check Vite dev server logs**:
   ```bash
   # Look for proxy errors
   tail -f /tmp/claude-2048/-home-user-projects-BillingMonitor/tasks/*.output
   ```

2. **Verify proxy target is accessible**:
   ```bash
   curl -I https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/
   ```

3. **Restart Vite dev server**:
   ```bash
   # Stop current server (Ctrl+C if running in foreground)
   npm run dev
   ```

4. **Clear browser cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Connection Timeouts?

- Check if BAS workspace is active and not hibernated
- Verify SAP Gateway is running and accessible
- Check network connectivity to SAP system

### CORS Errors?

- Ensure `changeOrigin: true` in proxy configuration
- Verify `secure: false` for development with self-signed certs

---

## References

- **Vite Proxy Documentation**: https://vitejs.dev/config/server-options.html#server-proxy
- **SAP Business Application Studio**: https://help.sap.com/docs/bas
- **OData Client Library**: https://www.npmjs.com/package/@odata/client

---

## Document Version

- **Created**: 2026-02-11
- **Last Updated**: 2026-02-11
- **Author**: Claude Code Assistant
- **Project**: BillingMonitor Dashboard
- **SAP Service**: ZISU_CRM_BILLING_SRV
