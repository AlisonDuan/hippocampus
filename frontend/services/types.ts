export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

/** SRS fields for spaced repetition (SM-2 style) */
export interface SRSFields {
  next_review?: string | null; // ISO date string
  interval?: number;
  ease_factor?: number;
  repetitions?: number;
  last_review?: string | null;
}

/** Document stored in PouchDB/CouchDB. _id is the card id. */
export interface CardDoc extends SRSFields {
  _id: string;
  _rev?: string;
  type: 'card';
  front: string;
  back: string;
}
