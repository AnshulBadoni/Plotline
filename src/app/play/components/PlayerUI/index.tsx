'use client';

import Background from './Background';
import TopBar from './TopBar';
import DialogueBox from './DialogueBox';
import OptionsList from './OptionsList';
import NextButton from './NextButton';

export default function PlayerUI({
    currentImageUrl,
    isVideo,
    currentDialogue,
    characters,
    state,
    availableOptions,
    onNext,
    onBack,
    onSelectOption,
    onShowCharacters,
    onShowSettings,
}: any) {
    const character = characters.find((c: any) => c.name === currentDialogue?.character);

    return (
        <>
            <Background imageUrl={currentImageUrl} isVideo={isVideo} />
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Pass the toggle handlers */}
                <TopBar
                    onBack={onBack}
                    onShowCharacters={onShowCharacters}
                    onShowSettings={onShowSettings}
                />
                <div className="flex-1 flex items-end p-6 pb-12">
                    <div className="w-full max-w-5xl mx-auto space-y-6">
                        {!state.showOptions && currentDialogue && (
                            <DialogueBox character={character} dialogue={currentDialogue.dialogue} />
                        )}
                        {state.showOptions && availableOptions.length > 0 && (
                            <OptionsList options={availableOptions} onSelect={onSelectOption} />
                        )}
                        {!state.showOptions && <NextButton onNext={onNext} />}
                    </div>
                </div>
            </div>
        </>
    );
}