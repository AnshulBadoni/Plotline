// src/app/play/page.tsx - COMPLETE FILE WITH FIXES

'use client';

import React, { useEffect, useState, useCallback, useMemo, useReducer } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronLeft, Menu, X, User, Settings, ArrowLeft, Play, Heart, Zap, Shield } from 'lucide-react';
import { useStoryManagement } from '@/store/storyManagement';

// ==================== TYPES ====================
interface Character {
    id: number;
    name: string;
    role: string;
    color: string;
    emoji: string;
    details: Record<string, string>;
    image: string;
    bgImage: string;
}

interface Condition {
    character: string;
    attribute: string;
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'random' | 'mainEvent';
    value: string;
}

interface Dialogue {
    character: string;
    dialogue: string;
}

interface DialogueBlock {
    conditions: Condition[];
    dialogues: Dialogue[];
}

interface StoryImage {
    conditions: Condition[];
    url: string[];
    title: string;
}

interface Loop {
    conditions: Condition[];
}

interface StoryOption {
    option: string;
    nextPieceId: number;
    effects: Condition[];
    dialogueBlocks: DialogueBlock[];
    images: StoryImage[];
    loop: Loop[];
    showWhen: Condition[];
}

interface StoryPiece {
    id: number;
    title: string;
    randomEvent?: number;
    dialogueBlocks: DialogueBlock[];
    images: StoryImage[];
    options: StoryOption[];
    nextStoryPiece: number;
}

interface GameState {
    currentStoryId: number;
    currentDialogueIndex: number;
    currentImageIndex: number;
    showOptions: boolean;
    showOptionDialogue: boolean;
    selectedOption: StoryOption | null;
    currentOptionDialogueIndex: number;
    characterStats: Record<string, Record<string, string>>;
    selectedImageUrls: string[];
    usedOptions: Set<string>;
    suppressDefaultDialogue: boolean;
    storyRandom: number;
}

interface SavedGame {
    currentStoryId: number;
    currentDialogueIndex: number;
    currentImageIndex: number;
    showOptions: boolean;
    showOptionDialogue: boolean;
    selectedOption: StoryOption | null;
    currentOptionDialogueIndex: number;
    characterStats: Record<string, Record<string, string>>;
    selectedImageUrls: string[];
    usedOptions: string[]; // 👈 Array for JSON serialization
    suppressDefaultDialogue: boolean;
    storyRandom: number;
    timestamp: number;
    history: any[];
}

// ==================== GAME REDUCER ====================
type GameAction =
    | { type: 'NEXT_DIALOGUE' }
    | { type: 'NEXT_IMAGE' }
    | { type: 'SHOW_OPTIONS' }
    | { type: 'SELECT_OPTION'; payload: StoryOption }
    | { type: 'COMPLETE_OPTION_DIALOGUE' }
    | { type: 'MOVE_TO_STORY'; payload: number }
    | { type: 'APPLY_EFFECTS'; payload: Condition[] }
    | { type: 'SET_IMAGE_URLS'; payload: string[] }
    | { type: 'RESET_FOR_NEW_PIECE' }
    | { type: 'SUPPRESS_DEFAULT_DIALOGUE'; payload: boolean }
    | { type: 'LOAD_STATE'; payload: GameState }
    | { type: 'SET_RANDOM'; payload: number };

