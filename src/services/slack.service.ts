import axios from 'axios';

export interface SlackMessage {
  text: string;
  username?: string;
  channel?: string;
  icon_emoji?: string;
  attachments?: any[];
}

export class SlackService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    if (!this.webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL is required');
    }
    console.log('Slack webhook URL configured:', this.webhookUrl.substring(0, 50) + '...');
  }

  /**
   * Send message to Slack using POST method
   * POST is used here because we're creating/sending a new message each time
   * (not updating an existing message)
   */
  async sendMessage(message: SlackMessage): Promise<void> {
    try {
      console.log('Sending message to Slack:', JSON.stringify(message, null, 2));
      
      // Using POST because we're creating a new Slack message
      const response = await axios.post(this.webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('Slack response status:', response.status);
      console.log('Slack response data:', response.data);
      console.log('Slack message sent successfully');
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Slack API Error:');
        console.error('Status:', error.response?.status);
        console.error('Status Text:', error.response?.statusText);
        console.error('Response Data:', error.response?.data);
        console.error('Request URL:', error.config?.url);
        
        if (error.response?.status === 404) {
          console.error('❌ Webhook URL not found (404). Please check:');
          console.error('1. Your Slack webhook URL is correct');
          console.error('2. The Slack app is still installed');
          console.error('3. The webhook hasn\'t been revoked');
        }
      } else {
        console.error('Non-Axios error:', error);
      }
      
      console.error('Failed to send Slack message:', error);
      throw error;
    }
  }

  async sendWeeklyNotification(data: any): Promise<void> {
    const message: SlackMessage = {
      text: '📊 Weekly SWAB Report',
      username: 'SWAB Bot',
      icon_emoji: ':chart_with_upwards_trend:',
      attachments: [
        {
          color: 'good',
          title: 'Weekly Summary',
          text: `Here's your weekly update from SWAB system.`,
          fields: [
            {
              title: 'Period',
              value: this.getWeekPeriod(),
              short: true
            }
          ]
        }
      ]
    };

    await this.sendMessage(message);
  }

  private getWeekPeriod(): string {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
  }
}
