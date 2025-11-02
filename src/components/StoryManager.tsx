// src/components/StoryManager.tsx
'use client';

import React, { useState } from 'react';
import { useStoryManagement } from '@/store/storyManagement';
import { Plus, Trash2, Edit, FolderOpen } from 'lucide-react';

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
            <button
                onClick={() => setIsOpen(true)}
                className="bg-neutral-800 text-gray-100 px-4 text-xs py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
                <FolderOpen className="w-5 h-5" />
                {currentStory ? currentStory.metadata.title : 'Select Story'}
            </button>

            {/* Story List Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-black rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Story Manager</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:text-gray-200 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            <button
                                onClick={() => setShowNewStoryDialog(true)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Story
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allStories.map((storyData) => (
                                    <div
                                        key={storyData.metadata.id}
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${currentStoryId === storyData.metadata.id
                                            ? 'border-purple-600 bg-purple-50'
                                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleSelectStory(storyData.metadata.id)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-800 text-lg">
                                                {storyData.metadata.title}
                                            </h3>
                                            <button
                                                onClick={(e) => handleDeleteStory(storyData.metadata.id, e)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                            {storyData.metadata.description || 'No description'}
                                        </p>

                                        <div className="text-xs text-gray-500">
                                            <p>Nodes: {storyData.story[0]?.length || 0}</p>
                                            <p>Updated: {new Date(storyData.metadata.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}

                                {allStories.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-gray-500">
                                        <p className="text-lg mb-2">No stories yet</p>
                                        <p className="text-sm">Click "Create New Story" to get started!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Story Dialog */}
            {showNewStoryDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-black rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Story</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Story Title *
                                </label>
                                <input
                                    type="text"
                                    value={newStoryTitle}
                                    onChange={(e) => setNewStoryTitle(e.target.value)}
                                    placeholder="My Amazing Story"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newStoryDesc}
                                    onChange={(e) => setNewStoryDesc(e.target.value)}
                                    placeholder="A brief description of your story..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    onClick={handleCreateStory}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => {
                                        setShowNewStoryDialog(false);
                                        setNewStoryTitle('');
                                        setNewStoryDesc('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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