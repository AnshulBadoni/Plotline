'use client';

export default function DialogueBox({ character, dialogue }: {
    character?: { name: string; image?: string; emoji?: string; color?: string };
    dialogue?: string;
}) {
    if (!dialogue) return null;

    return (
        <div className="bg-zinc-900/95 backdrop-blur-md rounded-2xl overflow-hidden border border-zinc-800/50 shadow-2xl">
            <div className="p-8">
                <div className="flex items-start gap-6">
                    {character && (
                        <div className="shrink-0">
                            {character.image ? (
                                <img
                                    src={character.image}
                                    alt={character.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-zinc-800 ring-2 ring-zinc-700"
                                />
                            ) : (
                                <div className={`w-24 h-24 rounded-full ${character.color} flex items-center justify-center text-4xl border-4 border-zinc-800 ring-2 ring-zinc-700`}>
                                    {character.emoji}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-bold text-white mb-4 capitalize tracking-wide">
                            {character?.name}
                        </h3>
                        <p className="text-zinc-100 text-lg leading-relaxed">
                            {dialogue}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}