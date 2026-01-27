import {ImageJob} from '../types';

const DB_NAME = 'ImgCompress_DB';
const STORE_NAME = 'jobs';
const DB_VERSION = 1;

/**
 * Opens (or creates) the IndexedDB database.
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create object store with 'id' as the key
        db.createObjectStore(STORE_NAME, {keyPath: 'id'});
      }
    };

    request.onsuccess = event => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = event => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * Saves or updates a job in the database.
 * We strip the 'previewUrl' because Object URLs are transient and expire on refresh.
 * We persist the File/Blob objects directly.
 */
export const saveJobToDb = async (job: ImageJob): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Create a clone to avoid mutating the React state object
    // Remove previewUrl as it must be regenerated on load
    const jobToSave = {...job};
    // We deliberately remove this property before storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (jobToSave as any).previewUrl;

    store.put(jobToSave);
  } catch (e) {
    console.error('Failed to save job to DB', e);
  }
};

/**
 * Deletes a specific job from the database.
 */
export const deleteJobFromDb = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
  } catch (e) {
    console.error('Failed to delete job from DB', e);
  }
};

/**
 * Clears all jobs from the database.
 */
export const clearDb = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
  } catch (e) {
    console.error('Failed to clear DB', e);
  }
};

/**
 * Retrieves all persisted jobs.
 * This handles "Crash Recovery": if a job was 'processing' when saved,
 * it returns as 'queued' so it can restart.
 */
export const getAllJobsFromDb = async (): Promise<ImageJob[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const rawJobs = request.result as ImageJob[];

        // Post-processing for hydration
        const hydratedJobs = rawJobs.map(job => {
          // Recovery: If it was interrupted, reset to queued
          if (job.status === 'processing') {
            return {...job, status: 'queued', progress: 0} as ImageJob;
          }
          return job;
        });

        resolve(hydratedJobs);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to load jobs', e);
    return [];
  }
};
