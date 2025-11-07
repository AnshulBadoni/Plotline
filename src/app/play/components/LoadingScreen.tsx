// src/app/play/components/LoadingScreen.tsx
'use client';

import { X } from 'lucide-react';

export default function LoadingScreen({ type }: { type: 'loading' | 'error'; }) {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="text-center">
                {type === 'loading' ? (
                    <>
                        <div className="inline-block w-12 h-12 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mb-4"></div>
                        <p className="text-zinc-400 text-sm tracking-wide">LOADING</p>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400">Failed to load.</p>
                    </>
                )}
            </div>
        </div>
    );
}