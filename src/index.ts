import dotenv from 'dotenv';
import { SlackService } from './services/slack.service';
import { SupabaseService } from './services/supabase.service';
import { NotificationScheduler } from './services/scheduler.service';

dotenv.config();

async function main() {
  try {
    console.log('Starting SWAB Server...');
    
    // Initialize services
    const supabaseService = new SupabaseService();
    const slackService = new SlackService();
    const scheduler = new NotificationScheduler(slackService, supabaseService);
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
      console.log('Running test mode...');
      await scheduler.sendTestMessage();
      console.log('Test message sent! Check your Slack channel.');
      process.exit(0);
    }
    
    if (args.includes('--refresh')) {
      console.log('Refreshing scheduler...');
      await scheduler.refreshScheduler();
      console.log('Scheduler refreshed with latest database messages.');
      process.exit(0);
    }
    
    if (args.includes('--setup-supabase')) {
      console.log('Setting up Supabase weekly notifications...');
      await supabaseService.triggerWeeklyNotification();
      console.log('Supabase weekly notifications configured!');
      process.exit(0);
    }
    
    if (args.includes('--local-only')) {
      console.log('Running in local-only mode...');
      await scheduler.initializeScheduler();
    } else {
      console.log('Using hybrid mode (Supabase + local scheduling)...');
      // Light local scheduling for immediate/daily tasks
      await scheduler.initializeScheduler();
    }
    
    console.log('SWAB Server is running...');
    console.log(`Active scheduled jobs: ${scheduler.getScheduledJobsCount()}`);
    console.log('\nAvailable commands:');
    console.log('- npm run dev -- --test : Send a test message');
    console.log('- npm run dev -- --setup-supabase : Setup Supabase weekly notifications');
    console.log('- npm run dev -- --local-only : Use only local scheduling');
    console.log('- Press Ctrl+C to stop the server');
    
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
