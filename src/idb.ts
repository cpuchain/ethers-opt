/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as idb from 'idb';

declare global {
    interface Window {
        idb?: typeof idb;
    }
}

const IDB_ERR = 'A mutation operation was attempted on a database that did not allow mutations.';

export interface IDBStore {
    name: string;
    keyPath?: string;
    indexes?: IDBIndex[];
}

export class IndexedDB {
    name: string;
    version: number;
    options: idb.OpenDBCallbacks<any>;
    db: Promise<idb.IDBPDatabase<any> | undefined>;

    constructor({ name, version = 1, stores = [] }: { name: string; version?: number; stores?: IDBStore[] }) {
        this.name = name;
        this.version = version;

        if (stores.findIndex(({ name }) => name === 'keyStore') === -1) {
            stores.push({ name: 'keyStore' });
        }

        this.options = {
            upgrade(db) {
                Object.values(db.objectStoreNames).forEach((value) => {
                    db.deleteObjectStore(value);
                });

                stores.forEach(({ name, keyPath, indexes }) => {
                    const store = db.createObjectStore(name, {
                        keyPath,
                        autoIncrement: true,
                    });

                    if (Array.isArray(indexes)) {
                        indexes.forEach(({ name, unique = false }) => {
                            store.createIndex(name, name, { unique });
                        });
                    }
                });
            },
        };

        this.db = this.openDB();
    }

    async openDB(): Promise<idb.IDBPDatabase<any> | undefined> {
        try {
            if (!window?.idb) {
                console.log('IDB library is not available!');
                return;
            }

            const db = await window.idb.openDB(this.name, this.version, this.options);

            db.addEventListener('onupgradeneeded', async () => {
                await this.deleteDB();
            });

            return db;
        } catch (err: any) {
            if (err.message.includes(IDB_ERR)) {
                console.log('The browser does not support IndexedDB');
                return;
            }

            if (err.message.includes('less than the existing version')) {
                console.log(`Upgrading DB ${this.name} to ${this.version}`);
                await this.deleteDB();
                return;
            }

            console.log(`openDB error: ${err.message}`);
        }
    }

    async deleteDB(): Promise<void> {
        await window?.idb?.deleteDB(this.name);

        this.db = this.openDB();
        await this.db;
    }

    async getItem<T>({ storeName, key }: { storeName: string; key: string }): Promise<T | undefined> {
        try {
            const db = await this.db;

            if (!db) {
                return;
            }

            const store = db.transaction(storeName).objectStore(storeName);

            return (await store.get(key)) as T;
        } catch (err: any) {
            throw new Error(`getItem error: ${err.message}`);
        }
    }

    /**
     * Add item only if key is new
     */
    async addItem({ storeName, key, data }: { storeName: string; key: string; data: any }): Promise<void> {
        try {
            const db = await this.db;

            if (!db) {
                return;
            }

            const tx = db.transaction(storeName, 'readwrite');
            const isExist = await tx.objectStore(storeName).get(key);

            if (!isExist) {
                await tx.objectStore(storeName).add(data);
            }
        } catch (err: any) {
            throw new Error(`addItem error: ${err.message}`);
        }
    }

    /**
     * Override item for key
     */
    async putItem({
        storeName,
        key = '',
        data,
    }: {
        storeName: string;
        key?: string;
        data: any;
    }): Promise<void> {
        try {
            const db = await this.db;

            if (!db) {
                return;
            }

            const tx = db.transaction(storeName, 'readwrite');

            await tx.objectStore(storeName).put(data, key);
        } catch (err: any) {
            throw new Error(`putItem error: ${err.message}`);
        }
    }

    async deleteItem({ storeName, key }: { storeName: string; key: string }): Promise<void> {
        try {
            const db = await this.db;

            if (!db) {
                return;
            }

            const tx = db.transaction(storeName, 'readwrite');

            await tx.objectStore(storeName).delete(key);
        } catch (err: any) {
            throw new Error(`putItem error: ${err.message}`);
        }
    }

    async getAll<T>({ storeName }: { storeName: string }): Promise<T> {
        try {
            const db = await this.db;

            if (!db) {
                return [] as T;
            }

            const tx = db.transaction(storeName, 'readonly');

            return (await tx.objectStore(storeName).getAll()) as T;
        } catch (err: any) {
            throw new Error(`getAll error: ${err.message}`);
        }
    }

    async clearStore({ storeName }: { storeName: string }): Promise<void> {
        try {
            const db = await this.db;

            if (!db) {
                return;
            }

            const tx = db.transaction(storeName, 'readwrite');

            await tx.objectStore(storeName).clear();
        } catch (err: any) {
            throw new Error(`clearStore error: ${err.message}`);
        }
    }

    async createTransactions({ storeName, data }: { storeName: string; data: any }): Promise<void> {
        try {
            const db = await this.db;

            if (!db) {
                return;
            }

            const tx = db.transaction(storeName, 'readwrite');

            await (tx.objectStore(storeName).add as (value: any, key?: any) => Promise<any>)(data);
            await tx.done;
        } catch (err: any) {
            throw new Error(`Method createTransactions has error: ${err.message}`);
        }
    }

    async createMultipleTransactions({
        storeName,
        data,
        index,
    }: {
        storeName: string;
        data: any[];
        index?: any;
    }): Promise<void> {
        try {
            const db = await this.db;

            if (!db) {
                return;
            }

            const tx = db.transaction(storeName, 'readwrite');

            for (const item of data) {
                if (item) {
                    await tx.store.put({ ...item, ...index });
                }
            }
        } catch (err: any) {
            throw new Error(`Method createMultipleTransactions has error: ${err.message}`);
        }
    }

    /**
     * Key-Value
     */
    get<T>(key: string): Promise<T | undefined> {
        return this.getItem<T>({ storeName: 'keyStore', key });
    }

    set(key: string, data: any): Promise<void> {
        return this.putItem({ storeName: 'keyStore', key, data });
    }

    del(key: string): Promise<void> {
        return this.deleteItem({ storeName: 'keyStore', key });
    }
}
