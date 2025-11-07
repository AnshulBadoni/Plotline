// src/components/StoryManager.tsx
'use client';

import React, { useState } from 'react';
import { useStoryManagement } from '@/store/storyManagement';
import { Plus, Trash2, FolderOpen } from 'lucide-react';

interface StoryManagerProps {
    onStorySelect?: (storyId: string) => void;
}

export default function StoryManager({ onStorySelect }: StoryManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showNewStoryDialog, setShowNewStoryDialog] = useState(false);
    const [newStoryTitle, setNewStoryTitle] = useState('');
    const [newStoryDesc, setNewStoryDesc] = useState('');

    const {
        stories,
        currentStoryId,
        createStory,
        deleteStory,
        setCurrentStory,
        getAllStories,
    } = useStoryManagement();

    const allStories = getAllStories();

    const handleCreateStory = () => {
        if (!newStoryTitle.trim()) {
            alert('Please enter a story title');
            return;
        }

        const id = createStory(newStoryTitle, newStoryDesc);
        setNewStoryTitle('');
        setNewStoryDesc('');
        setShowNewStoryDialog(false);

        if (onStorySelect) {
            onStorySelect(id);
        }
    };

    const handleSelectStory = (id: string) => {
        setCurrentStory(id);
        setIsOpen(false);
        if (onStorySelect) {
            onStorySelect(id);
        }
    };

    const handleDeleteStory = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this story? This cannot be undone.')) {
            deleteStory(id);
        }
    };

    const currentStory = currentStoryId ? stories[currentStoryId] : null;

    return (
        <>
            {/* Main Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="group bg-neutral-800 hover:bg-neutral-700 text-gray-100 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Open Story Manager"
            >
                <FolderOpen className="w-5 h-5 text-purple-300 group-hover:text-purple-200 transition-colors" />
                <span className="text-sm truncate max-w-40">
                    {currentStory ? currentStory.metadata.title : 'Select Story'}
                </span>
            </button>

            {/* Story List Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="bg-neutral-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-neutral-800 px-6 py-5 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                Story Manager
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:text-gray-100 transition-colors focus:outline-none"
                                aria-label="Close modal"
                            >
                                <span className="text-2xl">×</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                            {/* Create Button */}
                            <button
                                onClick={() => setShowNewStoryDialog(true)}
                                className="w-full bg-gray-100 text-black font-semibold py-3 px-5 rounded-xl mb-6 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-purple-500/30"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Story
                            </button>

                            {/* Story Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {allStories.length > 0 ? (
                                    allStories.map((storyData) => (
                                        <div
                                            key={storyData.metadata.id}
                                            className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${currentStoryId === storyData.metadata.id
                                                ? 'border-purple-500 bg-purple-900/20 shadow-md'
                                                : 'border-gray-700 hover:border-purple-500/50 hover:bg-gray-800/50 bg-gray-800/30'
                                                }`}
                                            onClick={() => handleSelectStory(storyData.metadata.id)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-gray-50 text-base truncate">
                                                    {storyData.metadata.title}
                                                </h3>
                                                <button
                                                    onClick={(e) => handleDeleteStory(storyData.metadata.id, e)}
                                                    className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                                    aria-label="Delete story"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-tight">
                                                {storyData.metadata.description || 'No description provided.'}
                                            </p>

                                            <div className="text-xs text-gray-400 space-y-1">
                                                <p>
                                                    <span className="font-medium text-gray-300">Nodes:</span>{' '}
                                                    {storyData.story[0]?.length || 0}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-gray-300">Updated:</span>{' '}
                                                    {new Date(storyData.metadata.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-16 text-gray-500">
                                        <svg
                                            className="w-12 h-12 mx-auto mb-4 opacity-50"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <p className="text-lg font-medium text-gray-400 mb-1">
                                            No stories yet
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Start by creating your first story.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Story Dialog */}
            {showNewStoryDialog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => {
                        setShowNewStoryDialog(false);
                        setNewStoryTitle('');
                        setNewStoryDesc('');
                    }}
                >
                    <div
                        className="bg-neutral-900 rounded-2xl max-w-md w-full p-6 border border-gray-800 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-gray-100 mb-5">
                            Create New Story
                        </h3>

                        <div className="space-y-5">
                            {/* Title Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Story Title *
                                </label>
                                <input
                                    type="text"
                                    value={newStoryTitle}
                                    onChange={(e) => setNewStoryTitle(e.target.value)}
                                    placeholder="My Amazing Story"
                                    className="w-full px-4 py-2.5 bg-neutral-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Description Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newStoryDesc}
                                    onChange={(e) => setNewStoryDesc(e.target.value)}
                                    placeholder="A brief description of your story..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-neutral-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none transition-all"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleCreateStory}
                                    className="flex-1 bg-white text-black font-semibold py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg focus:ring-4 focus:ring-purple-500/30"
                                >
                                    Create Story
                                </button>
                                <button
                                    onClick={() => {
                                        setShowNewStoryDialog(false);
                                        setNewStoryTitle('');
                                        setNewStoryDesc('');
                                    }}
                                    className="px-4 py-2.5 text-gray-300 hover:text-gray-100 hover:bg-neutral-800 border border-gray-600 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}