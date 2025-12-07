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
   ```

## Example `.env` file

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

- Check your `.env` file exists in the root directory
- Verify variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Restart your dev server after creating/updating `.env`
- Check browser console for detailed error messages

