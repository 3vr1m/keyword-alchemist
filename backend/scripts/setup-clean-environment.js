#!/usr/bin/env node

/**
 * Clean Environment Setup Script
 * 
 * This script:
 * 1. Clears all analytics data (preserves database structure)
 * 2. Deletes all existing access keys
 * 3. Creates a new admin key with 700 credits
 * 
 * Run: node backend/scripts/setup-clean-environment.js
 */

const database = require('../src/utils/database');
const keyGenerator = require('../src/utils/keyGenerator');

async function setupCleanEnvironment() {
  console.log('🚀 Setting up clean environment for Keyword Alchemist...\n');

  try {
    // Step 1: Clear analytics data
    console.log('📊 Clearing analytics data...');
    await database.clearAnalyticsData();
    console.log('✅ Analytics data cleared successfully\n');

    // Step 2: Delete all access keys
    console.log('🔑 Deleting all existing access keys...');
    await database.deleteAllKeys();
    console.log('✅ All access keys deleted successfully\n');

    // Step 3: Create new admin key with 700 credits
    console.log('🆕 Creating new admin key with 700 credits...');
    const adminKey = await keyGenerator.generateUniqueKey(database);
    await database.createAccessKey(adminKey, 'pro', 700, 'admin@keywordalchemist.com');
    
    console.log('✅ Admin key created successfully!');
    console.log('📋 Admin Key Details:');
    console.log(`   🔑 Access Key: ${adminKey}`);
    console.log(`   📧 Email: admin@keywordalchemist.com`);
    console.log(`   📦 Plan: pro`);
    console.log(`   🎯 Credits: 700`);
    console.log('');

    // Step 4: Verify the setup
    console.log('🔍 Verifying setup...');
    const keyData = await database.getAccessKey(adminKey);
    const allKeys = await database.getAllKeys();
    const analytics = await database.getAdminAnalytics();

    console.log('✅ Setup verification results:');
    console.log(`   📊 Total keys in database: ${allKeys.length}`);
    console.log(`   📈 Total analytics records: ${analytics.summary.totalKeywordAttempts}`);
    console.log(`   🎯 Admin key credits: ${keyData.credits_total - keyData.credits_used}/${keyData.credits_total}`);
    console.log('');

    console.log('🎉 Clean environment setup completed successfully!');
    console.log('💡 You can now use this key for testing purposes.');
    console.log('');
    console.log('📝 Save this key somewhere safe:');
    console.log(`   ${adminKey}`);

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  setupCleanEnvironment()
    .then(() => {
      console.log('✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupCleanEnvironment };
