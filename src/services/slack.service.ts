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
  }

  async sendMessage(message: SlackMessage): Promise<void> {
    try {
      await axios.post(this.webhookUrl, message);
      console.log('Slack message sent successfully');
    } catch (error) {
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
