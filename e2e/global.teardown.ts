import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...');

  try {
    // Clean up test data
    const testDataDir = path.join(__dirname, '../test-data');
    
    try {
      await fs.rmdir(testDataDir, { recursive: true });
      console.log('🗑️  Test data directory cleaned up');
    } catch (error) {
      console.log('⚠️  Test data cleanup skipped (directory may not exist)');
    }

    // Generate final test report summary
    const resultsPath = path.join(__dirname, '../test-results');
    try {
      const files = await fs.readdir(resultsPath);
      console.log(`📊 Generated ${files.length} test result files`);
    } catch (error) {
      console.log('📊 No test results directory found');
    }

    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

export default globalTeardown;