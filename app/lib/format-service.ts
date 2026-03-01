import { generateApiUrl } from '@/utils/generate-api-url';

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

  const url = generateApiUrl('/api/format');
  if (__DEV__) console.log(`${LOG} POST ${url}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText }),
  });

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
