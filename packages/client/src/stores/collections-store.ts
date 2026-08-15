import type { Collection, CollectionItem } from "mcp-studio-shared";
import { API_PREFIX } from "mcp-studio-shared";
import { create } from "zustand";

interface CollectionsState {
  collections: Collection[];
  loading: boolean;

  fetchAll: () => Promise<void>;
  create: (name: string, description?: string) => Promise<Collection>;
  update: (
    id: string,
    data: { name?: string; description?: string; items?: CollectionItem[] },
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addItem: (collectionId: string, item: CollectionItem) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  collections: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_PREFIX}/collections`);
      const { collections } = (await res.json()) as { collections: Collection[] };
      set({ collections, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  create: async (name, description) => {
    const res = await fetch(`${API_PREFIX}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const { collection } = (await res.json()) as { collection: Collection };
    set({ collections: [collection, ...get().collections] });
    return collection;
  },

  update: async (id, data) => {
    const res = await fetch(`${API_PREFIX}/collections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const { collection } = (await res.json()) as { collection: Collection };
    set({
      collections: get().collections.map((c) => (c.id === id ? collection : c)),
    });
  },

  remove: async (id) => {
    await fetch(`${API_PREFIX}/collections/${id}`, { method: "DELETE" });
    set({ collections: get().collections.filter((c) => c.id !== id) });
  },

  addItem: async (collectionId, item) => {
    const collection = get().collections.find((c) => c.id === collectionId);
    if (!collection) return;
    const items = [...collection.items, item];
    await get().update(collectionId, { items });
  },
}));
