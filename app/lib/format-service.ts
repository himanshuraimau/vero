import { generateApiUrl } from '@/utils/generate-api-url';
import { getUserOpenAIKey } from '@/app/lib/user-settings';

const LOG = '[Vero Format]';

export type QAItem = { question: string; answer: string };

export type FormatProgress = {
  status: 'idle' | 'processing' | 'done' | 'error';
  batch?: number;
  totalBatches?: number;
  message?: string;
};

export async function formatRawText(
  rawText: string,
  onProgress?: (progress: FormatProgress) => void
): Promise<QAItem[]> {
  if (__DEV__) console.log(`${LOG} formatRawText start, length=${rawText.length}`);
  onProgress?.({ status: 'processing', message: 'Sending to AI...' });

  // Prefer the user-provided key from settings; fall back to build-time
  // EXPO_PUBLIC_OPENAI_API_KEY if present. If neither is set, we use the
  // Expo Router API route instead.
  const [userKey, envKey] = await Promise.all([
    getUserOpenAIKey(),
    Promise.resolve(process.env.EXPO_PUBLIC_OPENAI_API_KEY),
  ]);
  const activeKey = userKey || envKey || null;

  if (activeKey) {
    if (__DEV__) {
      console.log(
        `${LOG} using direct OpenAI call (source=${userKey ? 'user-settings' : 'env'})`
      );
    }
    return formatWithOpenAI(rawText, activeKey, onProgress);
  }

  // Default: call the Expo Router API route (works when Metro is running
  // or when you have deployed the route and set EXPO_PUBLIC_API_BASE_URL).
  return formatViaApiRoute(rawText, onProgress);
}

async function formatViaApiRoute(
  rawText: string,
  onProgress?: (progress: FormatProgress) => void
): Promise<QAItem[]> {
  const url = generateApiUrl('/api/format');
  if (__DEV__) console.log(`${LOG} POST ${url}`);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText }),
    });
  } catch (networkErr) {
    const msg =
      !__DEV__ && url.includes('localhost')
        ? 'Network error. In standalone builds, set EXPO_PUBLIC_API_BASE_URL to your hosted API URL and rebuild.'
        : `Network error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`;
    console.error(`${LOG} fetch failed`, networkErr);
    onProgress?.({ status: 'error', message: msg });
    throw new Error(msg);
  }

  if (__DEV__) console.log(`${LOG} response status=${res.status}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    console.error(`${LOG} request failed`, res.status, err);
    onProgress?.({ status: 'error', message: err.error ?? 'Request failed' });
    throw new Error(err.error ?? 'Format failed');
  }

  const data = (await res.json()) as { items?: QAItem[] };
  const items = data.items ?? [];
  if (__DEV__) console.log(`${LOG} got ${items.length} Q&A pairs`);

  onProgress?.({ status: 'done', message: `Converted ${items.length} Q&A pairs` });
  return items;
}

async function formatWithOpenAI(
  rawText: string,
  apiKey: string,
  onProgress?: (progress: FormatProgress) => void
): Promise<QAItem[]> {
  const systemPrompt =
    'You are a formatter. Given text that already contains questions and answers, ' +
    'return ONLY a JSON array of objects with shape {\"question\": string, \"answer\": string}. ' +
    'Preserve the original wording as much as possible. Do not include any extra text.';

  const userPrompt =
    'Extract question–answer pairs from the following text. ' +
    'Return ONLY a JSON array (no markdown, no explanation) with each element like:\n' +
    '{\"question\": \"...\", \"answer\": \"...\"}.\n\n' +
    rawText;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message ?? `OpenAI request failed (${res.status})`;
    console.error(`${LOG} OpenAI request failed`, res.status, errBody);
    onProgress?.({ status: 'error', message: msg });
    throw new Error(msg);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content ?? '';
  if (__DEV__) console.log(`${LOG} OpenAI raw content length=${content.length}`);

  let items: QAItem[] = [];
  try {
    const parsed = JSON.parse(content) as unknown;
    if (Array.isArray(parsed)) {
      items = parsed
        .filter(
          (x): x is { question: unknown; answer: unknown } =>
            x && typeof x === 'object' && 'question' in x && 'answer' in x
        )
        .map((x) => ({
          question: String(x.question),
          answer: String(x.answer),
        }));
    } else {
      throw new Error('Expected a JSON array from OpenAI');
    }
  } catch (e) {
    console.error(`${LOG} failed to parse OpenAI JSON`, e, 'content:', content);
    const msg =
      'AI returned an unexpected format. Try again or adjust the input text (shorter / clearer Q&A).';
    onProgress?.({ status: 'error', message: msg });
    throw new Error(msg);
  }

  if (__DEV__) console.log(`${LOG} OpenAI parsed items=${items.length}`);
  onProgress?.({ status: 'done', message: `Converted ${items.length} Q&A pairs` });
  return items;
}
