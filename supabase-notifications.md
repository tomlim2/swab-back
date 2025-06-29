# Supabase Weekly Notification Methods

## Method 1: Edge Functions (Recommended)

### Create Edge Function:
```bash
# In your Supabase project directory
supabase functions new weekly-notification
```

### Edge Function Code (Modern Deno - for Supabase Edge Functions):
```typescript
// supabase/functions/weekly-notification/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL')!;

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentTime = today.toTimeString().slice(0, 5); // HH:MM format

    console.log(`Checking notifications for day ${dayOfWeek} at ${currentTime}`);

    // Get notifications for today that are due
    const { data: notifications, error } = await supabase
      .from('weekly_notifications')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .lte('time', currentTime); // Only notifications due by now

    if (error) {
      console.error('Database error:', error);
      return new Response(`Database error: ${error.message}`, { status: 500 });
    }

    console.log(`Found ${notifications.length} notifications to send`);

    // Send each notification to Slack
    const results = [];
    for (const notification of notifications) {
      try {
        const payload = {
          text: notification.message,
          username: 'SWAB Bot',
          icon_emoji: ':calendar:'
        };

        const response = await fetch(SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Slack API error: ${response.status}`);
        }

        // Log the notification as sent
        await supabase
          .from('notification_logs')
          .insert([{
            message_id: notification.id,
            status: 'sent',
            sent_at: new Date().toISOString()
          }]);

        results.push({
          id: notification.id,
          message: notification.message,
          status: 'sent'
        });

        console.log(`Sent notification ${notification.id}: ${notification.message}`);

      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);
        
        // Log the failure
        await supabase
          .from('notification_logs')
          .insert([{
            message_id: notification.id,
            status: 'failed',
            error_message: error.message,
            sent_at: new Date().toISOString()
          }]);

        results.push({
          id: notification.id,
          message: notification.message,
          status: 'failed',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results: results
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
```

### Manual Trigger Function (for testing):
```typescript
// supabase/functions/send-notification/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL')!;

Deno.serve(async (req: Request) => {
  if (req.method === 'POST') {
    try {
      const { message, dayOfWeek, time } = await req.json();

      // Validation
      const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (!validDays.includes(dayOfWeek)) {
        return new Response('Invalid day of the week', { status: 400 });
      }

      const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timePattern.test(time)) {
        return new Response('Invalid time format. Use HH:mm', { status: 400 });
      }

      // Send to Slack
      const payload = {
        text: `Manual Notification: ${message} (scheduled for ${dayOfWeek} at ${time})`,
        username: 'SWAB Bot',
        icon_emoji: ':rocket:'
      };

      const response = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return new Response('Failed to send notification', { status: 500 });
      }

      return new Response('Notification sent successfully', { status: 200 });

    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
```

### Deploy Functions:
```bash
# Deploy the weekly notification function
supabase functions deploy weekly-notification

# Deploy the manual trigger function
supabase functions deploy send-notification
```

### Test Functions:
```bash
# Test weekly notification function
curl -X POST https://your-project.supabase.co/functions/v1/weekly-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test manual notification
curl -X POST https://your-project.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test message","dayOfWeek":"Monday","time":"14:30"}'
```

## Comparison:

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| Edge Functions | Serverless, scalable, TypeScript | Requires deployment | Complex logic |
| pg_cron | Built-in, reliable, SQL-based | Limited to SQL | Simple schedules |
| Triggers | Real-time, automatic | Can be complex | Event-driven |
| Your Server | Full control, debugging | Requires server uptime | Development |

## Recommended Setup:

1. **Development**: Use your local server (`npm run dev`)
2. **Production**: Use Edge Functions for reliability
3. **Simple cases**: Use pg_cron for basic scheduling

## Important Notes:

### For Edge Functions (Deno):
- Use Deno imports: `https://deno.land/std/http/server.ts`
- Deploy with Supabase CLI
- Environment variables set in Supabase Dashboard

### For Node.js Server:
- Use npm imports: `import express from 'express'`
- Your existing TypeScript setup works
- Environment variables in `.env` file

### Don't mix Deno and Node.js imports!
- Edge Functions = Deno runtime
- Your server = Node.js runtime
- They have different import systems

## Environment Variables for Edge Functions:
```bash
# Set in Supabase Dashboard > Settings > Edge Functions
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## Key Updates:
- ✅ Uses modern `Deno.serve()` syntax
- ✅ Uses `jsr:` imports (new Deno registry)
- ✅ Proper error handling and logging
- ✅ Validates time format
- ✅ Logs all notifications to database
- ✅ Returns detailed response with results
