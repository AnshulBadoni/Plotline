// src/types/node.types.ts
export interface Character {
    id: number;
    name: string;
    role: string;
    color: string;
    emoji: string;
    details: {
        [key: string]: string;
    };
    image: string;
    bgImage: string;
}

export interface Condition {
    character: string;
    attribute: string;
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | '+' | '-' | '=' | 'random';
    value: string;
}

export interface ConditionGroup {
    type: 'group';  
    logic: 'AND' | 'OR';
    conditions: (Condition | ConditionGroup)[];  // 🔁 Recursive!
}

export type ConditionItem = Condition | ConditionGroup;


export interface DialogueBlock {
    conditions: (Condition | ConditionGroup)[];
    dialogues: Dialogue[];
}

export interface Dialogue {
    character: string;
    dialogue: string;
}


export interface StoryImage {
    conditions: Condition[];
    url?: string | string[];
    urls: string[];
    title: string;
}

export interface StoryOption {
    option: string;
    nextPieceId: number;
    effects: Condition[];
    dialogueBlocks: DialogueBlock[];
    images: StoryImage[];
    loop: Loop[];
    showWhen: Condition[];
    conditions?: Condition[];
}


export interface Image {
    conditions: Condition[];
    url?: string | string[];
    urls: string[];
    title: string;
}

export interface Effect {
    character: string;
    attribute: string;
    operator: '+' | '-' | '=';
    value: string;
}

export interface Loop {
    conditions: Condition[];
}

export interface Option {
    option: string;
    nextPieceId: number;
    effects: Effect[];
    dialogueBlocks: DialogueBlock[];
    images: Image[];
    loop: Loop[] | null;
}

export interface StoryNodeData {
    id: number;
    title: string;
    dialogueBlocks: DialogueBlock[];
    images: Image[];
    options: Option[];
    nextStoryPiece: number;
}

export interface ChoiceNodeData {
    label: string;
    choices: string[];
}

export type NodeData = StoryNodeData;

export interface StoryExport {
    story: StoryNodeData[][];
}


export interface StoryPiece {
    id: number;
    title: string;
    randomEvent?: number;
    dialogueBlocks: DialogueBlock[];
    images: StoryImage[];
    options: StoryOption[];
    nextStoryPiece: number;
}

export interface GameState {
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

export interface SavedGame {
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

export type GameAction =
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
