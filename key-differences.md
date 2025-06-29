# Supabase Keys Explained

## SUPABASE_ANON_KEY vs SUPABASE_SERVICE_ROLE_KEY

### ANON Key (Anonymous/Public Key):
- **Purpose**: Client-side applications, public access
- **Permissions**: Limited by Row Level Security (RLS) policies
- **Usage**: Your Node.js server, frontend apps
- **Security**: Safe to expose in client code
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon role)

### SERVICE_ROLE Key (Admin Key):
- **Purpose**: Server-side operations, admin access
- **Permissions**: Bypasses RLS, full database access
- **Usage**: Edge Functions, backend services, migrations
- **Security**: ⚠️ Keep secret! Never expose in client code
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (service_role)

## Where to Find Them:

1. Go to your Supabase Dashboard
2. Navigate to **Settings** > **API**
3. Copy both keys:
   - **anon/public**: Use for client apps
   - **service_role**: Use for Edge Functions

## Usage in Your Project:

### Node.js Server (use ANON key):
```typescript
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY  // ✅ ANON key
)
```

### Edge Functions (use SERVICE_ROLE key):
```typescript
const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  // ✅ SERVICE_ROLE key
)
```

## Why the Difference?

- **ANON key**: Respects your database security rules (RLS)
- **SERVICE_ROLE key**: Bypasses security rules for admin operations

Edge Functions need admin access to read all notifications and create logs, so they use the SERVICE_ROLE key.

## Security Best Practices:

✅ **DO**:
- Use ANON key in your Node.js server
- Use SERVICE_ROLE key in Edge Functions
- Keep SERVICE_ROLE key in environment variables only
- Set proper RLS policies for ANON access

❌ **DON'T**:
- Expose SERVICE_ROLE key in client code
- Use SERVICE_ROLE key unnecessarily
- Commit keys to version control
