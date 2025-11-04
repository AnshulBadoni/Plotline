// src/app/play/components/ErrorScreen.tsx
'use client';

import { X } from 'lucide-react';
import Link from 'next/link';

export default function ErrorScreen({ message, sub }: { message: string; sub: string; }) {
    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-zinc-600" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{message}</h1>
                <p className="text-zinc-500 mb-6">{sub}</p>
                <Link
                    href="/"
                    className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                    Go to Editor
                </Link>
            </div>
        </div>
    );
}