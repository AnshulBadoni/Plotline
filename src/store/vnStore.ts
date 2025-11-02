// src/store/vnStore.ts
import { create } from 'zustand';
import { Node } from 'reactflow';
import { NodeData } from '@/types';

interface VNStore {
    selectedNode: Node<NodeData> | null;
    setSelectedNode: (node: Node<NodeData> | null) => void;
    storyMetadata: {
        id: string;
        title: string;
        description: string;
        startNode: string;
    };
    setStoryMetadata: (metadata: Partial<VNStore['storyMetadata']>) => void;
}

export const useVNStore = create<VNStore>((set) => ({
    selectedNode: null,
    setSelectedNode: (node) => set({ selectedNode: node }),
    storyMetadata: {
        id: 'my_story',
        title: 'My Visual Novel',
        description: 'An amazing interactive story',
        startNode: '',
    },
    setStoryMetadata: (metadata) =>
        set((state) => ({
            storyMetadata: { ...state.storyMetadata, ...metadata },
        })),
}));