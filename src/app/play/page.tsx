// src/app/play/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Import the real hook — no wrappers!
import { useStoryManagement } from '@/store/storyManagement';

// Components
import PlayerUI from './components/PlayerUI';
import CharactersModal from './components/Modals/CharactersModal';
import SettingsModal from './components/Modals/SettingsModal';
import LoadingScreen from './components/LoadingScreen';
import StorySelector from './components/StorySelector';
import ErrorScreen from './components/ErrorScreen';

// Hook
import { useGameLogic } from './hooks/useGameLogic';

export default function VisualNovelPlayer() {
    const searchParams = useSearchParams();
    const storyIdParam = searchParams?.get('story');

    const { stories } = useStoryManagement();
    const gameLogic = useGameLogic(storyIdParam);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (gameLogic.showCharacters) gameLogic.setShowCharacters(false);
                if (gameLogic.showSettings) gameLogic.setShowSettings(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [gameLogic.showCharacters, gameLogic.showSettings]);


    if (!mounted) {
        return <LoadingScreen type="loading" />;
    }

    if (!storyIdParam && Object.keys(stories).length > 0) {
        return <StorySelector />;
    }

    if (gameLogic.story.length === 0) {
        return <ErrorScreen message="No Story Found" sub="Create a story in the editor to start playing" />;
    }

    if (gameLogic.characters.length === 0) {
        return <ErrorScreen message="No Characters Found" sub="Add characters in the editor to continue" />;
    }

    if (!gameLogic.currentStory) {
        return <ErrorScreen message="Story Error" sub="Unable to load story content" />;
    }

    const currentDialogue = gameLogic.state.showOptionDialogue
        ? gameLogic.currentDialogues[gameLogic.state.currentOptionDialogueIndex]
        : gameLogic.currentDialogues[gameLogic.state.currentDialogueIndex];

    const currentImageUrl = gameLogic.state.selectedImageUrls[gameLogic.state.currentImageIndex] || '';
    const isVideo = /\.(mp4|webm)$/i.test(currentImageUrl);

    return (
        <div className="relative min-h-screen bg-zinc-950">
            <PlayerUI
                currentImageUrl={currentImageUrl}
                isVideo={isVideo}
                currentDialogue={currentDialogue}
                characters={gameLogic.characters}
                state={gameLogic.state}
                availableOptions={gameLogic.availableOptions}
                onNext={gameLogic.handleNext}
                onBack={gameLogic.handleBack}
                onSelectOption={gameLogic.handleOptionSelect}
                onShowCharacters={gameLogic.setShowCharacters}
                onShowSettings={gameLogic.setShowSettings}
            />

            {gameLogic.showCharacters && (
                <CharactersModal
                    characters={gameLogic.characters}
                    selectedChar={gameLogic.selectedChar}
                    onClose={() => gameLogic.setShowCharacters(false)}
                    onSelectChar={gameLogic.setSelectedChar}
                    characterStats={gameLogic.state.characterStats}
                />
            )}

            {gameLogic.showSettings && (
                <SettingsModal
                    onClose={() => gameLogic.setShowSettings(false)}
                    onSave={gameLogic.handleSave}
                    onLoad={gameLogic.handleLoad}
                />
            )}
        </div>
    );
}