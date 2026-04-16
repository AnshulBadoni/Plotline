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

    // ✅ Enhanced condition checker with AND/OR group support
    const checkConditions = useCallback(
        (conditionItems: any[], statsOverride?: Record<string, Record<string, string>>): boolean => {
            if (!conditionItems?.length) return true;

            // Use override stats if provided, otherwise use state stats
            const stats = statsOverride || state.characterStats;

            const evaluateItem = (item: any): boolean => {
                // Check if it's a group
                if (item.type === 'group' && item.conditions) {
                    const results = item.conditions.map((child: any) => evaluateItem(child));

                    if (item.logic === 'OR') {
                        return results.some((r: boolean) => r); // At least one true
                    } else {
                        return results.every((r: boolean) => r); // All true (AND)
                    }
                }

                // Single condition
                const { character, attribute, operator, value } = item;

                // Story random check
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

                const currentValue = parseFloat(stats[character]?.[attribute]) || 0;
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
            };

            // Top-level defaults to AND logic
            return conditionItems.every(item => evaluateItem(item));
        },
        [state.characterStats, state.storyRandom]
    );

    // ✅ Calculate stats after effects (without dispatching)
    const calculateStatsAfterEffects = useCallback(
        (effects: any[]) => {
            const newStats = JSON.parse(JSON.stringify(state.characterStats)); // Deep clone

            effects.forEach((effect) => {
                const { character, attribute, operator, value } = effect;

                // Initialize character if doesn't exist
                if (!newStats[character]) {
                    newStats[character] = {};
                }

                // Initialize attribute if doesn't exist
                if (!newStats[character][attribute]) {
                    newStats[character][attribute] = '0';
                }

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

            return newStats;
        },
        [state.characterStats]
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

    // ✅ Handle images with multiple URLs
    useEffect(() => {
        if (!currentStory) return;

        const imageList = state.showOptionDialogue && state.selectedOption
            ? getValidImages(state.selectedOption.images || [])
            : getValidImages(currentStory.images || []);

        const chosenUrls = imageList
            .map((img) => {
                // Handle new format: urls array
                if (img.urls && Array.isArray(img.urls) && img.urls.length > 0) {
                    return img.urls[Math.floor(Math.random() * img.urls.length)];
                }
                // Handle old format: single url
                if (img.url) {
                    if (Array.isArray(img.url) && img.url.length > 0) {
                        return img.url[Math.floor(Math.random() * img.url.length)];
                    }
                    if (typeof img.url === 'string') {
                        return img.url;
                    }
                }
                return null;
            })
            .filter((url): url is string => !!url);

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

    // Set random value when story piece changes
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

    // ✅ UPDATED: Filter options based on visibility conditions
    const availableOptions = useMemo(() => {
        if (!currentStory?.options) return [];

        const usedOptionsSet = state.usedOptions instanceof Set
            ? state.usedOptions
            : new Set(state.usedOptions);

        const filtered = currentStory.options.filter((opt) => {
            // Must have text
            if (!opt.option?.trim()) {
                return false;
            }

            // Must not be used (unless it can loop)
            if (usedOptionsSet.has(opt.option)) {
                return false;
            }

            // Check visibility conditions (primary field)
            // Support both 'conditions' (new) and 'showWhen' (legacy) for backward compatibility
            const visibilityConditions = opt.conditions || opt.showWhen || [];
            const meetsConditions = checkConditions(visibilityConditions);

            if (!meetsConditions) {
                console.log(`🔒 Option "${opt.option}" hidden (conditions not met):`, visibilityConditions);
            }

            return meetsConditions;
        });

        console.log(`📋 Available options: ${filtered.length}/${currentStory.options.length}`);

        return filtered;
    }, [currentStory, checkConditions, state.usedOptions]);

    // ✅ Save full snapshot to history
    const saveHistory = useCallback(() => {
        const snapshot: GameState = {
            currentStoryId: state.currentStoryId,
            currentDialogueIndex: state.currentDialogueIndex,
            currentImageIndex: state.currentImageIndex,
            showOptions: state.showOptions,
            showOptionDialogue: state.showOptionDialogue,
            selectedOption: state.selectedOption,
            currentOptionDialogueIndex: state.currentOptionDialogueIndex,
            characterStats: JSON.parse(JSON.stringify(state.characterStats)),
            selectedImageUrls: [...state.selectedImageUrls],
            usedOptions: new Set(state.usedOptions),
            suppressDefaultDialogue: state.suppressDefaultDialogue,
            storyRandom: state.storyRandom,
        };
        setHistory((prev) => [...prev, snapshot]);
    }, [state]);

    const moveToNextPiece = useCallback((targetId?: number) => {
        if (!Array.isArray(story) || story.length === 0) return;
        const nextId = targetId ?? currentStory?.nextStoryPiece;
        if (nextId === null || nextId === undefined || nextId === -1) return;
        const nextPiece = story.find((p) => p.id === nextId);
        if (nextPiece) {
            dispatch({ type: 'MOVE_TO_STORY', payload: nextId });
        }
    }, [story, currentStory]);

    // ✅ FIXED: Handle option selection with proper loop checking
    const handleOptionSelect = useCallback(
        (option: any) => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎯 Option selected:', option.option);
            console.log('📊 Stats BEFORE effects:', state.characterStats);

            saveHistory();

            // Calculate new stats BEFORE checking loop
            const newStats = option.effects?.length
                ? calculateStatsAfterEffects(option.effects)
                : state.characterStats;

            console.log('📊 Stats AFTER effects:', newStats);

            // Apply effects
            if (option.effects?.length) {
                dispatch({ type: 'APPLY_EFFECTS', payload: option.effects });
            }

            dispatch({ type: 'SELECT_OPTION', payload: option });

            const optDialogues = getRandomDialogues(option.dialogueBlocks || []);

            if (optDialogues.length === 0) {
                // ✅ Check loop with NEW stats
                const shouldLoop = option.loop?.some((loop: any) => {
                    const result = checkConditions(loop.conditions, newStats);
                    console.log('🔁 Loop conditions:', loop.conditions);
                    console.log('🔁 Loop result:', result);
                    return result;
                });

                console.log('🔁 Should loop?', shouldLoop);

                if (shouldLoop) {
                    console.log('↩️  Looping back to options');
                    dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
                    dispatch({ type: 'SUPPRESS_DEFAULT_DIALOGUE', payload: true });
                    dispatch({ type: 'SHOW_OPTIONS' });
                } else {
                    console.log('➡️  Moving to next piece:', option.nextPieceId);
                    dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
                    moveToNextPiece(option.nextPieceId);
                }
            } else {
                console.log('💬 Showing option dialogues first');
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        },
        [
            saveHistory,
            getRandomDialogues,
            checkConditions,
            calculateStatsAfterEffects,
            moveToNextPiece,
            state.characterStats
        ]
    );

    const handleOptionComplete = useCallback(() => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Option dialogue complete');
        console.log('📊 Current stats:', state.characterStats);

        if (!state.selectedOption) {
            moveToNextPiece();
            return;
        }

        const shouldLoop = state.selectedOption.loop?.some((loop: any) => {
            const result = checkConditions(loop.conditions);
            console.log('🔁 Loop conditions:', loop.conditions);
            console.log('🔁 Loop result:', result);
            return result;
        });

        console.log('🔁 Should loop?', shouldLoop);

        if (shouldLoop) {
            console.log('↩️  Looping back to options');

            // ✅ Clear the used option so it can be selected again
            const clearedUsedOptions = new Set(state.usedOptions);
            clearedUsedOptions.delete(state.selectedOption.option);

            dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
            dispatch({ type: 'SUPPRESS_DEFAULT_DIALOGUE', payload: true });

            // ✅ Update usedOptions to remove the looping option
            dispatch({
                type: 'LOAD_STATE',
                payload: {
                    ...state,
                    usedOptions: clearedUsedOptions,
                    showOptions: true,
                    showOptionDialogue: false,
                    selectedOption: null,
                    currentOptionDialogueIndex: 0,
                }
            });
        } else {
            console.log('➡️  Moving to next piece:', state.selectedOption.nextPieceId);
            dispatch({ type: 'COMPLETE_OPTION_DIALOGUE' });
            moveToNextPiece(state.selectedOption.nextPieceId);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }, [state, checkConditions, moveToNextPiece]);

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
            const loadedState: GameState = {
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