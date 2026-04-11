import { openDB } from "idb";
import { uploadVideoToCloudinary } from "@/services/cloudinary";
import { api } from "@/api";

const DB_NAME = "road-safety-offline-db";
const STORE_NAME = "pending-uploads";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("createdAt", "createdAt");
    }
  },
});

export async function queueVideoForSync({ fileBlob, fileName, fileType, token, userId }) {
  const db = await dbPromise;
  return db.add(STORE_NAME, {
    fileBlob,
    fileName,
    fileType,
    token,
    userId,
    createdAt: Date.now(),
  });
}

export async function getQueuedVideos() {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

export async function clearQueuedVideo(id) {
  const db = await dbPromise;
  return db.delete(STORE_NAME, id);
}

export async function syncQueuedVideos({
  onItemSynced,
  onError,
  getFreshToken,
} = {}) {
  const queued = await getQueuedVideos();

  for (const item of queued) {
    try {
      const token = (getFreshToken ? await getFreshToken() : null) || item.token;
      const blob = item.fileBlob;
      const file = new File([blob], item.fileName || `offline-${item.id}.mp4`, {
        type: item.fileType || blob.type || "video/mp4",
      });

      const cloudinaryUrl = await uploadVideoToCloudinary(file);
      const analysis = await api.detectAccident(cloudinaryUrl, token);

      await clearQueuedVideo(item.id);
      if (onItemSynced) {
        onItemSynced({ item, cloudinaryUrl, analysis });
      }
    } catch (error) {
      if (onError) {
        onError({ item, error });
      }
    }
  }
}
