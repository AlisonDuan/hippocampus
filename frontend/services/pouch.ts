import PouchDB from 'pouchdb';
import RNAdapter from 'pouchdb-adapter-react-native-sqlite';
import type { CardDoc } from './types';

PouchDB.plugin(RNAdapter);

const DB_NAME = 'hippocampus';
// From a physical device, set EXPO_PUBLIC_SYNC_URL to your machine's LAN IP, e.g. http://192.168.0.241:5984/hippocampus
const REMOTE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SYNC_URL) ||
  'http://localhost:5984/hippocampus';

let localDb: PouchDB.Database<CardDoc> | null = null;

export function getDb(): PouchDB.Database<CardDoc> {
  if (!localDb) {
    localDb = new PouchDB<CardDoc>(DB_NAME, { adapter: 'react-native-sqlite' });
  }
  return localDb;
}

export function getRemoteDb(): PouchDB.Database<CardDoc> {
  return new PouchDB<CardDoc>(REMOTE_URL);
}

export function createCardDoc(front: string, back: string, id?: string): CardDoc {
  return {
    _id: id || generateId(),
    type: 'card',
    front,
    back,
  };
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function getAllCards(): Promise<CardDoc[]> {
  const result = await getDb().allDocs<CardDoc>({ include_docs: true });
  return result.rows
    .map((r) => r.doc)
    .filter((doc): doc is CardDoc => doc != null && doc.type === 'card');
}

export async function addCard(doc: CardDoc): Promise<CardDoc> {
  const result = await getDb().put(doc);
  return { ...doc, _rev: result.rev };
}

export async function removeCard(id: string): Promise<void> {
  const doc = await getDb().get(id);
  await getDb().remove(doc);
}

export async function getCard(id: string): Promise<CardDoc> {
  const doc = await getDb().get(id);
  if (doc.type !== 'card') throw new Error('Not a card');
  return doc as CardDoc;
}

export async function updateCard(doc: CardDoc): Promise<CardDoc> {
  const result = await getDb().put(doc);
  return { ...doc, _rev: result.rev };
}

export async function syncWithRemote(): Promise<void> {
  const db = getDb();
  const remote = getRemoteDb();
  await db.sync(remote, { live: false, retry: true });
}

export async function getDueCards(): Promise<CardDoc[]> {
  const all = await getAllCards();
  const now = new Date().toISOString();
  return all.filter(
    (doc) => doc.next_review == null || doc.next_review <= now
  );
}

export type { CardDoc };
