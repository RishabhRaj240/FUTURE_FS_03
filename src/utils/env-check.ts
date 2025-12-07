/**
 * Utility functions to check and debug environment variables
 */

export const getEnvStatus = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  return {
    url: {
      exists: !!url,
      value: url ? `${url.substring(0, 30)}...` : undefined,
      isValid: url ? url.startsWith('https://') && url.includes('.supabase.co') : false,
    },
    key: {
      exists: !!key,
      value: key ? `${key.substring(0, 30)}...` : undefined,
      isValid: key ? key.length > 20 : false, // Basic validation
    },
    allEnvVars: {
      // Log all VITE_ prefixed vars for debugging (without sensitive values)
      ...Object.keys(import.meta.env)
        .filter(key => key.startsWith('VITE_'))
        .reduce((acc, key) => {
          const value = import.meta.env[key];
          acc[key] = value ? `${String(value).substring(0, 20)}...` : 'undefined';
          return acc;
        }, {} as Record<string, string>),
    },
  };
};

export const logEnvStatus = () => {
  if (import.meta.env.DEV) {
    const status = getEnvStatus();
    console.group('🔍 Environment Variables Status');
    console.log('URL:', status.url.exists ? '✅' : '❌', status.url.value || 'Not set');
    console.log('Key:', status.key.exists ? '✅' : '❌', status.key.value || 'Not set');
    console.log('All VITE_ vars:', status.allEnvVars);
    console.groupEnd();
  }
};

