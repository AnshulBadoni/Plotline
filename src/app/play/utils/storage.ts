// src/app/play/utils/storage.ts

import { StoryPiece } from '@/types';

export function loadStoryFromStorage(): StoryPiece[] {
    try {
        const storyRaw = localStorage.getItem('story');
        if (!storyRaw) return [];

        const parsed = JSON.parse(storyRaw);

        if (parsed?.story && Array.isArray(parsed.story)) {
            if (Array.isArray(parsed.story[0])) return parsed.story[0];
            return parsed.story;
        }

        if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
            return parsed[0];
        }

        if (Array.isArray(parsed)) return parsed;

        return [];
    } catch (error) {
        console.error('Error loading story:', error);
        return [];
    }
}

export function loadCharactersFromStorage(): any[] {
    try {
        const charsRaw = localStorage.getItem('vn-characters');
        console.log('Raw characters data:', charsRaw);
        
        if (!charsRaw) return [];

        const parsed = JSON.parse(charsRaw);
        
        if (parsed?.state?.characters && Array.isArray(parsed.state.characters)) {
            console.log('Loaded characters:', parsed.state.characters);
            return parsed.state.characters;
        }
        
        if (Array.isArray(parsed)) {
            return parsed;
        }
        
        return [];
    } catch (error) {
        console.error('Error loading characters:', error);
        return [];
    }
}