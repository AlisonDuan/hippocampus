import * as SQLite from 'expo-sqlite';
import { Flashcard } from './types';

// Opens (or creates) a file named 'flashcards.db' on the phone
const db = SQLite.openDatabaseSync('offline_cards.db');

export const initializeLocalDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      front TEXT,
      back TEXT,
    );
  `);
};

export const saveCardsToPhone = (cards: Flashcard[]) => {
  for (const card of cards) {
    db.runSync(
      'INSERT OR REPLACE INTO cards (id, front, back, next_review) VALUES (?, ?, ?, ?)',
      [card.id, card.front, card.back]
    );
  }
};