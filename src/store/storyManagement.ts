// src/store/storyManagementStore.ts - ADD addStory FUNCTION

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StoryMetadata {
    id: string;
    title: string;
    description: string;
    thumbnail?: string;
    createdAt: number;
    updatedAt: number;
}

export interface StoryData {
    metadata: StoryMetadata;
    story: any[][]; // Your story structure
}

interface StoryManagementStore {
    stories: Record<string, StoryData>;
    currentStoryId: string | null;

    createStory: (title: string, description: string) => string;
    updateStory: (id: string, storyData: any[][]) => void;
    deleteStory: (id: string) => void;
    setCurrentStory: (id: string) => void;
    getCurrentStory: () => StoryData | null;
    getAllStories: () => StoryData[];
    updateMetadata: (id: string, metadata: Partial<StoryMetadata>) => void;
    addStory: (story: StoryData) => void; // 👈 ADD THIS
}

export const useStoryManagement = create<StoryManagementStore>()(
    persist(
        (set, get) => ({
            stories: {},
            currentStoryId: null,

            createStory: (title: string, description: string) => {
                const id = `story_${Date.now()}`;
                const newStory: StoryData = {
                    metadata: {
                        id,
                        title,
                        description,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                    story: [[]],
                };

                set((state) => ({
                    stories: { ...state.stories, [id]: newStory },
                    currentStoryId: id,
                }));

                return id;
            },

            updateStory: (id: string, storyData: any[][]) => {
                set((state) => {
                    const story = state.stories[id];
                    if (!story) return state;

                    return {
                        stories: {
                            ...state.stories,
                            [id]: {
                                ...story,
                                story: storyData,
                                metadata: {
                                    ...story.metadata,
                                    updatedAt: Date.now(),
                                },
                            },
                        },
                    };
                });
            },

            deleteStory: (id: string) => {
                set((state) => {
                    const newStories = { ...state.stories };
                    delete newStories[id];

                    return {
                        stories: newStories,
                        currentStoryId: state.currentStoryId === id ? null : state.currentStoryId,
                    };
                });
            },

            setCurrentStory: (id: string) => {
                set({ currentStoryId: id });
            },

            getCurrentStory: () => {
                const state = get();
                return state.currentStoryId ? state.stories[state.currentStoryId] || null : null;
            },

            getAllStories: () => {
                return Object.values(get().stories);
            },

            updateMetadata: (id: string, metadata: Partial<StoryMetadata>) => {
                set((state) => {
                    const story = state.stories[id];
                    if (!story) return state;

                    return {
                        stories: {
                            ...state.stories,
                            [id]: {
                                ...story,
                                metadata: {
                                    ...story.metadata,
                                    ...metadata,
                                    updatedAt: Date.now(),
                                },
                            },
                        },
                    };
                });
            },

            // 👇 ADD THIS FUNCTION
            addStory: (story: StoryData) => {
                set((state) => ({
                    stories: {
                        ...state.stories,
                        [story.metadata.id]: story,
                    },
                }));
            },
        }),
        {
            name: 'vn-stories',
        }
    )
);