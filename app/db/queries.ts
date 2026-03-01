import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { initDatabase, type Topic, type Question } from './schema';
import { dbLog } from './logger';

export type { Topic, Question };

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === 'web') {
    dbLog.warn('getDb: SQLite is not fully supported on web; use iOS/Android');
  }
  dbLog.info('getDb: calling initDatabase', { platform: Platform.OS });
  return initDatabase();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function createTopic(name: string): Promise<Topic> {
  dbLog.info('createTopic', { name });
  try {
    const database = await getDb();
    const id = generateId();
    const created_at = Date.now();

    await database.runAsync(
      'INSERT INTO topics (id, name, created_at, conversion_progress, is_read) VALUES (?, ?, ?, 0, 0)',
      [id, name, created_at]
    );
    dbLog.info('createTopic: inserted', { id });

    return { id, name, created_at, conversion_progress: 0, is_read: 0 };
  } catch (err) {
    dbLog.error('createTopic failed', err);
    throw err;
  }
}

export async function getTopics(): Promise<Topic[]> {
  dbLog.info('getTopics');
  try {
    const database = await getDb();
    const rows = await database.getAllAsync<
      Topic & { conversion_progress?: number; is_read?: number }
    >(
      'SELECT id, name, created_at, COALESCE(conversion_progress, 0) as conversion_progress, COALESCE(is_read, 0) as is_read FROM topics ORDER BY created_at DESC'
    );
    dbLog.info('getTopics: count', rows?.length ?? 0);
    return rows ?? [];
  } catch (err) {
    dbLog.error('getTopics failed', err);
    throw err;
  }
}

export async function getTopic(id: string): Promise<Topic | null> {
  dbLog.info('getTopic', { id });
  try {
    const database = await getDb();
    const row = await database.getFirstAsync<
      Topic & { conversion_progress?: number; is_read?: number }
    >(
      'SELECT id, name, created_at, COALESCE(conversion_progress, 0) as conversion_progress, COALESCE(is_read, 0) as is_read FROM topics WHERE id = ?',
      [id]
    );
    return row ?? null;
  } catch (err) {
    dbLog.error('getTopic failed', err);
    throw err;
  }
}

export async function updateTopic(id: string, name: string): Promise<void> {
  dbLog.info('updateTopic', { id });
  try {
    const database = await getDb();
    await database.runAsync('UPDATE topics SET name = ? WHERE id = ?', [name, id]);
  } catch (err) {
    dbLog.error('updateTopic failed', err);
    throw err;
  }
}

export async function updateTopicProgress(id: string, progress: number): Promise<void> {
  dbLog.info('updateTopicProgress', { id, progress });
  try {
    const database = await getDb();
    await database.runAsync('UPDATE topics SET conversion_progress = ? WHERE id = ?', [
      progress,
      id,
    ]);
  } catch (err) {
    dbLog.error('updateTopicProgress failed', err);
    throw err;
  }
}

export async function setTopicRead(id: string, isRead: boolean): Promise<void> {
  dbLog.info('setTopicRead', { id, isRead });
  try {
    const database = await getDb();
    await database.runAsync('UPDATE topics SET is_read = ? WHERE id = ?', [
      isRead ? 1 : 0,
      id,
    ]);
  } catch (err) {
    dbLog.error('setTopicRead failed', err);
    throw err;
  }
}

export async function deleteTopic(id: string): Promise<void> {
  dbLog.info('deleteTopic', { id });
  try {
    const database = await getDb();
    await database.runAsync('DELETE FROM questions WHERE topic_id = ?', [id]);
    await database.runAsync('DELETE FROM topics WHERE id = ?', [id]);
    dbLog.info('deleteTopic: done');
  } catch (err) {
    dbLog.error('deleteTopic failed', err);
    throw err;
  }
}

