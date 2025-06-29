-- Create the weekly_notifications table
CREATE TABLE IF NOT EXISTS weekly_notifications (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT
);

-- Insert sample data for testing
INSERT INTO weekly_notifications (message, day_of_week, time, is_active, user_id) VALUES
('Good morning! Time for your weekly standup 📅', 1, '09:00', true, 'user123'),
('Reminder: Weekly report due today 📊', 5, '14:30', true, 'user123'),
('Weekend prep: Don''t forget to review next week''s goals 🎯', 5, '17:00', true, 'user123');

-- Create notification_logs table for tracking
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES weekly_notifications(id),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
