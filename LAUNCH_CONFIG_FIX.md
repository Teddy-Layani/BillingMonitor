# VSCode Launch Configuration Fix

## Problem

The VSCode launch configuration for BillingMonitor was failing with an approuter validation error:

```
Process exited with code 1
Uncaught VError VError
    at JsonValidator.validate (/home/user/projects/BillingMonitor/node_modules/@sap/approuter/lib/utils/JsonValidator.js:30:5)
    at validateXsApp (/home/user/projects/BillingMonitor/node_modules/@sap/approuter/lib/configuration/validators.js:149:15)
```

The `@sap/html5-repo-mock` (which uses the SAP approuter internally) could not start because it was failing to validate the `xs-app.json` file.

## Root Cause

**The core issue was a conflicting `xs-app.json` file at the project root level.**

### Directory Structure Comparison

**EmailDataDashboard (Working):**
```
/home/user/projects/EmailDataDashboard/
├── node_modules/
├── xs-security.json
└── EmailDataDashboard/
    ├── xs-app.json          ✓ Only one xs-app.json
    └── ... (app files)
```

**BillingMonitor (Broken):**
```
/home/user/projects/BillingMonitor/
├── node_modules/
├── xs-app.json              ✗ EXTRA FILE - This was the problem!
├── xs-security.json
└── BillingMonitor/
    ├── xs-app.json          ✓ This is the correct one
    └── ... (app files)
```

## Solution

### 1. Remove Root-Level xs-app.json

The `xs-app.json` file should only exist in the application subdirectory (`BillingMonitor/BillingMonitor/`), not at the project root.

**Action taken:**
```bash
mv /home/user/projects/BillingMonitor/xs-app.json \
   /home/user/projects/BillingMonitor/xs-app.json.backup
```

### 2. Simplify Application xs-app.json

Updated `/home/user/projects/BillingMonitor/BillingMonitor/xs-app.json` to match the proven working pattern from EmailDataDashboard:

**Before (Complex):**
```json
{
  "routes": [
    { "source": "^/GW_SSO/(.*)$", "destination": "GW_SSO", ... },
    { "source": "^/sap/opu/odata/(.*)$", "destination": "GW_SSO", ... },
    { "source": "^/resources/(.*)$", "target": "/resources/$1", ... },
    { "source": "^(.*)$", "service": "html5-apps-repo-rt", ... }
  ]
}
```

**After (Simplified):**
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

### 3. Correct Launch Configuration

The [.vscode/launch.json](.vscode/launch.json) uses the same pattern as EmailDataDashboard:

```json
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
```

## Key Takeaways

1. **One xs-app.json per application** - Should only exist in the application folder, not at project root
2. **Match working patterns** - When debugging, compare directory structure with working projects
3. **Approuter expects specific structure** - The `@sap/html5-repo-mock` relies on approuter which has strict validation rules
4. **Keep xs-app.json simple** - Only include routes actually needed; extra routes can cause validation issues

## Testing

After these changes, the launch configuration should work exactly like EmailDataDashboard:

1. Open Run & Debug panel in VSCode (F5)
2. Select "Run BillingMonitor"
3. Click the green play button
4. The app should start on port 6004 without errors
