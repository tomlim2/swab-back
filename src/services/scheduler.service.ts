import * as cron from 'node-cron';
import { SlackService } from './slack.service';
import { SupabaseService, ScheduledMessage } from './supabase.service';

export class NotificationScheduler {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(
    private slackService: SlackService,
    private supabaseService: SupabaseService
  ) {}

  async initializeScheduler(): Promise<void> {
    try {
      console.log('Initializing scheduler with database messages...');
      
      // Get all active scheduled messages
      const messages = await this.supabaseService.getActiveScheduledMessages();
      
      // Schedule each message
      for (const message of messages) {
        this.scheduleMessage(message);
      }
      
      console.log(`Scheduled ${messages.length} messages`);
    } catch (error) {
      console.error('Failed to initialize scheduler:', error);
      throw error;
    }
  }

  scheduleMessage(message: ScheduledMessage): void {
    try {
      // Convert time to cron format (minute hour * * day_of_week)
      const [hour, minute] = message.time.split(':');
      const cronExpression = `${minute} ${hour} * * ${message.day_of_week}`;
      
      const jobKey = `message_${message.id}`;
      
      // Remove existing job if it exists
      if (this.scheduledJobs.has(jobKey)) {
        this.scheduledJobs.get(jobKey)?.stop();
      }
      
      // Create new scheduled job
      const task = cron.schedule(cronExpression, async () => {
        try {
          console.log(`Sending scheduled message: ${message.id}`);
          
          await this.slackService.sendMessage({
            text: message.message,
            username: 'SWAB Bot',
            icon_emoji: ':clock1:'
          });
          
          await this.supabaseService.createNotificationLog(message.id, 'sent');
          console.log(`Scheduled message sent successfully: ${message.id}`);
          
        } catch (error) {
          console.error(`Failed to send scheduled message ${message.id}:`, error);
          await this.supabaseService.createNotificationLog(
            message.id, 
            'failed', 
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      });
      
      this.scheduledJobs.set(jobKey, task);
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`Scheduled message "${message.message}" for ${dayNames[message.day_of_week]} at ${message.time}`);
      
    } catch (error) {
      console.error(`Failed to schedule message ${message.id}:`, error);
    }
  }

  unscheduleMessage(messageId: number): void {
    const jobKey = `message_${messageId}`;
    const task = this.scheduledJobs.get(jobKey);
    
    if (task) {
      task.stop();
      this.scheduledJobs.delete(jobKey);
      console.log(`Unscheduled message: ${messageId}`);
    }
  }

  async refreshScheduler(): Promise<void> {
    try {
      console.log('Refreshing scheduler...');
      
      // Stop all current jobs
      for (const [key, task] of this.scheduledJobs) {
        task.stop();
      }
      this.scheduledJobs.clear();
      
      // Reinitialize with current database state
      await this.initializeScheduler();
      
    } catch (error) {
      console.error('Failed to refresh scheduler:', error);
      throw error;
    }
  }

  async sendTestMessage(): Promise<void> {
    try {
      await this.slackService.sendMessage({
        text: 'Test message from SWAB Server! 🚀',
        username: 'SWAB Bot',
        icon_emoji: ':robot_face:'
      });
      
      console.log('Test message sent successfully');
    } catch (error) {
      console.error('Failed to send test message:', error);
      throw error;
    }
  }

  getScheduledJobsCount(): number {
    return this.scheduledJobs.size;
  }

  listScheduledJobs(): string[] {
    return Array.from(this.scheduledJobs.keys());
  }
}
