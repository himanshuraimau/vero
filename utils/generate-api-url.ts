import Constants from 'expo-constants';

export function generateApiUrl(relativePath: string): string {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }

  const experienceUrl = Constants.experienceUrl;
  if (experienceUrl) {
    const origin = experienceUrl.replace(/^exp:\/\//, 'http://');
    return `${origin}${path}`;
  }

  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    const base = process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, '');
    return `${base}${path}`;
  }

  return `http://localhost:8081${path}`;
}
