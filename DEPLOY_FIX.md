# NPM Deploy Issue - BillingMonitor vs EmailDataDashboard

## Problem

`npm run deploy` fails in BillingMonitor but works in EmailDataDashboard.

## Root Causes

### 1. Incompatible `specVersion` Between Files

**BillingMonitor (BROKEN):**
- `ui5.yaml`: `specVersion: '3.0'`
- `ui5-deploy.yaml`: `specVersion: '3.1'`

**EmailDataDashboard (WORKING):**
- `ui5.yaml`: `specVersion: '3.1'`
- `ui5-deploy.yaml`: `specVersion: '3.1'`

**Issue:** Mismatched spec versions can cause deployment tools to behave unexpectedly.

### 2. Incorrect Excludes in ui5-deploy.yaml

**BillingMonitor (BROKEN):**
```yaml
builder:
  resources:
    excludes:
      - /test/**
      - /localService/**
      - /node_modules/**    # ❌ PROBLEM
      - /src/**              # ❌ PROBLEM
  customTasks:
    ...
        exclude:
          - /test/**
          - /node_modules/**  # ❌ DUPLICATE
```

**EmailDataDashboard (WORKING):**
```yaml
builder:
  resources:
    excludes:
      - /test/**
      - /localService/**
      # No /node_modules/** ✓
      # No /src/** ✓
  customTasks:
    ...
        exclude:
          - /test/t  # Different exclude pattern
```

**Issues:**
1. `/node_modules/**` should NOT be in `builder.resources.excludes` - it interferes with deployment
2. `/src/**` should NOT be excluded during build - source files are needed for the build process
3. Duplicate `/node_modules/**` exclusion (both in resources and in customTasks)

## Solution

### Fix 1: Update ui5.yaml

**File:** `/home/user/projects/BillingMonitor/ui5.yaml`

Change:
```yaml
specVersion: '3.0'
```

To:
```yaml
specVersion: '3.1'
```

### Fix 2: Update ui5-deploy.yaml

**File:** `/home/user/projects/BillingMonitor/BillingMonitor/ui5-deploy.yaml`

Change:
```yaml
builder:
  resources:
    excludes:
      - /test/**
      - /localService/**
      - /node_modules/**    # ❌ REMOVE THIS
      - /src/**              # ❌ REMOVE THIS
  customTasks:
    - name: deploy-to-abap
      afterTask: generateCachebusterInfo
      configuration:
        target:
          destination: GW_SSO
          url: https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/
          client: 400
        app:
          name: ZBILLING_MON
          description: Billing Monitor Dashboard
          package: ZCRM
          transport: GWDK903062
        exclude:
          - /test/**
          - /node_modules/**  # ❌ REMOVE THIS
```

To:
```yaml
builder:
  resources:
    excludes:
      - /test/**
      - /localService/**
  customTasks:
    - name: deploy-to-abap
      afterTask: generateCachebusterInfo
      configuration:
        target:
          destination: GW_SSO
          url: https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/
          client: 400
        app:
          name: ZBILLING_MON
          description: Billing Monitor Dashboard
          package: ZCRM
          transport: GWDK903062
        exclude:
          - /test/**
```

## Why This Matters

### `/node_modules/**` Exclusion Issue
- The SAP deployment tooling needs access to certain dependencies during deployment
- Excluding `/node_modules/**` at the builder level prevents the tooling from accessing required libraries
- EmailDataDashboard only excludes `/node_modules/**` in the `customTasks.exclude` section, not in `builder.resources.excludes`

### `/src/**` Exclusion Issue
- The build process (Vite) compiles `/src/**` into `/dist/**`
- Excluding `/src/**` during the builder phase can break the build pipeline
- The compiled output in `/dist/**` is what gets deployed, not the source

### specVersion Consistency
- UI5 tooling uses the specVersion to determine which features and behaviors are available
- Having different versions between `ui5.yaml` and `ui5-deploy.yaml` can cause unexpected behavior
- Version `3.1` is the current stable version and should be used consistently

## Additional Fix: Invalid Regular Expression Error

### Error
```
error builder:custom deploy-to-abap Invalid regular expression: //test/**/g: Nothing to repeat
```

### Root Cause
The glob pattern `/test/**` in the `customTasks.exclude` section is being converted to a regex pattern by the deploy-to-abap task. The `**` causes a regex error because it means "repeat the previous token zero or more times" but there's no previous token to repeat.

### Solution
1. **Remove the entire `exclude` section from `customTasks`** - The Vite build output in `/dist/**` doesn't contain test files anyway, so this exclusion is unnecessary at the deployment stage
2. **Quote glob patterns in `builder.resources.excludes`** - This ensures they're treated as literal strings

**Updated ui5-deploy.yaml:**
```yaml
builder:
  resources:
    excludes:
      - "/test/**"        # Quoted to prevent regex issues
      - "/localService/**" # Quoted to prevent regex issues
  customTasks:
    - name: deploy-to-abap
      afterTask: generateCachebusterInfo
      configuration:
        target:
          destination: GW_SSO
          url: https://port6004-workspaces-ws-7romf.eu20.applicationstudio.cloud.sap/
          client: 400
        app:
          name: ZBILLING_MON
          description: Billing Monitor Dashboard
          package: ZCRM
          transport: GWDK903062
        # exclude section removed - not needed for build artifacts
```

## Testing After Fix

```bash
cd /home/user/projects/BillingMonitor/BillingMonitor
npm run deploy
```

Expected result:
- Build completes successfully
- Deployment package is created
- Files are uploaded to SAP system
- Transport request GWDK903062 is updated

## References

- EmailDataDashboard working configuration: `/home/user/projects/EmailDataDashboard/EmailDataDashboard/ui5-deploy.yaml`
- SAP UI5 Tooling documentation: https://sap.github.io/ui5-tooling/
- SAP Fiori Tools deployment: https://help.sap.com/docs/SAP_FIORI_tools/17d50220bcd848aa854c9c182d65b699/607014e278d941fda4440f92f4a324a6.html
