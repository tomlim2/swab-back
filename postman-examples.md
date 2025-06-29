# Postman Configuration for SWAB Server API

## Base URL
```
http://localhost:3000
```

## 1. GET All Notifications
- **Method**: GET
- **URL**: `http://localhost:3000/api/notifications`
- **Headers**: None required
- **Body**: None

## 2. POST - Create New Notification
- **Method**: POST
- **URL**: `http://localhost:3000/api/notifications`
- **Headers**:
  - Content-Type: `application/json`
- **Body** (raw JSON):
```json
{
  "message": "Daily standup reminder 📅",
  "day_of_week": 1,
  "time": "09:00",
  "is_active": true,
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

## 3. PUT - Update Notification
- **Method**: PUT
- **URL**: `http://localhost:3000/api/notifications/1`
- **Headers**:
  - Content-Type: `application/json`
- **Body** (raw JSON):
```json
{
  "message": "Updated daily standup reminder 🔄",
  "time": "10:00"
}
```

## 4. POST - Toggle Notification Status
- **Method**: POST
- **URL**: `http://localhost:3000/api/notifications/1/toggle`
- **Headers**: None required
- **Body**: None

## 5. DELETE - Remove Notification
- **Method**: DELETE
- **URL**: `http://localhost:3000/api/notifications/1`
- **Headers**: None required
- **Body**: None

## Day of Week Values:
- 0 = Sunday
- 1 = Monday
- 2 = Tuesday
- 3 = Wednesday
- 4 = Thursday
- 5 = Friday
- 6 = Saturday

## Time Format:
Use 24-hour format: "09:00", "14:30", "17:00"

## Troubleshooting

### Common Errors:

#### 1. "Unknown error" (500 status)
- Check if your server is running: `npm run dev`
- Check server logs in terminal for detailed error
- Verify database table exists in Supabase
- Test with curl first:

```bash
# Test server is running
curl http://localhost:3000

# Test with minimal data
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"message":"test","day_of_week":1,"time":"09:00"}'
```

#### 2. Connection Refused
- Make sure server is running on port 3000
- Check if another process is using port 3000

#### 3. 404 Not Found
- Verify URL is exactly: `http://localhost:3000/api/notifications`
- Check server logs to see if routes are registered

### Debug Steps:
1. Start server: `npm run dev`
2. Check server logs for any startup errors
3. Test health endpoint: `GET http://localhost:3000`
4. Try minimal POST request with curl
5. Check Supabase table exists and is accessible

### Minimal Test Data:
```json
{
  "message": "test",
  "day_of_week": 1,
  "time": "09:00"
}
```

### Test Data with UUID (if user exists):
```json
{
  "message": "test with uuid",
  "day_of_week": 1,
  "time": "09:00",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Foreign Key Constraint Error:
If you get error `23503` (foreign key violation), it means:
- The `user_id` doesn't exist in the `users` table
- **Solution**: Omit the `user_id` field completely or create a user first

### Safe Test Data (no user_id):
```json
{
  "message": "Weekly reminder without user constraint",
  "day_of_week": 2,
  "time": "14:00",
  "is_active": true
}
```

### To fix the user constraint issue:
1. **Option 1**: Remove `user_id` from request (recommended for testing)
2. **Option 2**: Create a users table and insert a user first
3. **Option 3**: Modify the database to make `user_id` nullable or remove foreign key

### SQL to make user_id nullable (run in Supabase):
```sql
ALTER TABLE weekly_notifications ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE weekly_notifications DROP CONSTRAINT IF EXISTS weekly_notifications_user_id_fkey;
```

### Column Not Found Error (PGRST204):
If you get `Could not find the 'user_id' column`, it means:
- Your table doesn't have a `user_id` column
- **Solution**: Remove `user_id` from all requests

### Correct Test Data (matching your actual table):
```json
{
  "message": "Test notification",
  "day_of_week": 1,
  "time": "09:00",
  "is_active": true
}
```

### Your actual table structure appears to be:
- `id` (auto-generated)
- `message` (required)
- `day_of_week` (required, 0-6)
- `time` (required, HH:MM format)
- `is_active` (optional, defaults to true)
- `created_at` (auto-generated)
- `updated_at` (auto-generated)

### Working Examples:
```json
{
  "message": "Monday morning standup",
  "day_of_week": 1,
  "time": "09:00"
}
```

```json
{
  "message": "Friday wrap-up",
  "day_of_week": 5,
  "time": "17:00",
  "is_active": true
}
```
