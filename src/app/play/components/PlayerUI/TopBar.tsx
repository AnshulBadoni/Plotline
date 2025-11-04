'use client';

import { ChevronLeft, User, Settings } from 'lucide-react';

export default function TopBar({
    onBack,
    onShowCharacters,
    onShowSettings,
}: {
    onBack?: () => void;
    onShowCharacters: () => void;
    onShowSettings: () => void;
}) {
    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Back Button */}
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-zinc-800"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                ) : (
                    <div />
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onShowCharacters}
                        className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-zinc-800"
                    >
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">Characters</span>
                    </button>
                    <button
                        onClick={onShowSettings}
                        className="bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-white p-2 rounded-lg transition-all backdrop-blur-sm border border-zinc-800"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}