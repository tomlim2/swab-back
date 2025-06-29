import dotenv from 'dotenv';
import { App } from './app';

dotenv.config();

async function main() {
  try {
    console.log('Starting SWAB Server...');
    
    const app = new App();
    const scheduler = app.getScheduler();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
      console.log('Running test mode...');
      await scheduler.sendTestMessage();
      console.log('Test message sent! Check your Slack channel.');
      process.exit(0);
    }
    
    if (args.includes('--validate-webhook')) {
      console.log('Validating Slack webhook...');
      try {
        await scheduler.sendTestMessage();
        console.log('✅ Webhook is working correctly!');
      } catch (error) {
        console.log('❌ Webhook validation failed!');
      }
      process.exit(0);
    }
    
    if (args.includes('--refresh')) {
      console.log('This will be handled by the API server...');
    }
    
    // Start the server with API and scheduler
    await app.start();
    
    console.log('\nAvailable commands:');
    console.log('- npm run dev -- --test : Send a test message');
    console.log('- npm run dev -- --validate-webhook : Test webhook only');
    console.log('- curl http://localhost:3000/api/notifications : View all notifications');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\nShutting down SWAB Server...');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
