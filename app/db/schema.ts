import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

import { dbLog } from './logger';

const DB_NAME = 'vero.db';

let cachedDb: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (cachedDb) {
    dbLog.info('initDatabase: returning cached db');
    return cachedDb;
  }
  if (initPromise) {
    dbLog.info('initDatabase: awaiting existing init');
    return initPromise;
  }
  dbLog.info('initDatabase: start', { platform: Platform.OS });
  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      dbLog.info('initDatabase: openDatabaseAsync OK');
      cachedDb = db;

      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        conversion_progress INTEGER DEFAULT 0,
        is_read INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        difficulty INTEGER DEFAULT 0,
        confidence INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        is_read INTEGER DEFAULT 0,
        FOREIGN KEY (topic_id) REFERENCES topics(id)
      );

      CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
    `);
    dbLog.info('initDatabase: execAsync (CREATE) OK');

    try {
      await db.execAsync(
        `ALTER TABLE topics ADD COLUMN conversion_progress INTEGER DEFAULT 0;`
      );
      dbLog.info('initDatabase: migration added conversion_progress');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('duplicate column') || msg.includes('already exists')) {
        dbLog.info('initDatabase: conversion_progress already exists');
      } else {
        dbLog.warn('initDatabase: migration', e);
      }
    }

    try {
      await db.execAsync(
        `ALTER TABLE topics ADD COLUMN is_read INTEGER DEFAULT 0;`
      );
      dbLog.info('initDatabase: migration added topics.is_read');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('duplicate column') || msg.includes('already exists')) {
        dbLog.info('initDatabase: topics.is_read already exists');
      } else {
        dbLog.warn('initDatabase: migration (topics.is_read)', e);
      }
    }

    try {
      await db.execAsync(
        `ALTER TABLE questions ADD COLUMN is_read INTEGER DEFAULT 0;`
      );
      dbLog.info('initDatabase: migration added questions.is_read');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('duplicate column') || msg.includes('already exists')) {
        dbLog.info('initDatabase: questions.is_read already exists');
      } else {
        dbLog.warn('initDatabase: migration (questions.is_read)', e);
      }
    }

      dbLog.info('initDatabase: done');
      return db;
    } catch (err) {
      dbLog.error('initDatabase failed', err);
      initPromise = null;
      throw err;
    }
  })();
  return initPromise;
}

export type Topic = {
  id: string;
  name: string;
  created_at: number;
  conversion_progress?: number;
  is_read?: number;
};

export type Question = {
  id: string;
  topic_id: string;
  question: string;
  answer: string;
  difficulty: number;
  confidence: number;
  created_at: number;
  is_read?: number;
};
