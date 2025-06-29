import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ScheduledMessage {
  id: number;
  message: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  time: string; // HH:MM format
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  private supabase: SupabaseClient;
  private tableName: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.tableName = process.env.SUPABASE_TABLE_NAME || 'notifications'; // Default to notifications

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`Using table: ${this.tableName}`);
  }

  async getActiveScheduledMessages(): Promise<ScheduledMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch active scheduled messages:', error);
      console.error(`Make sure table '${this.tableName}' exists in your Supabase database`);
      throw error;
    }
  }

  async getScheduledMessagesForDay(dayOfWeek: number): Promise<ScheduledMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
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
        .from(this.tableName)
        .insert([{
          message: message.message,
          day_of_week: message.day_of_week,
          time: message.time,
          is_active: message.is_active ?? true,
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
        .from(this.tableName)
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

  async getAllScheduledMessages(): Promise<ScheduledMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch all scheduled messages:', error);
      throw error;
    }
  }

  async getScheduledMessageById(id: number): Promise<ScheduledMessage | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch scheduled message by ID:', error);
      throw error;
    }
  }

  async deleteScheduledMessage(id: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete scheduled message:', error);
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
}
