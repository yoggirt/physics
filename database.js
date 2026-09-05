const DB_NAME = "PhysicsCatalogue";
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains("documents")) {
                db.createObjectStore("documents", { keyPath: "hash" });
            }

            if (!db.objectStoreNames.contains("annotations")) {
                const store = db.createObjectStore(
                    "annotations",
                    { keyPath: "id" }
                );
                store.createIndex("document", "document");
            }

            if (!db.objectStoreNames.contains("nodes")) {
                db.createObjectStore("nodes", { keyPath: "id" });
            }

            if (!db.objectStoreNames.contains("links")) {
                db.createObjectStore("links", { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    return dbPromise;
}

function request(storeName, mode, action) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);

        let result;

        try {
            result = action(store);
        } catch (error) {
            reject(error);
            return;
        }

        if (result && "onsuccess" in result) {
            result.onsuccess = () => resolve(result.result);
            result.onerror = () => reject(result.error);
        } else {
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error);
        }
    }));
}

export function put(storeName, value) {
    return request(storeName, "readwrite", store =>
        store.put(value)
    );
}

export function get(storeName, key) {
    return request(storeName, "readonly", store =>
        store.get(key)
    );
}

export function getAll(storeName) {
    return request(storeName, "readonly", store =>
        store.getAll()
    );
}

export function deleteItem(storeName, key) {
    return request(storeName, "readwrite", store =>
        store.delete(key)
    );
}

export async function getAnnotationsForDocument(hash) {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction("annotations", "readonly");
        const index = tx.objectStore("annotations").index("document");
        const req = index.getAll(hash);

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}
