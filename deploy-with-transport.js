const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Your transport configuration embedded in the script
const deployConfig = {
  destination: "GW_SSO",
  bspApplication: "ZBILLING_MON",
  bspApplicationText: "Billing Monitor Dashboard",
  package: "ZCRM",
  transportRequest: "GWDK903062"  // Update this with your current transport request
};

console.log('=====================================');
console.log('SAP BTP Deployment Script');
console.log('=====================================');
console.log('Transport Configuration:');
console.log(`  Transport Request: ${deployConfig.transportRequest}`);
console.log(`  Package: ${deployConfig.package}`);
console.log(`  Destination: ${deployConfig.destination}`);
console.log(`  BSP Application: ${deployConfig.bspApplication}`);
console.log(`  Description: ${deployConfig.bspApplicationText}`);
console.log('=====================================\n');

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✓ Found: ${description} at ${filePath}`);
    return true;
  } else {
    console.log(`✗ Missing: ${description} at ${filePath}`);
    return false;
  }
}

function listDirectoryContents(dirPath, description) {
  try {
    if (fs.existsSync(dirPath)) {
      console.log(`\n${description}:`);
      const files = fs.readdirSync(dirPath);
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        const type = stats.isDirectory() ? '[DIR]' : '[FILE]';
        console.log(`  ${type} ${file}`);
      });
    } else {
      console.log(`\n${description}: Directory does not exist`);
    }
  } catch (error) {
    console.log(`\nError listing ${description}: ${error.message}`);
  }
}

try {
  console.log('Step 1: Checking build artifacts...');
  
  // Check if the build output exists
  const distPath = path.join(__dirname, 'BillingMonitor', 'dist');
  const distExists = checkFileExists(distPath, 'Vue build output (dist folder)');

  // Check for zip file in possible locations
  const zipPaths = [
    path.join(__dirname, 'BillingMonitor', 'BillingMonitor-content.zip'),
    path.join(__dirname, 'BillingMonitor-content.zip'),
    path.join(__dirname, 'BillingMonitor', '../BillingMonitor-content.zip')
  ];
  
  let zipExists = false;
  let zipPath = '';
  
  for (const zip of zipPaths) {
    if (fs.existsSync(zip)) {
      zipExists = true;
      zipPath = zip;
      console.log(`✓ Found: Deployment zip at ${zip}`);
      break;
    }
  }
  
  if (!distExists && !zipExists) {
    throw new Error('Neither build output nor zip file found. Build may have failed.');
  }
  
  // Show directory structure for debugging
  listDirectoryContents(__dirname, 'Project Root Contents');
  listDirectoryContents(path.join(__dirname, 'BillingMonitor'), 'BillingMonitor Contents');
  if (distExists) {
    listDirectoryContents(distPath, 'dist Contents');
  }
  
  console.log('\nStep 2: Attempting automated deployment...');
  
  // Deployment methods to try
  const deploymentMethods = [
    {
      name: 'Fiori CLI with config file',
      command: 'npx fiori deploy --config ui5-deploy.yaml',
      requiresConfigFile: true
    },
    {
      name: 'SAP UX Tooling with config file', 
      command: 'npx @sap/ux-ui5-tooling deploy --config ui5-deploy.yaml',
      requiresConfigFile: true
    },
    {
      name: 'Fiori CLI with direct parameters',
      command: `npx fiori deploy --destination ${deployConfig.destination} --transport ${deployConfig.transportRequest} --package ${deployConfig.package} --name ${deployConfig.bspApplication} --description "${deployConfig.bspApplicationText}" --source BillingMonitor/dist`,
      requiresConfigFile: false
    },
    {
      name: 'CF HTML5 Push (basic)',
      command: `cf html5-push --destination ${deployConfig.destination} --name ${deployConfig.bspApplication}`,
      requiresConfigFile: false
    }
  ];
  
  let deploymentSuccessful = false;
  
  for (let i = 0; i < deploymentMethods.length; i++) {
    const method = deploymentMethods[i];
    
    try {
      console.log(`\n--- Method ${i + 1}: ${method.name} ---`);
      
      // Check if config file is needed and exists
      if (method.requiresConfigFile) {
        const configExists = checkFileExists('ui5-deploy.yaml', 'UI5 deployment config');
        if (!configExists) {
          console.log(`Skipping ${method.name} - config file required but not found`);
          continue;
        }
      }
      
      console.log(`Executing: ${method.command}`);
      execSync(method.command, { stdio: 'inherit', cwd: __dirname });
      
      console.log(`\n🎉 Deployment successful using ${method.name}!`);
      console.log(`📦 Package: ${deployConfig.package}`);
      console.log(`🚚 Transport: ${deployConfig.transportRequest}`);
      console.log(`📱 BSP App: ${deployConfig.bspApplication}`);
      
      deploymentSuccessful = true;
      break;
      
    } catch (error) {
      console.log(`❌ ${method.name} failed: ${error.message}`);
      console.log('Trying next method...\n');
      continue;
    }
  }
  
  if (!deploymentSuccessful) {
    console.log('\n=====================================');
    console.log('MANUAL DEPLOYMENT REQUIRED');
    console.log('=====================================');
    console.log('All automated deployment methods failed.');
    console.log('Please use the BAS deployment interface:\n');
    
    console.log('Option 1 - BAS Right-Click Deployment:');
    console.log('1. Right-click on your project in BAS file explorer');
    console.log('2. Select "Deploy" or "Deploy to SAP System"');
    console.log('3. Enter these exact values:');
    console.log(`   • Destination: ${deployConfig.destination}`);
    console.log(`   • Transport Request: ${deployConfig.transportRequest}`);
    console.log(`   • Package: ${deployConfig.package}`);
    console.log(`   • BSP Application: ${deployConfig.bspApplication}`);
    console.log(`   • Description: ${deployConfig.bspApplicationText}`);
    console.log('   • Source: BillingMonitor/dist\n');

    console.log('Option 2 - Upload Zip File:');
    console.log('1. Use the BAS deployment wizard');
    console.log('2. Upload the zip file: BillingMonitor/BillingMonitor-content.zip');
    console.log(`3. Specify transport: ${deployConfig.transportRequest}`);
    console.log(`4. Specify package: ${deployConfig.package}\n`);
    
    console.log('Option 3 - Command Line (if CF is configured):');
    console.log('1. First login to CF: cf login');
    console.log(`2. Then deploy: cf html5-push --destination ${deployConfig.destination} --name ${deployConfig.bspApplication}`);
    
    console.log('\n=====================================');
    console.log('Available Files for Deployment:');
    console.log('=====================================');
    
    // Show available deployment files
    if (zipExists) {
      console.log(`✓ Zip file: ${zipPath}`);
    }
    if (distExists) {
      console.log(`✓ Source folder: ${distPath}`);
      const distFiles = fs.readdirSync(distPath);
      console.log('  Contains:');
      distFiles.slice(0, 10).forEach(file => console.log(`    - ${file}`));
      if (distFiles.length > 10) {
        console.log(`    ... and ${distFiles.length - 10} more files`);
      }
    }
  }
  
} catch (error) {
  console.error('\n❌ Deployment preparation failed:', error.message);
  
  // Debug information
  console.log('\n=====================================');
  console.log('DEBUG INFORMATION');
  console.log('=====================================');
  
  listDirectoryContents(__dirname, 'Project Root');
  listDirectoryContents(path.join(__dirname, 'BillingMonitor'), 'BillingMonitor Folder');
  
  console.log('\nSearch for zip files:');
  try {
    const findZip = execSync('find . -name "*content.zip" -type f 2>/dev/null || echo "No zip files found"', { encoding: 'utf8' });
    console.log(findZip);
  } catch (e) {
    console.log('Cannot search for zip files');
  }
  
  process.exit(1);
}