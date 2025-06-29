import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ScheduledMessage {
  id: number;
  message: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  time: string; // HH:MM format
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getActiveScheduledMessages(): Promise<ScheduledMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications') // Using your actual table name
        .select('*')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch active scheduled messages:', error);
      throw error;
    }
  }

  async getScheduledMessagesForDay(dayOfWeek: number): Promise<ScheduledMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications') // Using your actual table name
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch scheduled messages for day:', error);
      throw error;
    }
  }

  async createScheduledMessage(message: Omit<ScheduledMessage, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduledMessage> {
    try {
      const { data, error } = await this.supabase
        .from('scheduled_messages') // Replace with your actual table name
        .insert([{
          ...message,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create scheduled message:', error);
      throw error;
    }
  }

  async updateScheduledMessage(id: number, updates: Partial<ScheduledMessage>): Promise<ScheduledMessage> {
    try {
      const { data, error } = await this.supabase
        .from('scheduled_messages') // Replace with your actual table name
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update scheduled message:', error);
      throw error;
    }
  }

  // Add Edge Function trigger for weekly notifications
  async triggerWeeklyNotification(): Promise<void> {
    try {
      const { data, error } = await this.supabase.functions.invoke('weekly-notification', {
        body: { 
          trigger: 'manual',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        throw error;
      }

      console.log('Weekly notification triggered via Supabase Edge Function');
    } catch (error) {
      console.error('Failed to trigger weekly notification:', error);
      throw error;
    }
  }

  // Create a notification log entry
  async createNotificationLog(messageId: number, status: 'sent' | 'failed', error?: string): Promise<void> {
    try {
      const { error: insertError } = await this.supabase
        .from('notification_logs') // Consider creating this table
        .insert([{
          message_id: messageId,
          status,
          error_message: error,
          sent_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Failed to log notification:', insertError);
      }
    } catch (error) {
      console.error('Failed to create notification log:', error);
    }
  }

  async logNotificationSent(messageId: number): Promise<void> {
    try {
      // You might want to create a separate logs table for this
      console.log(`Notification sent for message ID: ${messageId}`);
    } catch (error) {
      console.error('Failed to log notification:', error);
      throw error;
    }
  }
}
