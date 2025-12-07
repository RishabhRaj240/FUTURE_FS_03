# Environment Setup Guide

## Backend Configuration Issue

If you're seeing "Failed to fetch" errors, it means your Supabase environment variables are not configured.

## Quick Fix Steps

1. **Create a `.env` file** in the root directory of this project

2. **Add your Supabase credentials**:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   ```

3. **Get your Supabase credentials**:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project (or create a new one)
   - Go to **Settings** → **API**
   - Copy the **Project URL** (this is your `VITE_SUPABASE_URL`)
   - Copy the **anon/public** key (this is your `VITE_SUPABASE_PUBLISHABLE_KEY`)

4. **Restart your development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Example `.env` file

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example
```

## Troubleshooting

### Still getting "Failed to fetch"?

1. **Check your `.env` file exists** in the root directory (same level as `package.json`)

2. **Verify the variable names** are exactly:
   - `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (not `SUPABASE_KEY`)

3. **Restart your dev server** - Vite only reads env variables on startup

4. **Check browser console** for more detailed error messages

5. **Verify Supabase project is active** - Make sure your Supabase project is not paused

6. **Check network tab** - Open browser DevTools → Network tab to see the actual request/response

## Security Note

- Never commit your `.env` file to version control
- The `.env` file should already be in `.gitignore`
- Use `.env.example` as a template (without real credentials)

## Need Help?

If you continue to experience issues:
1. Check the browser console for detailed error messages
2. Verify your Supabase project is running and accessible
3. Ensure your internet connection is stable
4. Check if there are any CORS issues in the browser console