function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'NEXT_DIALOGUE':
            return state.showOptionDialogue
                ? { ...state, currentOptionDialogueIndex: state.currentOptionDialogueIndex + 1 }
                : { ...state, currentDialogueIndex: state.currentDialogueIndex + 1 };

        case 'NEXT_IMAGE':
            return {
                ...state,
                currentImageIndex: Math.min(state.currentImageIndex + 1, state.selectedImageUrls.length - 1),
            };

        case 'SHOW_OPTIONS':
            return { ...state, showOptions: true };

        case 'SELECT_OPTION':
            return {
                ...state,
                selectedOption: action.payload,
                showOptions: false,
                showOptionDialogue: true,
                currentOptionDialogueIndex: 0,
                currentImageIndex: 0,
                usedOptions: new Set([...state.usedOptions, action.payload.option]),
            };

        case 'COMPLETE_OPTION_DIALOGUE':
            return {
                ...state,
                showOptionDialogue: false,
                selectedOption: null,
                currentOptionDialogueIndex: 0,
            };

        case 'MOVE_TO_STORY':
            return {
                ...state,
                currentStoryId: action.payload,
                currentDialogueIndex: 0,
                currentImageIndex: 0,
                showOptions: false,
                showOptionDialogue: false,
                selectedOption: null,
                currentOptionDialogueIndex: 0,
                usedOptions: new Set(),
                suppressDefaultDialogue: false,
            };

        case 'APPLY_EFFECTS': {
            const newStats = { ...state.characterStats };
            action.payload.forEach((effect) => {
                const { character, attribute, operator, value } = effect;
                if (!character || !attribute || !value || !newStats[character]) return;

                const current = parseFloat(newStats[character][attribute]) || 0;
                const effectValue = parseFloat(value) || 0;

                switch (operator) {
                    case '=':
                        newStats[character][attribute] = value;
                        break;
                    case '+':
                        newStats[character][attribute] = (current + effectValue).toString();
                        break;
                    case '-':
                        newStats[character][attribute] = Math.max(0, current - effectValue).toString();
                        break;
                }
            });
            return { ...state, characterStats: newStats };
        }

        case 'SET_IMAGE_URLS':
            return { ...state, selectedImageUrls: action.payload, currentImageIndex: 0 };

        case 'RESET_FOR_NEW_PIECE':
            return {
                ...state,
                usedOptions: new Set(),
                suppressDefaultDialogue: false,
                currentDialogueIndex: 0,
                currentImageIndex: 0,
                showOptions: false,
            };

        case 'SUPPRESS_DEFAULT_DIALOGUE':
            return { ...state, suppressDefaultDialogue: action.payload };

        case 'SET_RANDOM':
            return { ...state, storyRandom: action.payload };

        case 'LOAD_STATE':
            return { ...action.payload };

        default:
            return state;
    }
}

// ==================== HELPER FUNCTIONS ====================
function loadStoryFromStorage(): StoryPiece[] {
    try {
        const storyRaw = localStorage.getItem('story');
        if (!storyRaw) return [];

        const parsed = JSON.parse(storyRaw);

        if (parsed?.story && Array.isArray(parsed.story)) {
            if (Array.isArray(parsed.story[0])) {
                return parsed.story[0];
            }
            return parsed.story;
        }

        if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
            return parsed[0];
        }

        if (Array.isArray(parsed)) {
            return parsed;
        }

        return [];
    } catch (error) {
        console.error('Error loading story:', error);
        return [];
    }
}

function loadCharactersFromStorage(): Character[] {
    try {
        const charsRaw = localStorage.getItem('characters');
        if (!charsRaw) return [];

        const parsed = JSON.parse(charsRaw);

        if (Array.isArray(parsed)) {
            return parsed;
        }

        return [];
    } catch (error) {
        console.error('Error loading characters:', error);
        return [];
    }
}

