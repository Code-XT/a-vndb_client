import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LibraryEntry, LibraryStatus, VN } from '../types';

interface LibraryState {
  entries: Record<string, LibraryEntry>;
  addEntry: (vn: VN, status: LibraryStatus) => void;
  removeEntry: (id: string) => void;
  updateStatus: (id: string, status: LibraryStatus) => void;
  getEntry: (id: string) => LibraryEntry | undefined;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      entries: {},
      addEntry: (vn, status) => {
        set((state) => ({
          entries: {
            ...state.entries,
            [vn.id]: {
              vn,
              status,
              addedAt: Date.now(),
            },
          },
        }));
      },
      removeEntry: (id) => {
        set((state) => {
          const newEntries = { ...state.entries };
          delete newEntries[id];
          return { entries: newEntries };
        });
      },
      updateStatus: (id, status) => {
        set((state) => {
          if (!state.entries[id]) return state;
          return {
            entries: {
              ...state.entries,
              [id]: {
                ...state.entries[id],
                status,
              },
            },
          };
        });
      },
      getEntry: (id) => get().entries[id],
    }),
    {
      name: 'vndb-library-storage',
    }
  )
);
