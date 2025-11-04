// src/app/play/hooks/useGameLogic.ts
import { useStoryManagement } from '@/store/storyManagement';
import { useEffect, useReducer, useCallback, useMemo, useState } from 'react';
import { loadStoryFromStorage, loadCharactersFromStorage } from '../utils/storage';
import { GameState, GameAction, StoryPiece, Character, SavedGame } from '@/types';

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
                usedOptions: new Set<string>(),
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

export function useGameLogic(storyIdParam: string | null) {
    const { stories } = useStoryManagement();
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
        usedOptions: new Set<string>(),
        suppressDefaultDialogue: false,
        storyRandom: 0,
    });

    // ✅ Initialize story and characters
    useEffect(() => {
        let loadedStoryData: StoryPiece[] = [];

        if (storyIdParam && stories[storyIdParam]) {
            const selectedStory = stories[storyIdParam];
            loadedStoryData = Array.isArray(selectedStory.story[0]) ? selectedStory.story[0] : selectedStory.story;
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
    }, [storyIdParam, stories]);

    const currentStory = useMemo(() => {
        if (!story || story.length === 0) return null;
        return story.find((p) => p.id === state.currentStoryId) || story[0];
    }, [story, state.currentStoryId]);

    const checkConditions = useCallback(
        (conditions: any[]): boolean => {
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
        (blocks: any[]) => blocks?.filter((b) => checkConditions(b.conditions)) || [],
        [checkConditions]
    );

    const getValidImages = useCallback(
        (images: any[]) => images?.filter((img) => checkConditions(img.conditions)) || [],
        [checkConditions]
    );

    const getRandomDialogues = useCallback(
        (blocks: any[]) => {
            const valid = getValidBlocks(blocks);
            return valid.flatMap((block) => {
                if (!block.dialogues?.length) return [];
                const idx = Math.floor(Math.random() * block.dialogues.length);
                return [block.dialogues[idx]];
            });
        },
        [getValidBlocks]
    );

    useEffect(() => {
        if (!currentStory) return;

        // Choose which images to use
        const imageList = state.showOptionDialogue && state.selectedOption
            ? getValidImages(state.selectedOption.images || [])
            : getValidImages(currentStory.images || []);

        // For each valid image block, pick one random URL if it's an array
        const chosenUrls = imageList
            .map((img) => {
                if (Array.isArray(img.url) && img.url.length > 0) {
                    return img.url[Math.floor(Math.random() * img.url.length)];
                }
                if (typeof img.url === 'string') {
                    return img.url;
                }
                return null;
            })
            .filter((url): url is string => !!url);

        // 🔁 Only update if changed — avoid unnecessary re-renders
        if (
            chosenUrls.length !== state.selectedImageUrls.length ||
            chosenUrls.some((url, i) => url !== state.selectedImageUrls[i])
        ) {
            dispatch({ type: 'SET_IMAGE_URLS', payload: chosenUrls });
        }
    }, [
        currentStory,
        state.showOptionDialogue,
        state.selectedOption,
        getValidImages,
        state.selectedImageUrls,
    ]);

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
        return getRandomDialogues(currentStory.dialogueBlocks || []);
    }, [state, currentStory, getRandomDialogues]);

    const availableOptions = useMemo(() => {
        if (!currentStory?.options) return [];
        const usedOptionsSet = state.usedOptions instanceof Set ? state.usedOptions : new Set(state.usedOptions);
        return currentStory.options.filter(
            (opt) =>
                opt.option?.trim() &&
                checkConditions(opt.showWhen || []) &&
                !usedOptionsSet.has(opt.option)
        );
    }, [currentStory, checkConditions, state.usedOptions]);

    // ✅ Fixed: Save full snapshot
    const saveHistory = useCallback(() => {
        const snapshot = {
            currentStoryId: state.currentStoryId,
            currentDialogueIndex: state.currentDialogueIndex,
            currentImageIndex: state.currentImageIndex,
            showOptions: state.showOptions,
            showOptionDialogue: state.showOptionDialogue,
            selectedOption: state.selectedOption,
            currentOptionDialogueIndex: state.currentOptionDialogueIndex,
            characterStats: { ...state.characterStats },
            selectedImageUrls: [...state.selectedImageUrls],
            usedOptions: Array.from(state.usedOptions),
            suppressDefaultDialogue: state.suppressDefaultDialogue,
            storyRandom: state.storyRandom,
        };
        setHistory((prev: any) => [...prev, snapshot]);
    }, [
        state.currentStoryId,
        state.currentDialogueIndex,
        state.currentImageIndex,
        state.showOptions,
        state.showOptionDialogue,
        state.selectedOption,
        state.currentOptionDialogueIndex,
        state.characterStats,
        state.selectedImageUrls,
        state.usedOptions,
        state.suppressDefaultDialogue,
        state.storyRandom,
    ]);

    const moveToNextPiece = useCallback((targetId?: number) => {
        if (!Array.isArray(story) || story.length === 0) return;
        const nextId = targetId ?? currentStory?.nextStoryPiece;
        if (nextId === null || nextId === undefined || nextId === -1) return;
        const nextPiece = story.find((p) => p.id === nextId);
        if (nextPiece) {
            dispatch({ type: 'MOVE_TO_STORY', payload: nextId });
        }
    }, [story, currentStory]);


    const handleOptionSelect = useCallback(
        (option: any) => {
            saveHistory();
            if (option.effects?.length) {
                dispatch({ type: 'APPLY_EFFECTS', payload: option.effects });
            }
            dispatch({ type: 'SELECT_OPTION', payload: option });
            const optDialogues = getRandomDialogues(option.dialogueBlocks || []);
            if (optDialogues.length === 0) {
                const shouldLoop = option.loop?.some((loop: any) => !checkConditions(loop.conditions));
                if (shouldLoop) {
                    dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
                    dispatch({ type: 'SUPPRESS_DEFAULT_DIALOGUE', payload: true });
                    dispatch({ type: 'SHOW_OPTIONS' });
                } else {
                    dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
                    moveToNextPiece(option.nextPieceId);
                }
            }
        },
        [saveHistory, getRandomDialogues, checkConditions, moveToNextPiece]
    );

    const handleOptionComplete = useCallback(() => {
        if (!state.selectedOption) {
            moveToNextPiece();
            return;
        }
        const shouldLoop = state.selectedOption.loop?.some((loop: any) => !checkConditions(loop.conditions));
        if (shouldLoop) {
            dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
            dispatch({ type: 'SUPPRESS_DEFAULT_DIALOGUE', payload: true });
            dispatch({ type: 'SHOW_OPTIONS' });
        } else {
            dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
            moveToNextPiece(state.selectedOption.nextPieceId);
        }
    }, [state.selectedOption, checkConditions, moveToNextPiece]);

    const handleBack = useCallback(() => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        dispatch({ type: 'LOAD_STATE', payload: prev });
        setHistory((h) => h.slice(0, -1));
    }, [history]);

    const handleSave = useCallback(() => {
        const saves: SavedGame[] = JSON.parse(localStorage.getItem('saved-games') || '[]');
        const newSave: SavedGame = {
            ...state,
            usedOptions: Array.from(state.usedOptions),
            history: history.map((h) => ({
                ...h,
                usedOptions: Array.from(h.usedOptions),
            })),
            timestamp: Date.now(),
        };
        localStorage.setItem('saved-games', JSON.stringify([...saves, newSave]));
        alert('Game saved successfully!');
    }, [state, history]);

    const handleLoad = useCallback((saveIndex: number) => {
        const saves: SavedGame[] = JSON.parse(localStorage.getItem('saved-games') || '[]');
        const save = saves[saveIndex];
        if (save) {
            const loadedState = {
                ...save,
                usedOptions: new Set(save.usedOptions || []),
            };
            dispatch({ type: 'LOAD_STATE', payload: loadedState });
            setHistory(
                (save.history || []).map((h: any) => ({
                    ...h,
                    usedOptions: new Set(h.usedOptions || []),
                }))
            );
            setShowSettings(false);
        }
    }, []);


    const handleNext = useCallback(() => {
        saveHistory();
        if (state.currentImageIndex < state.selectedImageUrls.length - 1) {
            dispatch({ type: 'NEXT_IMAGE' });
        } else if (state.showOptionDialogue && state.selectedOption) {
            const optDialogues = getRandomDialogues(state.selectedOption.dialogueBlocks || []);
            if (state.currentOptionDialogueIndex < optDialogues.length - 1) {
                dispatch({ type: 'NEXT_DIALOGUE' });
            } else {
                handleOptionComplete();
            }
        } else if (!state.suppressDefaultDialogue && state.currentDialogueIndex < currentDialogues.length - 1) {
            dispatch({ type: 'NEXT_DIALOGUE' });
        } else if (availableOptions.length > 0) {
            dispatch({ type: 'SHOW_OPTIONS' });
        } else {
            moveToNextPiece();
        }
    }, [
        state,
        currentDialogues,
        availableOptions,
        saveHistory,
        getRandomDialogues,
        handleOptionComplete,
        moveToNextPiece,
    ]);
    return {
        story,
        characters,
        state,
        history,
        currentStory,
        currentDialogues,
        availableOptions,
        showCharacters,
        showSettings,
        selectedChar,
        dispatch,
        handleNext,
        handleBack,
        handleOptionSelect,
        handleSave,
        handleLoad,
        setShowCharacters,
        setShowSettings,
        setSelectedChar,
    };
}