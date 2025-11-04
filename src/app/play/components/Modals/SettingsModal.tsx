// src/app/play/components/Modals/SettingsModal.tsx
'use client';

import { X } from 'lucide-react';

export default function SettingsModal({ onClose, onSave, onLoad }: {
    onClose: () => void;
    onSave: () => void;
    onLoad: (index: number) => void;
}) {
    const saves = JSON.parse(localStorage.getItem('saved-games') || '[]');

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-zinc-800" onClick={(e) => e.stopPropagation()}>
                <div className="bg-zinc-950 border-b border-zinc-800 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Saved Games</h3>
                            <div className="space-y-3">
                                {saves.length > 0 ? (
                                    saves.map((save: any, index: number) => (
                                        <div key={index} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-white font-medium">Save Slot {index + 1}</p>
                                                <p className="text-zinc-500 text-sm">{new Date(save.timestamp).toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onLoad(index); }}
                                                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                Load
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-zinc-500 text-center py-8">No saved games yet</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onSave}
                            className="w-full bg-zinc-100 hover:bg-black text-zinc-900 px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Save Game
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}