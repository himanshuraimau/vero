import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const BATCH_SIZE = 4000;
const QA_SCHEMA = z.object({
  question: z.string(),
  answer: z.string(),
});

// Regex for start of a new Q&A block (so we don't split in the middle of one)
const NEW_QA_START = /\n\s*(?:Q\.?|Question\s*\d*\.?|A\.?|Answer\s*\d*\.?|\d+\.)\s*[:\s]/i;

function splitIntoBatches(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= BATCH_SIZE) return [trimmed];

  const batches: string[] = [];
  let remaining = trimmed;

  while (remaining.length > 0) {
    if (remaining.length <= BATCH_SIZE) {
      batches.push(remaining.trim());
      break;
    }
    const chunk = remaining.slice(0, BATCH_SIZE);
    const nextPart = remaining.slice(BATCH_SIZE);
    // Find the last "new Q&A" boundary in the chunk so we don't cut mid-pair
    const matches = [...chunk.matchAll(new RegExp(NEW_QA_START.source, 'gi'))];
    const lastMatch = matches[matches.length - 1];
    const splitIndex = lastMatch ? lastMatch.index! : BATCH_SIZE;
    const batch = chunk.slice(0, splitIndex).trim();
    remaining = chunk.slice(splitIndex).trim() + (nextPart ? '\n\n' + nextPart : '');
    if (batch) batches.push(batch);
    if (!remaining.trim()) break;
  }
  return batches.filter(Boolean);
}

const SYSTEM_PROMPT = `You are a formatter. Your job is to preserve the user's question-answer pairs exactly as they are given.

RULES:
1. PRESERVE STRUCTURE: One question = one answer = one JSON pair. Do NOT split a single Q&A into multiple pairs. Do NOT merge multiple Q&As into one. Keep each question with its full answer exactly as the user provided.
2. DO NOT rephrase, shorten, or summarize questions or answers. Output the same text the user gave, possibly with formatting only (see below).
3. If the input is already in Q&A form (e.g. "Q: ... A: ...", "Question: ... Answer: ...", numbered items, or bullet pairs), treat each such block as one pair. Do not break one answer into multiple pairs.
4. For answers that contain CODE or programming snippets: format them in Markdown so they are readable:
   - Wrap code in fenced code blocks with a language tag, e.g. \`\`\`javascript ... \`\`\` or \`\`\`python ... \`\`\`
   - Use \`inline code\` for short identifiers, commands, or keywords in the answer text
   - Keep line breaks and indentation in code. Do not remove or truncate code.
5. For non-code answers (theory, explanations), keep the text as-is; you may use minimal markdown (e.g. **bold** for terms) only if it helps readability, but do not change the content.
6. Output only valid JSON. Each array element must have "question" (string) and "answer" (string).`;

const LOG = '[Vero API format]';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rawText?: string };
    const rawText = body?.rawText;
    console.log(`${LOG} POST body keys:`, Object.keys(body || {}), 'rawText length:', rawText?.length);
    if (!rawText || typeof rawText !== 'string') {
      console.warn(`${LOG} missing or invalid rawText`);
      return Response.json({ error: 'rawText is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(`${LOG} OPENAI_API_KEY not set`);
      return Response.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const batches = splitIntoBatches(rawText);
    console.log(`${LOG} batches: ${batches.length}`);
    const allItems: { question: string; answer: string }[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`${LOG} batch ${i + 1}/${batches.length} (${batch.length} chars)`);
      const { output } = await generateText({
        model: openai('gpt-4o-mini'),
        system: SYSTEM_PROMPT,
        prompt: `The following text contains question-answer pairs. List them as a JSON array. Preserve each Q&A as one pair; do not split or merge. For any answer with code, format it using markdown code blocks. Output ONLY the JSON array.\n\n${batch}`,
        output: Output.array({
          element: QA_SCHEMA,
          name: 'qa_pairs',
          description: 'Array of question and answer pairs extracted from the text',
        }),
        temperature: 0.2,
      });

      if (Array.isArray(output)) {
        for (const item of output) {
          if (item && typeof item === 'object' && 'question' in item && 'answer' in item) {
            allItems.push({
              question: String(item.question),
              answer: String(item.answer),
            });
          }
        }
      }
    }

    console.log(`${LOG} success, items: ${allItems.length}`);
    return Response.json({ items: allItems });
  } catch (err) {
    console.error(`${LOG} error:`, err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Format failed' },
      { status: 500 }
    );
  }
}
