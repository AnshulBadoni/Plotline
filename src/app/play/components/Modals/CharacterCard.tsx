// src/app/play/components/Modals/CharacterCard.tsx
'use client';

import { getStatIcon } from '../CharacterStatBar';

export default function CharacterCard({ character, onClick }: { character: any; onClick: () => void; }) {
    return (
        <button
            onClick={onClick}
            className="bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-600 rounded-xl overflow-hidden transition-all text-left group hover:scale-105"
        >
            <div className="relative h-32 bg-zinc-900 overflow-hidden">
                {character.bgImage ? (
                    <img src={character.bgImage} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                ) : (
                    <div className={`w-full h-full ${character.color} opacity-20`} />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-zinc-800 to-transparent" />
            </div>

            <div className="p-6 -mt-12 relative">
                <div className="flex items-end gap-4 mb-4">
                    {character.image ? (
                        <img src={character.image} alt={character.name} className="w-20 h-20 rounded-full object-cover border-4 border-zinc-800 ring-2 ring-zinc-700 shadow-xl" />
                    ) : (
                        <div className={`w-20 h-20 rounded-full ${character.color} flex items-center justify-center text-4xl border-4 border-zinc-800 ring-2 ring-zinc-700 shadow-xl`}>
                            {character.emoji}
                        </div>
                    )}
                    <div className="flex-1 mb-1">
                        <h3 className="text-xl font-bold text-white capitalize group-hover:text-zinc-100 transition-colors">
                            {character.name}
                        </h3>
                        <p className="text-sm text-zinc-400 capitalize">{character.role}</p>
                    </div>
                </div>

                {character.details && Object.keys(character.details).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {Object.entries(character.details).slice(0, 3).map(([key, value]: [string, any]) => (
                            <div key={key} className="bg-zinc-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                <div className="text-zinc-400">{getStatIcon(key)}</div>
                                <span className="text-zinc-300 text-xs font-medium capitalize">{key}: {value}</span>
                            </div>
                        ))}
                        {Object.keys(character.details).length > 3 && (
                            <div className="bg-zinc-700/50 px-3 py-1.5 rounded-lg text-zinc-400 text-xs">
                                +{Object.keys(character.details).length - 3} more
                            </div>
                        )}
                    </div>
                )}
            </div>
        </button>
    );
}