// ==================== MAIN COMPONENT ====================
export default function VisualNovelPlayer() {
    const searchParams = useSearchParams();
    const storyIdParam = searchParams?.get('story');

    const { stories } = useStoryManagement();
    const [mounted, setMounted] = useState(false);
    const [story, setStory] = useState<StoryPiece[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [history, setHistory] = useState<GameState[]>([]);
    const [showCharacters, setShowCharacters] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedChar, setSelectedChar] = useState<Character | null>(null);

    const [state, dispatch] = useReducer(gameReducer, {
        currentStoryId: 0,
        currentDialogueIndex: 0,
        currentImageIndex: 0,
        showOptions: false,
        showOptionDialogue: false,
        selectedOption: null,
        currentOptionDialogueIndex: 0,
        characterStats: {},
        selectedImageUrls: [],
        usedOptions: new Set(),
        suppressDefaultDialogue: false,
        storyRandom: 0,
    });

    useEffect(() => {
        let loadedStoryData: StoryPiece[] = [];

        if (storyIdParam && stories[storyIdParam]) {
            const selectedStory = stories[storyIdParam];
            loadedStoryData = selectedStory.story[0] || [];
        } else {
            loadedStoryData = loadStoryFromStorage();
        }

        const loadedChars = loadCharactersFromStorage();

        setStory(loadedStoryData);
        setCharacters(loadedChars);

        const stats: Record<string, Record<string, string>> = {};
        loadedChars.forEach((char) => {
            stats[char.name] = { ...(char.details || {}) };
        });

        if (loadedStoryData.length > 0) {
            dispatch({
                type: 'LOAD_STATE',
                payload: {
                    currentStoryId: loadedStoryData[0].id,
                    currentDialogueIndex: 0,
                    currentImageIndex: 0,
                    showOptions: false,
                    showOptionDialogue: false,
                    selectedOption: null,
                    currentOptionDialogueIndex: 0,
                    characterStats: stats,
                    selectedImageUrls: [],
                    usedOptions: new Set(),
                    suppressDefaultDialogue: false,
                    storyRandom: 0,
                },
            });
        }

        setMounted(true);
    }, [storyIdParam, stories]);

    const currentStory = useMemo(() => {
        if (!story || !Array.isArray(story) || story.length === 0) {
            return null;
        }
        const found = story.find((p) => p.id === state.currentStoryId);
        return found || story[0] || null;
    }, [story, state.currentStoryId]);

    const checkConditions = useCallback(
        (conditions: Condition[]): boolean => {
            if (!conditions?.length) return true;

            return conditions.every((condition) => {
                const { character, attribute, operator, value } = condition;

                if (attribute === '0') {
                    const numValue = parseInt(value);
                    switch (operator) {
                        case '==': return state.storyRandom === numValue;
                        case '!=': return state.storyRandom !== numValue;
                        case '>': return state.storyRandom > numValue;
                        case '<': return state.storyRandom < numValue;
                        case '>=': return state.storyRandom >= numValue;
                        case '<=': return state.storyRandom <= numValue;
                        default: return false;
                    }
                }

                if (!character || !attribute) return true;

                const currentValue = parseFloat(state.characterStats[character]?.[attribute]) || 0;
                const checkValue = parseFloat(value) || 0;

                switch (operator) {
                    case '==': return currentValue === checkValue;
                    case '!=': return currentValue !== checkValue;
                    case '>': return currentValue > checkValue;
                    case '<': return currentValue < checkValue;
                    case '>=': return currentValue >= checkValue;
                    case '<=': return currentValue <= checkValue;
                    case 'random': return Math.random() * 10 <= checkValue;
                    default: return false;
                }
            });
        },
        [state.characterStats, state.storyRandom]
    );

    const getValidBlocks = useCallback(
        (blocks: DialogueBlock[]) => {
            if (!blocks || !Array.isArray(blocks)) return [];
            return blocks.filter((b) => checkConditions(b.conditions));
        },
        [checkConditions]
    );

    const getValidImages = useCallback(
        (images: StoryImage[]) => {
            if (!images || !Array.isArray(images)) return [];
            return images.filter((img) => checkConditions(img.conditions));
        },
        [checkConditions]
    );

    const getRandomDialogues = useCallback((blocks: DialogueBlock[]) => {
        const valid = getValidBlocks(blocks);
        return valid.flatMap((block) => {
            if (!block.dialogues?.length) return [];
            const idx = Math.floor(Math.random() * block.dialogues.length);
            return [block.dialogues[idx]];
        });
    }, [getValidBlocks]);

    useEffect(() => {
        if (!currentStory) return;

        const images = state.showOptionDialogue && state.selectedOption
            ? getValidImages(state.selectedOption.images || [])
            : getValidImages(currentStory?.images || []);

        const urls = images
            .map((img) => {
                if (Array.isArray(img.url) && img.url.length > 0) {
                    const randomUrl = img.url[Math.floor(Math.random() * img.url.length)];
                    return randomUrl;
                } else if (typeof img.url === 'string' && img.url.trim()) {
                    return img.url;
                }
                return undefined;
            })
            .filter((url): url is string => !!url && url.trim().length > 0);

        dispatch({ type: 'SET_IMAGE_URLS', payload: urls });
    }, [state.currentStoryId, state.showOptionDialogue, state.selectedOption, currentStory, getValidImages]);

    useEffect(() => {
        if (currentStory?.randomEvent !== undefined) {
            dispatch({ type: 'SET_RANDOM', payload: Math.floor(Math.random() * currentStory.randomEvent) });
        }
    }, [currentStory?.id]);

    const currentDialogues = useMemo(() => {
        if (!currentStory) return [];

        if (state.showOptionDialogue && state.selectedOption) {
            return getRandomDialogues(state.selectedOption.dialogueBlocks || []);
        }
        if (state.suppressDefaultDialogue) return [];
        return getRandomDialogues(currentStory?.dialogueBlocks || []);
    }, [
        state.showOptionDialogue,
        state.selectedOption,
        state.suppressDefaultDialogue,
        currentStory,
        getRandomDialogues,
    ]);

    const currentDialogue = state.showOptionDialogue
        ? currentDialogues[state.currentOptionDialogueIndex]
        : currentDialogues[state.currentDialogueIndex];

    const availableOptions = useMemo(() => {
        if (!currentStory || !currentStory.options) return [];

        // 👇 FIX: Ensure usedOptions is always a Set
        const usedOptionsSet = state.usedOptions instanceof Set
            ? state.usedOptions
            : new Set(state.usedOptions);

        return currentStory.options.filter(
            (opt) =>
                opt.option?.trim() &&
                checkConditions(opt.showWhen || []) &&
                !usedOptionsSet.has(opt.option)
        );
    }, [currentStory, checkConditions, state.usedOptions]);

    const saveHistory = useCallback(() => {
        setHistory((prev) => [...prev, { ...state }]);
    }, [state]);

    const moveToNextPiece = useCallback((targetId?: number) => {
        if (!Array.isArray(story) || story.length === 0) return;

        let nextId: number | null | undefined = targetId;

        if (nextId === undefined || nextId === null) {
            nextId = currentStory?.nextStoryPiece;
        }

        if (nextId === null || nextId === undefined || nextId === -1) {
            return;
        }

        const nextPiece = story.find((p) => p.id === nextId);

        if (nextPiece) {
            dispatch({ type: 'MOVE_TO_STORY', payload: nextId });
        }
    }, [story, currentStory]);

    const handleNext = useCallback(() => {
        saveHistory();

        if (state.currentImageIndex < state.selectedImageUrls.length - 1) {
            dispatch({ type: 'NEXT_IMAGE' });
        }

        if (state.showOptionDialogue && state.selectedOption) {
            const optDialogues = getRandomDialogues(state.selectedOption.dialogueBlocks || []);

            if (state.currentOptionDialogueIndex < optDialogues.length - 1) {
                dispatch({ type: 'NEXT_DIALOGUE' });
            } else {
                handleOptionComplete();
            }
            return;
        }

        if (!state.suppressDefaultDialogue && state.currentDialogueIndex < currentDialogues.length - 1) {
            dispatch({ type: 'NEXT_DIALOGUE' });
            return;
        }

        if (availableOptions.length > 0) {
            dispatch({ type: 'SHOW_OPTIONS' });
        } else {
            moveToNextPiece();
        }
    }, [state, currentDialogues, availableOptions, saveHistory, getRandomDialogues, moveToNextPiece]);

    const handleOptionSelect = useCallback(
        (option: StoryOption) => {
            saveHistory();

            if (option.effects && option.effects.length > 0) {
                dispatch({ type: 'APPLY_EFFECTS', payload: option.effects });
            }

            const optDialogues = getRandomDialogues(option.dialogueBlocks || []);

            dispatch({ type: 'SELECT_OPTION', payload: option });

            if (optDialogues.length > 0) {
                return;
            }

            const shouldLoop = option.loop && option.loop.length > 0
                ? option.loop.some((loop) => !checkConditions(loop.conditions))
                : false;

            if (shouldLoop) {
                dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
                dispatch({ type: 'SUPPRESS_DEFAULT_DIALOGUE', payload: true });
                dispatch({ type: 'SHOW_OPTIONS' });
            } else {
                dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
                moveToNextPiece(option.nextPieceId);
            }
        },
        [saveHistory, getRandomDialogues, checkConditions, moveToNextPiece]
    );

    const handleOptionComplete = useCallback(() => {
        if (!state.selectedOption) {
            moveToNextPiece();
            return;
        }

        const option = state.selectedOption;

        const shouldLoop = option.loop && option.loop.length > 0
            ? option.loop.some((loop) => !checkConditions(loop.conditions))
            : false;

        if (shouldLoop) {
            dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
            dispatch({ type: 'SUPPRESS_DEFAULT_DIALOGUE', payload: true });
            dispatch({ type: 'SHOW_OPTIONS' });
        } else {
            dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
            moveToNextPiece(option.nextPieceId);
        }
    }, [state.selectedOption, checkConditions, moveToNextPiece]);

    const handleBack = useCallback(() => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        dispatch({ type: 'LOAD_STATE', payload: prev });
        setHistory((h) => h.slice(0, -1));
    }, [history]);

    // 👇 FIX: Convert Set to Array for JSON serialization
    const handleSave = useCallback(() => {
        const saves = JSON.parse(localStorage.getItem('saved-games') || '[]');
        const newSave: SavedGame = {
            ...state,
            usedOptions: Array.from(state.usedOptions), // Convert Set to Array
            history: history.map(h => ({
                ...h,
                usedOptions: Array.from(h.usedOptions), // Convert Sets in history too
            })),
            timestamp: Date.now(),
        };
        localStorage.setItem('saved-games', JSON.stringify([...saves, newSave]));
        alert('Game saved successfully!');
    }, [state, history]);

    // 👇 FIX: Convert Array back to Set when loading
    const handleLoad = useCallback((saveIndex: number) => {
        const saves = JSON.parse(localStorage.getItem('saved-games') || '[]');
        const save = saves[saveIndex];
        if (save) {
            const loadedState: GameState = {
                ...save,
                usedOptions: new Set(save.usedOptions || []), // Convert Array to Set
            };
            dispatch({ type: 'LOAD_STATE', payload: loadedState });

            // Convert history arrays to Sets
            const loadedHistory = (save.history || []).map((h: any) => ({
                ...h,
                usedOptions: new Set(h.usedOptions || []),
            }));
            setHistory(loadedHistory);
            setShowSettings(false);
        }
    }, []);

    // Loading/error screens...
    if (!mounted) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mb-4"></div>
                    <p className="text-zinc-400 text-sm tracking-wide">LOADING</p>
                </div>
            </div>
        );
    }

    if (!storyIdParam && Object.keys(stories).length > 0) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="max-w-6xl w-full">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Select Your Story</h1>
                        <p className="text-zinc-500">Choose a story to begin your adventure</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {Object.values(stories).map((storyData: any) => (
                            <a
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
                            </a>
                        ))}
                    </div>

                    <div className="text-center">
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Editor
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    if (!Array.isArray(story) || story.length === 0) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">No Story Found</h1>
                    <p className="text-zinc-500 mb-6">Create a story in the editor to start playing</p>
                    <a
                        href="/"
                        className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                        Go to Editor
                    </a>
                </div>
            </div>
        );
    }

    if (!Array.isArray(characters) || characters.length === 0) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">No Characters Found</h1>
                    <p className="text-zinc-500 mb-6">Add characters in the editor to continue</p>
                    <a
                        href="/"
                        className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                        Go to Editor
                    </a>
                </div>
            </div>
        );
    }

    if (!currentStory) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold text-white mb-2">Story Error</h1>
                    <p className="text-zinc-500 mb-6">Unable to load story content</p>
                    <a
                        href="/"
                        className="inline-block bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                        Go to Editor
                    </a>
                </div>
            </div>
        );
    }

    const currentImageUrl = state.selectedImageUrls[state.currentImageIndex];
    const isVideo = currentImageUrl?.match(/\.(mp4|webm|avi|mov|mkv)$/i);
    const character = characters.find((c) => c.name === currentDialogue?.character);

    // Helper function to get stat icon
    const getStatIcon = (key: string) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('health') || lowerKey.includes('hp')) return <Heart className="w-4 h-4" />;
        if (lowerKey.includes('power') || lowerKey.includes('attack')) return <Zap className="w-4 h-4" />;
        if (lowerKey.includes('defense') || lowerKey.includes('shield')) return <Shield className="w-4 h-4" />;
        return null;
    };

    return (
        <div className="relative min-h-screen bg-zinc-950">
            {/* Background */}
            {currentImageUrl ? (
                <div className="absolute inset-0">
                    {isVideo ? (
                        <video src={currentImageUrl} autoPlay muted loop className="w-full h-full object-cover" />
                    ) : (
                        <img src={currentImageUrl} alt="Story background" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/60" />
                </div>
            ) : (
                <div className="absolute inset-0 bg-zinc-950" />
            )}

            {/* Main UI */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Top Bar */}
                <div className="p-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        {history.length > 0 ? (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-zinc-800"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="text-sm font-medium">Back</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowCharacters(true)}
                                className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-zinc-800"
                            >
                                <User className="w-4 h-4" />
                                <span className="text-sm font-medium">Characters</span>
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-300 hover:text-white p-2 rounded-lg transition-all backdrop-blur-sm border border-zinc-800"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex items-end p-6 pb-12">
                    <div className="w-full max-w-5xl mx-auto space-y-6">
                        {/* Dialogue Box */}
                        {!state.showOptions && currentDialogue && (
                            <div className="bg-zinc-900/95 backdrop-blur-md rounded-2xl overflow-hidden border border-zinc-800/50 shadow-2xl">

                                <div className="p-8">
                                    <div className="flex items-start gap-6">
                                        {character && (
                                            <div className="shrink-0">
                                                {character.image ? (
                                                    <div className="relative">
                                                        <img
                                                            src={character.image}
                                                            alt={character.name}
                                                            className="w-24 h-24 rounded-full object-cover border-4 border-zinc-800 ring-2 ring-zinc-700"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`w-24 h-24 rounded-full ${character.color} flex items-center justify-center text-4xl border-4 border-zinc-800 ring-2 ring-zinc-700`}>
                                                        {character.emoji}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-2xl font-bold text-white mb-4 capitalize tracking-wide">
                                                {currentDialogue.character}
                                            </h3>
                                            <p className="text-zinc-100 text-lg leading-relaxed">
                                                {currentDialogue.dialogue}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Options */}
                        {state.showOptions && availableOptions.length > 0 && (
                            <div className="space-y-3">
                                {availableOptions.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleOptionSelect(option)}
                                        className="w-full bg-zinc-900/95 hover:bg-zinc-800/95 backdrop-blur-md border border-zinc-800/50 hover:border-zinc-700 rounded-xl p-6 transition-all text-left group shadow-lg"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-100 font-medium text-lg pr-4">
                                                {option.option}
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Next Button */}
                        {!state.showOptions && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleNext}
                                    className="bg-zinc-100 hover:bg-black text-zinc-900 px-10 py-4 rounded-xl font-semibold transition-all flex items-center gap-3 shadow-lg text-lg"
                                >
                                    <span>Continue</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 👇 IMPROVED Characters Modal */}
            {showCharacters && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4" onClick={() => { setShowCharacters(false); setSelectedChar(null); }}>
                    <div className="bg-zinc-900 rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-zinc-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-zinc-950 border-b border-zinc-800 p-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Characters</h2>
                                    <p className="text-zinc-500">View your story characters and their stats</p>
                                </div>
                                <button onClick={() => { setShowCharacters(false); setSelectedChar(null); }} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
                            {!selectedChar ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {characters.map((char) => (
                                        <button
                                            key={char.id}
                                            onClick={() => setSelectedChar(char)}
                                            className="bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-600 rounded-xl overflow-hidden transition-all text-left group hover:scale-105"
                                        >
                                            {/* Character Banner */}
                                            <div className="relative h-32 bg-zinc-900 overflow-hidden">
                                                {char.bgImage ? (
                                                    <img src={char.bgImage} alt="" className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity" />
                                                ) : (
                                                    <div className={`w-full h-full ${char.color} opacity-20`} />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-800 to-transparent" />
                                            </div>

                                            {/* Character Info */}
                                            <div className="p-6 -mt-12 relative">
                                                <div className="flex items-end gap-4 mb-4">
                                                    {char.image ? (
                                                        <img src={char.image} alt={char.name} className="w-20 h-20 rounded-full object-cover border-4 border-zinc-800 ring-2 ring-zinc-700 shadow-xl" />
                                                    ) : (
                                                        <div className={`w-20 h-20 rounded-full ${char.color} flex items-center justify-center text-4xl border-4 border-zinc-800 ring-2 ring-zinc-700 shadow-xl`}>
                                                            {char.emoji}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 mb-1">
                                                        <h3 className="text-xl font-bold text-white capitalize group-hover:text-zinc-100 transition-colors">
                                                            {char.name}
                                                        </h3>
                                                        <p className="text-sm text-zinc-400 capitalize">{char.role}</p>
                                                    </div>
                                                </div>

                                                {/* Stats Preview */}
                                                {char.details && Object.keys(char.details).length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        {Object.entries(char.details).slice(0, 3).map(([key, value]) => (
                                                            <div key={key} className="bg-zinc-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                                <div className="text-zinc-400">{getStatIcon(key)}</div>
                                                                <span className="text-zinc-300 text-xs font-medium capitalize">{key}: {value}</span>
                                                            </div>
                                                        ))}
                                                        {Object.keys(char.details).length > 3 && (
                                                            <div className="bg-zinc-700/50 px-3 py-1.5 rounded-lg text-zinc-400 text-xs">
                                                                +{Object.keys(char.details).length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto">
                                    <button
                                        onClick={() => setSelectedChar(null)}
                                        className="mb-6 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors px-4 py-2 hover:bg-zinc-800 rounded-lg"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span className="font-medium">Back to all characters</span>
                                    </button>

                                    <div className="bg-zinc-800 border-2 border-zinc-700 rounded-2xl overflow-hidden">
                                        {/* Character Header */}
                                        <div className="relative h-64 bg-zinc-900">
                                            {selectedChar.bgImage ? (
                                                <img src={selectedChar.bgImage} alt="" className="w-full h-full object-cover opacity-40" />
                                            ) : (
                                                <div className={`w-full h-full ${selectedChar.color} opacity-20`} />
                                            )}
                                            <div className="absolute inset-0 bg-linear-to-t from-zinc-800 via-zinc-800/60 to-transparent" />

                                            <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-6">
                                                {selectedChar.image ? (
                                                    <img src={selectedChar.image} alt={selectedChar.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-zinc-800 ring-2 ring-zinc-700 shadow-2xl" />
                                                ) : (
                                                    <div className={`w-32 h-32 rounded-2xl ${selectedChar.color} flex items-center justify-center text-6xl border-4 border-zinc-800 ring-2 ring-zinc-700 shadow-2xl`}>
                                                        {selectedChar.emoji}
                                                    </div>
                                                )}
                                                <div className="flex-1 pb-2">
                                                    <h2 className="text-4xl font-bold text-white capitalize mb-1">{selectedChar.name}</h2>
                                                    <p className="text-zinc-300 text-lg capitalize flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${selectedChar.role === 'friend' ? 'bg-green-500' : selectedChar.role === 'foe' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                                        {selectedChar.role}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Character Stats */}
                                        {selectedChar.details && Object.keys(selectedChar.details).length > 0 && (
                                            <div className="p-8">
                                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                                    <span className="w-1 h-6 bg-zinc-600 rounded" />
                                                    Statistics
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {Object.entries(state.characterStats[selectedChar.name] || selectedChar.details).map(([key, value]) => (
                                                        <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                                                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                                                {getStatIcon(key)}
                                                                <span className="text-sm font-medium capitalize">{key}</span>
                                                            </div>
                                                            <div className="text-4xl font-bold text-white">{value}</div>
                                                            <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-zinc-600 rounded-full transition-all"
                                                                    style={{ width: `${Math.min(parseFloat(value) || 0, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal (keep same) */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
                    <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-zinc-800" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-zinc-950 border-b border-zinc-800 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">Saved Games</h3>
                                    <div className="space-y-3">
                                        {JSON.parse(localStorage.getItem('saved-games') || '[]').map((save: SavedGame, index: number) => (
                                            <div key={index} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center justify-between">
                                                <div>
                                                    <p className="text-white font-medium">Save Slot {index + 1}</p>
                                                    <p className="text-zinc-500 text-sm">{new Date(save.timestamp).toLocaleString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleLoad(index)}
                                                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    Load
                                                </button>
                                            </div>
                                        ))}
                                        {JSON.parse(localStorage.getItem('saved-games') || '[]').length === 0 && (
                                            <p className="text-zinc-500 text-center py-8">No saved games yet</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSave}
                                    className="w-full bg-zinc-100 hover:bg-black text-zinc-900 px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Save Game
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}