/**
 * IndexedDB Storage Service
 * Stores media files as blobs instead of Base64 strings to prevent browser crashes
 */

const DB_NAME = 'CinePetStudio';
const DB_VERSION = 1;
const MEDIA_STORE = 'media';
const HISTORY_STORE = 'history';

export interface StoredMedia {
  id: string;
  blob: Blob;
  mimeType: string;
  timestamp: number;
}

export interface HistoryMetadata {
  id: string;
  type: 'poster' | 'comic' | 'video' | 'edit' | 'analyze' | 'speech' | 'avatar' | 'book';
  prompt: string;
  timestamp: number;
  metadata?: any;
  cloudUrl?: string;
  cloudSynced?: boolean;
}

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for media blobs
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
        }

        // Store for history metadata (without the large blob data)
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          historyStore.createIndex('type', 'type', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Convert a data URL to a Blob
   */
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  /**
   * Convert a Blob to a data URL (for display)
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Save media content (image or video)
   */
  async saveMedia(id: string, dataUrl: string, metadata: Omit<HistoryMetadata, 'id'>): Promise<void> {
    const db = await this.init();

    // Convert data URL to blob
    const blob = await this.dataUrlToBlob(dataUrl);
    const mimeType = blob.type || (metadata.type === 'video' ? 'video/mp4' : 'image/png');

    // Store the blob
    const mediaData: StoredMedia = {
      id,
      blob,
      mimeType,
      timestamp: metadata.timestamp
    };

    // Store the metadata separately (without the blob URL)
    const historyData: HistoryMetadata = {
      id,
      ...metadata
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEDIA_STORE, HISTORY_STORE], 'readwrite');

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      transaction.objectStore(MEDIA_STORE).put(mediaData);
      transaction.objectStore(HISTORY_STORE).put(historyData);
    });
  }

  /**
   * Get media blob by ID
   */
  async getMediaBlob(id: string): Promise<Blob | null> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MEDIA_STORE, 'readonly');
      const request = transaction.objectStore(MEDIA_STORE).get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as StoredMedia | undefined;
        resolve(result?.blob || null);
      };
    });
  }

  /**
   * Get media as data URL (for display in img/video tags)
   */
  async getMediaUrl(id: string): Promise<string | null> {
    const blob = await this.getMediaBlob(id);
    if (!blob) return null;
    return this.blobToDataUrl(blob);
  }

  /**
   * Get media as object URL (more efficient for display, but must be revoked)
   */
  async getMediaObjectUrl(id: string): Promise<string | null> {
    const blob = await this.getMediaBlob(id);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  /**
   * Get all history metadata
   */
  async getAllHistory(): Promise<HistoryMetadata[]> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE, 'readonly');
      const store = transaction.objectStore(HISTORY_STORE);
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Newest first

      const results: HistoryMetadata[] = [];

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  /**
   * Get history with media URLs loaded
   * Returns items with temporary object URLs - caller should revoke when done
   */
  async getHistoryWithUrls(): Promise<Array<HistoryMetadata & { url: string }>> {
    const history = await this.getAllHistory();
    const results: Array<HistoryMetadata & { url: string }> = [];

    for (const item of history) {
      const url = await this.getMediaObjectUrl(item.id);
      if (url) {
        results.push({ ...item, url });
      }
    }

    return results;
  }

  /**
   * Update history metadata (e.g., cloud sync status)
   */
  async updateHistory(id: string, updates: Partial<HistoryMetadata>): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HISTORY_STORE, 'readwrite');
      const store = transaction.objectStore(HISTORY_STORE);
      const getRequest = store.get(id);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (existing) {
          const updated = { ...existing, ...updates };
          const putRequest = store.put(updated);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Delete a single item
   */
  async deleteItem(id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEDIA_STORE, HISTORY_STORE], 'readwrite');

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      transaction.objectStore(MEDIA_STORE).delete(id);
      transaction.objectStore(HISTORY_STORE).delete(id);
    });
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MEDIA_STORE, HISTORY_STORE], 'readwrite');

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      transaction.objectStore(MEDIA_STORE).clear();
      transaction.objectStore(HISTORY_STORE).clear();
    });
  }

  /**
   * Get storage usage estimate
   */
  async getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return null;
  }

  /**
   * Migrate data from localStorage to IndexedDB
   */
  async migrateFromLocalStorage(): Promise<number> {
    const savedHistory = localStorage.getItem('cinepet_history');
    if (!savedHistory) return 0;

    try {
      const history = JSON.parse(savedHistory);
      let migrated = 0;

      for (const item of history) {
        if (item.url && item.url.startsWith('data:')) {
          await this.saveMedia(item.id, item.url, {
            type: item.type,
            prompt: item.prompt,
            timestamp: item.timestamp,
            metadata: item.metadata,
            cloudUrl: item.cloudUrl,
            cloudSynced: item.cloudSynced
          });
          migrated++;
        }
      }

      // Clear localStorage after successful migration
      if (migrated > 0) {
        localStorage.removeItem('cinepet_history');
      }

      return migrated;
    } catch (e) {
      console.error('Migration failed:', e);
      return 0;
    }
  }
}

export const storageService = new StorageService();
