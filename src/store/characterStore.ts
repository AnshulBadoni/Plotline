// src/store/characterStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character } from '@/types';

interface CharacterStore {
    characters: Character[];
    addCharacter: (character: Character) => void;
    updateCharacter: (id: number, character: Partial<Character>) => void;
    deleteCharacter: (id: number) => void;
    getCharacter: (id: number) => Character | undefined;
}

export const useCharacterStore = create<CharacterStore>()(
    persist(
        (set, get) => ({
            characters: [],
            addCharacter: (character) =>
                set((state) => ({
                    characters: [...state.characters, character],
                })),
            updateCharacter: (id, updatedCharacter) =>
                set((state) => ({
                    characters: state.characters.map((char) =>
                        char.id === id ? { ...char, ...updatedCharacter } : char
                    ),
                })),
            deleteCharacter: (id) =>
                set((state) => ({
                    characters: state.characters.filter((char) => char.id !== id),
                })),
            getCharacter: (id) => {
                return get().characters.find((char) => char.id === id);
            },
        }),
        {
            name: 'vn-characters',
        }
    )
);