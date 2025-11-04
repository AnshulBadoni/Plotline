// src/app/play/components/Modals/CharacterDetails.tsx
'use client';

import CharacterStatBar from '../CharacterStatBar';
import { ChevronLeft } from 'lucide-react';

export default function CharacterDetails({ character, stats, onBack }: {
    character: any;
    stats: Record<string, string>;
    onBack: () => void;
}) {
    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={onBack}
                className="mb-6 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors px-4 py-2 hover:bg-zinc-800 rounded-lg"
            >
                <ChevronLeft className="w-4 h-4" />
                <span className="font-medium">Back to all characters</span>
            </button>

            <div className="bg-zinc-800 border-2 border-zinc-700 rounded-2xl overflow-hidden">
                <div className="relative h-64 bg-zinc-900">
                    {character.bgImage ? (
                        <img src={character.bgImage} alt="" className="w-full h-full object-cover opacity-40" />
                    ) : (
                        <div className={`w-full h-full ${character.color} opacity-20`} />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-zinc-800 via-zinc-800/60 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-6">
                        {character.image ? (
                            <img src={character.image} alt={character.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-zinc-800 ring-2 ring-zinc-700 shadow-2xl" />
                        ) : (
                            <div className={`w-32 h-32 rounded-2xl ${character.color} flex items-center justify-center text-6xl border-4 border-zinc-800 ring-2 ring-zinc-700 shadow-2xl`}>
                                {character.emoji}
                            </div>
                        )}
                        <div className="flex-1 pb-2">
                            <h2 className="text-4xl font-bold text-white capitalize mb-1">{character.name}</h2>
                            <p className="text-zinc-300 text-lg capitalize flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${character.role === 'friend' ? 'bg-green-500' : character.role === 'foe' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                {character.role}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-zinc-600 rounded" />
                        Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(stats).map(([key, value]) => (
                            <CharacterStatBar key={key} label={key} value={value} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}