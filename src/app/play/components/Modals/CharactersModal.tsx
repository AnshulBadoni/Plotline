// src/app/play/components/Modals/CharactersModal.tsx
'use client';

import { X } from 'lucide-react';
import CharacterCard from './CharacterCard';
import CharacterDetails from './CharacterDetails';

export default function CharactersModal({ characters, selectedChar, onClose, onSelectChar, characterStats }: {
    characters: any[];
    selectedChar: any;
    onClose: () => void;
    onSelectChar: (char: any) => void;
    characterStats: Record<string, Record<string, string>>;
}) {
    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-zinc-900 rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-zinc-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="bg-zinc-950 border-b border-zinc-800 p-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2">Characters</h2>
                            <p className="text-zinc-500">View your story characters and their stats</p>
                        </div>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
                    {!selectedChar ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {characters.map((char) => (
                                <CharacterCard key={char.id} character={char} onClick={() => onSelectChar(char)} />
                            ))}
                        </div>
                    ) : (
                        <CharacterDetails
                            character={selectedChar}
                            stats={characterStats[selectedChar.name] || selectedChar.details}
                            onBack={() => onSelectChar(null)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}