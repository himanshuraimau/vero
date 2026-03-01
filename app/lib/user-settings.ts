import Storage from 'expo-sqlite/kv-store';

const OPENAI_KEY_KEY = 'user_openai_api_key';

export async function getUserOpenAIKey(): Promise<string | null> {
  try {
    const value = await Storage.getItem(OPENAI_KEY_KEY);
    return value ?? null;
  } catch (err) {
    console.error('[UserSettings] getUserOpenAIKey failed', err);
    return null;
  }
}

export async function setUserOpenAIKey(key: string): Promise<void> {
  try {
    await Storage.setItem(OPENAI_KEY_KEY, key);
  } catch (err) {
    console.error('[UserSettings] setUserOpenAIKey failed', err);
    throw err;
  }
}

export async function deleteUserOpenAIKey(): Promise<void> {
  try {
    await Storage.removeItem(OPENAI_KEY_KEY);
  } catch (err) {
    console.error('[UserSettings] deleteUserOpenAIKey failed', err);
    throw err;
  }
}