export async function deleteQuestion(id: string): Promise<void> {
  dbLog.info('deleteQuestion', { id });
  try {
    const database = await getDb();
    await database.runAsync('DELETE FROM questions WHERE id = ?', [id]);
    dbLog.info('deleteQuestion: done');
  } catch (err) {
    dbLog.error('deleteQuestion failed', err);
    throw err;
  }
}

export async function createQuestion(
  topicId: string,
  question: string,
  answer: string
): Promise<Question> {
  dbLog.info('createQuestion', { topicId });
  try {
    const database = await getDb();
    const id = generateId();
    const created_at = Date.now();

    await database.runAsync(
      'INSERT INTO questions (id, topic_id, question, answer, difficulty, confidence, created_at, is_read) VALUES (?, ?, ?, ?, 0, 0, ?, 0)',
      [id, topicId, question, answer, created_at]
    );
    return {
      id,
      topic_id: topicId,
      question,
      answer,
      difficulty: 0,
      confidence: 0,
      created_at,
      is_read: 0,
    };
  } catch (err) {
    dbLog.error('createQuestion failed', err);
    throw err;
  }
}

export async function createQuestions(
  topicId: string,
  items: { question: string; answer: string }[]
): Promise<Question[]> {
  dbLog.info('createQuestions', { topicId, count: items.length });
  if (items.length === 0) return [];

  try {
    const database = await getDb();
    const created_at = Date.now();
    const results: Question[] = [];

    await database.withTransactionAsync(async () => {
      for (const item of items) {
        const id = generateId();
        await database.runAsync(
          'INSERT INTO questions (id, topic_id, question, answer, difficulty, confidence, created_at, is_read) VALUES (?, ?, ?, ?, 0, 0, ?, 0)',
          [id, topicId, item.question, item.answer, created_at]
        );
        results.push({
          id,
          topic_id: topicId,
          question: item.question,
          answer: item.answer,
          difficulty: 0,
          confidence: 0,
          created_at,
          is_read: 0,
        });
      }
    });

    dbLog.info('createQuestions: inserted', results.length);
    return results;
  } catch (err) {
    dbLog.error('createQuestions failed', err);
    throw err;
  }
}

export async function getQuestionsByTopic(topicId: string): Promise<Question[]> {
  dbLog.info('getQuestionsByTopic', { topicId });
  try {
    const database = await getDb();
    const rows = await database.getAllAsync<Question>(
      'SELECT id, topic_id, question, answer, difficulty, confidence, created_at, COALESCE(is_read, 0) as is_read FROM questions WHERE topic_id = ? ORDER BY created_at ASC',
      [topicId]
    );
    dbLog.info('getQuestionsByTopic: count', rows?.length ?? 0);
    return rows ?? [];
  } catch (err) {
    dbLog.error('getQuestionsByTopic failed', err);
    throw err;
  }
}

export async function getQuestion(id: string): Promise<Question | null> {
  dbLog.info('getQuestion', { id });
  try {
    const database = await getDb();
    const row = await database.getFirstAsync<Question>(
      'SELECT id, topic_id, question, answer, difficulty, confidence, created_at, COALESCE(is_read, 0) as is_read FROM questions WHERE id = ?',
      [id]
    );
    return row ?? null;
  } catch (err) {
    dbLog.error('getQuestion failed', err);
    throw err;
  }
}

export async function getQuestionCount(topicId: string): Promise<number> {
  try {
    const database = await getDb();
    const row = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM questions WHERE topic_id = ?',
      [topicId]
    );
    return row?.count ?? 0;
  } catch (err) {
    dbLog.error('getQuestionCount failed', err);
    throw err;
  }
}

export async function setQuestionRead(id: string, isRead: boolean): Promise<void> {
  dbLog.info('setQuestionRead', { id, isRead });
  try {
    const database = await getDb();
    await database.runAsync('UPDATE questions SET is_read = ? WHERE id = ?', [
      isRead ? 1 : 0,
      id,
    ]);
  } catch (err) {
    dbLog.error('setQuestionRead failed', err);
    throw err;
  }
}
