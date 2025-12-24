#!/usr/bin/env node
/**
 * Comprehensive System Audit Script
 * Ensures single source of truth across PM2, servers, agents, workers, Prisma, Nginx
 * 
 * Usage:
 *   node scripts/system-audit.mjs
 *   node scripts/system-audit.mjs --fix  # Attempts to fix issues
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const FIX_MODE = process.argv.includes('--fix');

const VPS_HOST = process.env.VPS_HOST || 'root@77.243.85.8';
const VPS_PATH = process.env.VPS_PATH || '/var/www/alessa-ordering';
const EXPECTED_PORT = 4000;
const EXPECTED_PM2_NAME = 'alessa-ordering';
const EXPECTED_NAMESPACE = 'alessa';

console.log('🔍 Alessa Ordering System Audit');
console.log('================================\n');
console.log(`VPS: ${VPS_HOST}`);
console.log(`Path: ${VPS_PATH}`);
console.log(`Expected Port: ${EXPECTED_PORT}`);
console.log(`Expected PM2: ${EXPECTED_NAMESPACE}:${EXPECTED_PM2_NAME}\n`);

const issues = [];
const warnings = [];

function addIssue(message, fixCommand = null) {
  issues.push({ message, fixCommand });
  console.error(`❌ ISSUE: ${message}`);
  if (fixCommand && FIX_MODE) {
    console.log(`   → Fixing: ${fixCommand}`);
  }
}

function addWarning(message) {
  warnings.push({ message });
  console.warn(`⚠️  WARNING: ${message}`);
}

function runCommand(command, remote = false) {
  try {
    const fullCommand = remote ? `ssh ${VPS_HOST} "${command}"` : command;
    return execSync(fullCommand, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    return null;
  }
}

// 1. Check PM2 Configuration
console.log('1️⃣  Checking PM2 Configuration...');
try {
  const pm2List = runCommand('pm2 list --no-color', true);
  if (!pm2List) {
    addIssue('PM2 not accessible on VPS', 'ssh ${VPS_HOST} "pm2 list"');
  } else {
    // Check for alessa-ordering process
    if (!pm2List.includes(EXPECTED_PM2_NAME)) {
      addIssue(`PM2 process "${EXPECTED_PM2_NAME}" not found`, `ssh ${VPS_HOST} "cd ${VPS_PATH} && pm2 start ecosystem.config.js"`);
    } else {
      // Check namespace
      if (!pm2List.includes(`${EXPECTED_NAMESPACE}:${EXPECTED_PM2_NAME}`)) {
        addWarning(`PM2 process not in "${EXPECTED_NAMESPACE}" namespace`);
      }
      
      // Check port
      const pm2Info = runCommand(`pm2 info ${EXPECTED_NAMESPACE}:${EXPECTED_PM2_NAME} --no-color`, true);
      if (pm2Info && !pm2Info.includes(`PORT: ${EXPECTED_PORT}`) && !pm2Info.includes(`PORT=${EXPECTED_PORT}`)) {
        addIssue(`PM2 process not using port ${EXPECTED_PORT}`, `Check ecosystem.config.js`);
      }
      
      // Check status
      if (pm2Info) {
        if (pm2Info.includes('status: errored') || pm2Info.includes('status: stopped')) {
          addIssue('PM2 process is not running', `ssh ${VPS_HOST} "pm2 restart ${EXPECTED_NAMESPACE}:${EXPECTED_PM2_NAME}"`);
        }
      }
    }
  }
} catch (error) {
  addIssue('Failed to check PM2 configuration', null);
}

// 2. Check Ecosystem Config
console.log('\n2️⃣  Checking Ecosystem Config...');
try {
  const ecosystemContent = readFileSync('./ecosystem.config.js', 'utf-8');
  if (!ecosystemContent.includes(`PORT: ${EXPECTED_PORT}`)) {
    addIssue(`ecosystem.config.js does not specify port ${EXPECTED_PORT}`);
  }
  if (!ecosystemContent.includes(`name: '${EXPECTED_PM2_NAME}'`)) {
    addIssue(`ecosystem.config.js does not specify name "${EXPECTED_PM2_NAME}"`);
  }
  if (!ecosystemContent.includes(`namespace: '${EXPECTED_NAMESPACE}'`)) {
    addWarning(`ecosystem.config.js does not specify namespace "${EXPECTED_NAMESPACE}"`);
  }
  if (!ecosystemContent.includes(`cwd: '${VPS_PATH}'`)) {
    addWarning(`ecosystem.config.js cwd does not match VPS path "${VPS_PATH}"`);
  }
} catch (error) {
  addIssue('ecosystem.config.js not found or unreadable');
}

// 3. Check Port Usage
console.log('\n3️⃣  Checking Port Usage...');
try {
  const portCheck = runCommand(`netstat -tuln | grep :${EXPECTED_PORT} || ss -tuln | grep :${EXPECTED_PORT}`, true);
  if (!portCheck) {
    addIssue(`Port ${EXPECTED_PORT} not in use - application may not be running`);
  } else {
    // Check if it's PM2 using the port
    if (!portCheck.includes('PM2')) {
      addWarning(`Port ${EXPECTED_PORT} is in use but may not be by PM2 process`);
    }
  }
} catch (error) {
  addWarning('Could not check port usage');
}

// 4. Check Nginx Configuration
console.log('\n4️⃣  Checking Nginx Configuration...');
try {
  const nginxConfig = runCommand('cat /etc/nginx/sites-enabled/*.conf 2>/dev/null | grep -A 10 "alessa\|alessacloud"', true);
  if (nginxConfig) {
    // Check if it proxies to correct port
    if (!nginxConfig.includes(`:${EXPECTED_PORT}`) && !nginxConfig.includes(`localhost:${EXPECTED_PORT}`)) {
      addWarning('Nginx configuration may not proxy to correct port');
    }
  } else {
    addWarning('Could not verify Nginx configuration for Alessa');
  }
} catch (error) {
  addWarning('Could not check Nginx configuration');
}

// 5. Check Prisma Connection
console.log('\n5️⃣  Checking Prisma Configuration...');
try {
  // Check if .env exists on VPS
  const envCheck = runCommand(`test -f ${VPS_PATH}/.env && echo "exists"`, true);
  if (!envCheck || !envCheck.includes('exists')) {
    addIssue('.env file not found on VPS', `Ensure .env file exists at ${VPS_PATH}/.env`);
  }
  
  // Check DATABASE_URL
  const dbUrl = runCommand(`grep DATABASE_URL ${VPS_PATH}/.env 2>/dev/null | cut -d'=' -f2-`, true);
  if (!dbUrl || dbUrl.trim().length === 0) {
    addIssue('DATABASE_URL not found in .env file');
  }
} catch (error) {
  addWarning('Could not check Prisma configuration');
}

// 6. Check Git Status
console.log('\n6️⃣  Checking Git Status...');
try {
  const gitStatus = runCommand(`cd ${VPS_PATH} && git status --short`, true);
  if (gitStatus && gitStatus.trim().length > 0) {
    addWarning('Uncommitted changes on VPS - system may not be in sync');
  }
  
  // Check current branch
  const gitBranch = runCommand(`cd ${VPS_PATH} && git branch --show-current`, true);
  if (gitBranch && !gitBranch.trim().includes('main') && !gitBranch.trim().includes('master')) {
    addWarning(`VPS is on branch "${gitBranch.trim()}" instead of main/master`);
  }
} catch (error) {
  addWarning('Could not check git status');
}

// 7. Check Node Version
console.log('\n7️⃣  Checking Node Version...');
try {
  const nodeVersion = runCommand('node --version', true);
  if (nodeVersion) {
    console.log(`   Node version: ${nodeVersion.trim()}`);
  } else {
    addWarning('Could not determine Node version on VPS');
  }
} catch (error) {
  addWarning('Could not check Node version');
}

// 8. Check Application Health
console.log('\n8️⃣  Checking Application Health...');
try {
  const healthCheck = runCommand(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${EXPECTED_PORT}/order`, true);
  if (healthCheck && healthCheck.trim() === '200') {
    console.log('   ✅ Application responding on port 4000');
  } else {
    addIssue(`Application not responding correctly (HTTP ${healthCheck?.trim() || 'unknown'})`);
  }
} catch (error) {
  addIssue('Could not check application health');
}

// Summary
console.log('\n================================');
console.log('📊 Audit Summary');
console.log('================================\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ System is healthy - all checks passed!\n');
  process.exit(0);
}

if (issues.length > 0) {
  console.log(`❌ ${issues.length} issue(s) found:\n`);
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue.message}`);
    if (issue.fixCommand) {
      console.log(`      Fix: ${issue.fixCommand}`);
    }
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} warning(s):\n`);
  warnings.forEach((warning, i) => {
    console.log(`   ${i + 1}. ${warning.message}`);
  });
  console.log('');
}

if (FIX_MODE && issues.length > 0) {
  console.log('🔧 Fix mode: Attempting to fix issues...\n');
  // Fixes would be implemented here
  console.log('⚠️  Automatic fixes not yet implemented. Please fix manually.\n');
}

console.log('📝 Recommendations:');
console.log('   1. Ensure all changes are committed to git');
console.log('   2. Deploy via: ./deploy.sh');
console.log('   3. Verify: ssh ${VPS_HOST} "pm2 logs ${EXPECTED_NAMESPACE}:${EXPECTED_PM2_NAME} --lines 50"');
console.log('   4. Test: curl http://localhost:${EXPECTED_PORT}/order\n');

process.exit(issues.length > 0 ? 1 : 0);

