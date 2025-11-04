// src/app/play/components/StorySelector.tsx
'use client';

import { useStoryManagement } from '@/store/storyManagement';
import { Play, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StorySelector() {
    const { stories } = useStoryManagement();

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
            <div className="max-w-6xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Select Your Story</h1>
                    <p className="text-zinc-500">Choose a story to begin your adventure</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {Object.values(stories).map((storyData: any) => (
                        <Link
                            key={storyData.metadata.id}
                            href={`/play?story=${storyData.metadata.id}`}
                            className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg p-6 transition-all hover:bg-zinc-800/50"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white group-hover:text-zinc-100">
                                    {storyData.metadata.title}
                                </h3>
                                <Play className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                            </div>
                            <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                                {storyData.metadata.description || 'No description available'}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-zinc-600">
                                <span>{storyData.story[0]?.length || 0} nodes</span>
                                <span>•</span>
                                <span>{new Date(storyData.metadata.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Editor
                    </Link>
                </div>
            </div>
        </div>
    );
}