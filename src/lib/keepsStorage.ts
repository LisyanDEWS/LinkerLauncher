/**
 * keepsStorage — IndexedDB-backed storage for Keeps notes.
 *
 * Notes (text + image blobs) are stored ONLY in the browser cache (IndexedDB).
 * They are never uploaded to Firebase. This is intentional: Keeps is a
 * lightweight local scratchpad, not a synced service.
 *
 * Schema:
 *  - db "linkerru_keeps", store "notes" (keyPath "id", autoIncrement)
 *  - db "linkerru_keeps", store "images" (keyPath "id", autoIncrement)
 *    Images are stored as Blob objects keyed by an id referenced in the note.
 */

const DB_NAME = 'linkerru_keeps';
const DB_VERSION = 1;
const NOTES_STORE = 'notes';
const IMAGES_STORE = 'images';

export interface KeepNote {
  id?: number;
  text: string;
  imageIds: number[];
  color: number;
  createdAt: number;
  updatedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        db.createObjectStore(NOTES_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        db.createObjectStore(IMAGES_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      })
  );
}

export async function getAllNotes(): Promise<KeepNote[]> {
  const notes = await tx<KeepNote[]>(NOTES_STORE, 'readonly', (s) => s.getAll() as IDBRequest<KeepNote[]>);
  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function addNote(note: Omit<KeepNote, 'id'>): Promise<number> {
  return tx<number>(NOTES_STORE, 'readwrite', (s) => s.add(note) as IDBRequest<number>);
}

export async function updateNote(note: KeepNote): Promise<void> {
  await tx(NOTES_STORE, 'readwrite', (s) => s.put(note));
}

export async function deleteNote(id: number): Promise<void> {
  await tx(NOTES_STORE, 'readwrite', (s) => s.delete(id));
}

export async function addImage(blob: Blob): Promise<number> {
  return tx<number>(IMAGES_STORE, 'readwrite', (s) => s.add(blob) as IDBRequest<number>);
}

export async function getImage(id: number): Promise<Blob | undefined> {
  return tx<Blob | undefined>(IMAGES_STORE, 'readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>);
}

export async function deleteImage(id: number): Promise<void> {
  await tx(IMAGES_STORE, 'readwrite', (s) => s.delete(id));
}

/** Delete a note and all its referenced images. */
export async function deleteNoteAndImages(note: KeepNote): Promise<void> {
  if (note.id === undefined) return;
  await Promise.all(note.imageIds.map((imgId) => deleteImage(imgId)));
  await deleteNote(note.id);
}
