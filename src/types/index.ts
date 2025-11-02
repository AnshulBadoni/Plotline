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
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
    value: string;
}

export interface Dialogue {
    character: string;
    dialogue: string;
}

export interface DialogueBlock {
    conditions: Condition[];
    dialogues: Dialogue[];
}

export interface Image {
    conditions: Condition[];
    url: string;
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