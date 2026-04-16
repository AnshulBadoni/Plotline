'use client';

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { StoryNodeData, Dialogue, DialogueBlock, Option, Image, Loop } from '@/types';
import { useCharacterStore } from '@/store/characterStore';
import EffectEditor from '@/components/EffectEditor';
import AdvanceConditionEditor from '@/components/AdvanceConditionEditor';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AdvancedNodeEditorProps {
    node: Node<StoryNodeData> | null;
    onUpdate: (nodeId: string, newData: Partial<StoryNodeData>) => void;
    onDelete: () => void;
    allNodes: Node<StoryNodeData>[];
}

// Collapsible Card Component
const CollapsibleCard: React.FC<{
    title: string;
    count?: number;
    onRemove?: () => void;
    children: React.ReactNode;
    defaultOpen?: boolean;
    dragHandle?: React.ReactNode;
}> = ({ title, count, onRemove, children, defaultOpen = false, dragHandle }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-neutral-800 rounded-lg bg-black overflow-hidden">
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-900/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    {dragHandle}
                    <div className="flex items-center gap-2">
                        <svg
                            className={`w-4 h-4 text-neutral-200 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-medium text-white">{title}</span>
                        {count !== undefined && (
                            <span className="text-xs text-neutral-200">({count})</span>
                        )}
                    </div>
                </div>
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="text-xs text-neutral-200 hover:text-white transition-colors"
                    >
                        Remove
                    </button>
                )}
            </div>
            {isOpen && (
                <div className="px-4 py-3 border-t border-neutral-800">
                    {children}
                </div>
            )}
        </div>
    );
};

// Sortable Item Component
const SortableItem: React.FC<{
    id: string;
    children: (dragHandle: React.ReactNode) => React.ReactNode;
}> = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const dragHandle = (
        <div
            className="cursor-grab active:cursor-grabbing p-1"
            {...attributes}
            {...listeners}
        >
            <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
        </div>
    );

    return (
        <div ref={setNodeRef} style={style}>
            {children(dragHandle)}
        </div>
    );
};

const AdvancedNodeEditor: React.FC<AdvancedNodeEditorProps> = ({
    node,
    onUpdate,
    onDelete,
    allNodes,
}) => {
    const { characters } = useCharacterStore();
    const [activeTab, setActiveTab] = useState<'basic' | 'dialogues' | 'options' | 'images'>('basic');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [formData, setFormData] = useState<StoryNodeData>({
        id: 0,
        title: '',
        dialogueBlocks: [],
        images: [],
        options: [],
        nextStoryPiece: -1,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (node && node.type === 'storyNode') {
            setFormData(node.data as StoryNodeData);
        }
    }, [node]);

    const handleChange = (field: keyof StoryNodeData, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        if (node) {
            onUpdate(node.id, newData);
        }
    };

    // Drag handlers
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Handle dialogue blocks
        if (String(active.id).startsWith('dlg-block-')) {
            const activeIndex = formData.dialogueBlocks.findIndex((_, i) => `dlg-block-${i}` === active.id);
            const overIndex = formData.dialogueBlocks.findIndex((_, i) => `dlg-block-${i}` === over.id);
            if (activeIndex !== -1 && overIndex !== -1) {
                handleChange('dialogueBlocks', arrayMove(formData.dialogueBlocks, activeIndex, overIndex));
            }
        }

        // Handle options
        if (String(active.id).startsWith('opt-')) {
            const activeIndex = formData.options.findIndex((_, i) => `opt-${i}` === active.id);
            const overIndex = formData.options.findIndex((_, i) => `opt-${i}` === over.id);
            if (activeIndex !== -1 && overIndex !== -1) {
                handleChange('options', arrayMove(formData.options, activeIndex, overIndex));
            }
        }

        // Handle images
        if (String(active.id).startsWith('img-')) {
            const activeIndex = formData.images.findIndex((_, i) => `img-${i}` === active.id);
            const overIndex = formData.images.findIndex((_, i) => `img-${i}` === over.id);
            if (activeIndex !== -1 && overIndex !== -1) {
                handleChange('images', arrayMove(formData.images, activeIndex, overIndex));
            }
        }

        // Handle dialogues within blocks
        if (String(active.id).includes('dlg-')) {
            const [, , blockIdx] = String(active.id).split('-');
            const block = formData.dialogueBlocks[parseInt(blockIdx)];
            const activeIndex = block.dialogues.findIndex((_, i) => `dlg-${blockIdx}-${i}` === active.id);
            const overIndex = block.dialogues.findIndex((_, i) => `dlg-${blockIdx}-${i}` === over.id);
            if (activeIndex !== -1 && overIndex !== -1) {
                const newDialogues = arrayMove(block.dialogues, activeIndex, overIndex);
                updateDialogueBlock(parseInt(blockIdx), { ...block, dialogues: newDialogues });
            }
        }
    };

    // Dialogue Block Functions
    const addDialogueBlock = () => {
        handleChange('dialogueBlocks', [...formData.dialogueBlocks, { conditions: [], dialogues: [] }]);
    };

    const updateDialogueBlock = (index: number, block: DialogueBlock) => {
        const newBlocks = [...formData.dialogueBlocks];
        newBlocks[index] = block;
        handleChange('dialogueBlocks', newBlocks);
    };

    const removeDialogueBlock = (index: number) => {
        handleChange('dialogueBlocks', formData.dialogueBlocks.filter((_, i) => i !== index));
    };

    const addDialogue = (blockIndex: number) => {
        const block = { ...formData.dialogueBlocks[blockIndex] };
        block.dialogues = [...(block.dialogues || []), { character: '', dialogue: '' }];
        updateDialogueBlock(blockIndex, block);
    };

    const updateDialogue = (blockIndex: number, dialogueIndex: number, dialogue: Dialogue) => {
        const block = { ...formData.dialogueBlocks[blockIndex] };
        const dialogues = [...block.dialogues];
        dialogues[dialogueIndex] = dialogue;
        block.dialogues = dialogues;
        updateDialogueBlock(blockIndex, block);
    };

    const removeDialogue = (blockIndex: number, dialogueIndex: number) => {
        const block = { ...formData.dialogueBlocks[blockIndex] };
        block.dialogues = block.dialogues.filter((_, i) => i !== dialogueIndex);
        updateDialogueBlock(blockIndex, block);
    };

    // Option Functions
    const addOption = () => {
        handleChange('options', [...formData.options, {
            option: '',
            nextPieceId: -1,
            effects: [],
            conditions: [],
            dialogueBlocks: [],
            images: [],
            loop: null,
        }]);
    };

    const updateOption = (index: number, option: Option) => {
        const newOptions = [...formData.options];
        newOptions[index] = option;
        handleChange('options', newOptions);
    };

    const removeOption = (index: number) => {
        handleChange('options', formData.options.filter((_, i) => i !== index));
    };

    const addOptionDialogueBlock = (optionIndex: number) => {
        const option = { ...formData.options[optionIndex] };
        option.dialogueBlocks = [...(option.dialogueBlocks || []), { conditions: [], dialogues: [] }];
        updateOption(optionIndex, option);
    };

    const updateOptionDialogueBlock = (optionIndex: number, blockIndex: number, block: DialogueBlock) => {
        const option = { ...formData.options[optionIndex] };
        option.dialogueBlocks[blockIndex] = block;
        updateOption(optionIndex, option);
    };

    const removeOptionDialogueBlock = (optionIndex: number, blockIndex: number) => {
        const option = { ...formData.options[optionIndex] };
        option.dialogueBlocks = option.dialogueBlocks.filter((_, i) => i !== blockIndex);
        updateOption(optionIndex, option);
    };

    const addOptionDialogue = (optionIndex: number, blockIndex: number) => {
        const option = { ...formData.options[optionIndex] };
        const block = { ...option.dialogueBlocks[blockIndex] };
        block.dialogues = [...(block.dialogues || []), { character: '', dialogue: '' }];
        option.dialogueBlocks[blockIndex] = block;
        updateOption(optionIndex, option);
    };

    const updateOptionDialogue = (optionIndex: number, blockIndex: number, dialogueIndex: number, dialogue: Dialogue) => {
        const option = { ...formData.options[optionIndex] };
        const block = { ...option.dialogueBlocks[blockIndex] };
        block.dialogues[dialogueIndex] = dialogue;
        option.dialogueBlocks[blockIndex] = block;
        updateOption(optionIndex, option);
    };

    const removeOptionDialogue = (optionIndex: number, blockIndex: number, dialogueIndex: number) => {
        const option = { ...formData.options[optionIndex] };
        const block = { ...option.dialogueBlocks[blockIndex] };
        block.dialogues = block.dialogues.filter((_, i) => i !== dialogueIndex);
        option.dialogueBlocks[blockIndex] = block;
        updateOption(optionIndex, option);
    };

    const addOptionImage = (optionIndex: number) => {
        const option = { ...formData.options[optionIndex] };
        option.images = [
            ...(option.images || []),
            { urls: [''], title: '', conditions: [] }
        ];
        updateOption(optionIndex, option);
    };

    const updateOptionImage = (optionIndex: number, imageIndex: number, image: Image) => {
        const option = { ...formData.options[optionIndex] };
        option.images[imageIndex] = image;
        updateOption(optionIndex, option);
    };

    const removeOptionImage = (optionIndex: number, imageIndex: number) => {
        const option = { ...formData.options[optionIndex] };
        option.images = option.images.filter((_, i) => i !== imageIndex);
        updateOption(optionIndex, option);
    };

    const addLoop = (optionIndex: number) => {
        const option = { ...formData.options[optionIndex] };
        option.loop = [{ conditions: [] }];
        updateOption(optionIndex, option);
    };

    const removeLoop = (optionIndex: number) => {
        const option = { ...formData.options[optionIndex] };
        option.loop = null;
        updateOption(optionIndex, option);
    };

    const updateLoopConditions = (optionIndex: number, loopIndex: number, conditions: any[]) => {
        const option = { ...formData.options[optionIndex] };
        if (option.loop) {
            option.loop[loopIndex] = { conditions };
            updateOption(optionIndex, option);
        }
    };

    const addImage = () => {
        handleChange('images', [
            ...formData.images,
            {
                urls: [''],
                title: '',
                conditions: []
            }
        ]);
    };

    const updateImage = (index: number, image: Image) => {
        const newImages = [...formData.images];
        newImages[index] = image;
        handleChange('images', newImages);
    };

    const removeImage = (index: number) => {
        handleChange('images', formData.images.filter((_, i) => i !== index));
    };

    if (!node || node.type !== 'storyNode') {
        return (
            <div className={`bg-black border-l border-neutral-800 flex items-center justify-center ${isFullscreen ? 'fixed inset-0 z-50' : 'w-0'}`}>
                <p className="text-sm text-neutral-600">Select a node to edit</p>
            </div>
        );
    }

    return (
        <div className={`bg-black border-l border-neutral-800 flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50' : 'w-[500px]'}`}>
            {/* Header */}
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center shrink-0">
                <div>
                    <h3 className="text-sm font-medium text-white">{formData.title || 'Untitled Node'}</h3>
                    <p className="text-xs text-neutral-600 mt-1">ID: {formData.id}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="h-8 w-8 flex items-center justify-center border border-neutral-800 hover:bg-neutral-900 text-neutral-100 hover:text-white transition-colors rounded"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {isFullscreen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            )}
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        className="h-8 px-3 flex items-center justify-center bg-red-600 hover:bg-red-800 text-red-100 hover:text-white transition-colors rounded text-xs"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-800 shrink-0">
                {(['basic', 'dialogues', 'options', 'images'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-3 text-xs font-medium transition-colors relative ${activeTab === tab ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-black" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className={`p-4 space-y-3 ${isFullscreen ? 'max-w-7xl mx-auto' : ''}`}>
                    {/* Basic Tab */}
                    {activeTab === 'basic' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-neutral-200">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="Enter node title"
                                    className="w-full h-9 px-3 bg-black border border-neutral-800 rounded text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-neutral-200">Default Next Node</label>
                                <select
                                    value={formData.nextStoryPiece}
                                    onChange={(e) => handleChange('nextStoryPiece', Number(e.target.value))}
                                    className="w-full h-9 px-3 bg-black border border-neutral-800 rounded text-sm text-white focus:outline-none focus:border-neutral-600"
                                >
                                    <option value={-1}>None</option>
                                    {allNodes.map((n) => {
                                        const nodeData = n.data as StoryNodeData;
                                        return (
                                            <option key={n.id} value={nodeData.id}>
                                                {nodeData.title || 'Untitled'} ({nodeData.id})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Dialogues Tab */}
                    {activeTab === 'dialogues' && (
                        <div className="space-y-3">
                            <button
                                onClick={addDialogueBlock}
                                className="w-full h-9 flex items-center justify-center bg-white hover:bg-neutral-200 text-black text-sm font-medium rounded transition-colors"
                            >
                                Add Dialogue Block
                            </button>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext
                                    items={formData.dialogueBlocks.map((_, i) => `dlg-block-${i}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {formData.dialogueBlocks.map((block, blockIdx) => (
                                        <SortableItem key={`dlg-block-${blockIdx}`} id={`dlg-block-${blockIdx}`}>
                                            {(dragHandle) => (
                                                <CollapsibleCard
                                                    title={`Block ${blockIdx + 1}`}
                                                    count={block.dialogues.length}
                                                    onRemove={() => removeDialogueBlock(blockIdx)}
                                                    dragHandle={dragHandle}
                                                >
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-xs text-neutral-200 mb-2 block">Conditions</label>
                                                            <AdvanceConditionEditor
                                                                conditions={block.conditions}
                                                                onChange={(conditions) =>
                                                                    updateDialogueBlock(blockIdx, { ...block, conditions })
                                                                }
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <button
                                                                onClick={() => addDialogue(blockIdx)}
                                                                className="w-full h-8 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white text-xs rounded transition-colors"
                                                            >
                                                                Add Dialogue
                                                            </button>

                                                            <SortableContext
                                                                items={block.dialogues.map((_, i) => `dlg-${blockIdx}-${i}`)}
                                                                strategy={verticalListSortingStrategy}
                                                            >
                                                                {block.dialogues.map((dialogue, dialogueIdx) => (
                                                                    <SortableItem key={`dlg-${blockIdx}-${dialogueIdx}`} id={`dlg-${blockIdx}-${dialogueIdx}`}>
                                                                        {(dlgDragHandle) => (
                                                                            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded space-y-2">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex items-center gap-2">
                                                                                        {dlgDragHandle}
                                                                                        <span className="text-xs text-neutral-600">#{dialogueIdx + 1}</span>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => removeDialogue(blockIdx, dialogueIdx)}
                                                                                        className="text-xs text-neutral-600 hover:text-white"
                                                                                    >
                                                                                        Remove
                                                                                    </button>
                                                                                </div>
                                                                                <select
                                                                                    value={dialogue.character}
                                                                                    onChange={(e) =>
                                                                                        updateDialogue(blockIdx, dialogueIdx, {
                                                                                            ...dialogue,
                                                                                            character: e.target.value,
                                                                                        })
                                                                                    }
                                                                                    className="w-full h-8 px-2 bg-black border border-neutral-800 rounded text-sm text-white"
                                                                                >
                                                                                    <option value="">Select Character</option>
                                                                                    {characters.map((char) => (
                                                                                        <option key={char.id} value={char.name}>
                                                                                            {char.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                                <textarea
                                                                                    value={dialogue.dialogue}
                                                                                    onChange={(e) =>
                                                                                        updateDialogue(blockIdx, dialogueIdx, {
                                                                                            ...dialogue,
                                                                                            dialogue: e.target.value,
                                                                                        })
                                                                                    }
                                                                                    placeholder="Dialogue text..."
                                                                                    rows={3}
                                                                                    className="w-full px-2 py-2 bg-black border border-neutral-800 rounded text-sm text-white placeholder:text-neutral-700 resize-none"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </SortableItem>
                                                                ))}
                                                            </SortableContext>
                                                        </div>
                                                    </div>
                                                </CollapsibleCard>
                                            )}
                                        </SortableItem>
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* Options Tab */}
                    {activeTab === 'options' && (
                        <div className="space-y-3">
                            <button
                                onClick={addOption}
                                className="w-full h-9 flex items-center justify-center bg-white hover:bg-neutral-200 text-black text-sm font-medium rounded transition-colors"
                            >
                                Add Option
                            </button>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext
                                    items={formData.options.map((_, i) => `opt-${i}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {formData.options.map((option, optIdx) => {
                                        // ✅ Safe defaults for all nested arrays
                                        const safeOption = {
                                            ...option,
                                            effects: option.effects || [],
                                            conditions: option.conditions || [],
                                            dialogueBlocks: option.dialogueBlocks || [],
                                            images: option.images || [],
                                            loop: option.loop || null,
                                        };

                                        return (
                                            <SortableItem key={`opt-${optIdx}`} id={`opt-${optIdx}`}>
                                                {(dragHandle) => (
                                                    <CollapsibleCard
                                                        title={safeOption.option || `Option ${optIdx + 1}`}
                                                        onRemove={() => removeOption(optIdx)}
                                                        dragHandle={dragHandle}
                                                    >
                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-2">
                                                                    <label className="text-xs text-neutral-200">Text</label>
                                                                    <input
                                                                        type="text"
                                                                        value={safeOption.option}
                                                                        onChange={(e) =>
                                                                            updateOption(optIdx, { ...safeOption, option: e.target.value })
                                                                        }
                                                                        placeholder="Option text"
                                                                        className="w-full h-8 px-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder:text-neutral-700"
                                                                    />
                                                                </div>

                                                                <div className="space-y-2">
                                                                    <label className="text-xs text-neutral-200">Next Node</label>
                                                                    <select
                                                                        value={safeOption.nextPieceId}
                                                                        onChange={(e) =>
                                                                            updateOption(optIdx, { ...safeOption, nextPieceId: Number(e.target.value) })
                                                                        }
                                                                        className="w-full h-8 px-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white"
                                                                    >
                                                                        <option value={-1}>None</option>
                                                                        {allNodes.map((n) => {
                                                                            const nodeData = n.data as StoryNodeData;
                                                                            return (
                                                                                <option key={n.id} value={nodeData.id}>
                                                                                    {nodeData.title || 'Untitled'} ({nodeData.id})
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {/* ✨ NEW: Visibility Conditions */}
                                                            <CollapsibleCard title="🔒 Visibility Conditions" count={safeOption.conditions.length}>
                                                                <div className="space-y-2">
                                                                    <div className="p-2 bg-blue-950/30 border border-blue-900/50 rounded">
                                                                        <p className="text-xs text-blue-400">
                                                                            <span className="font-semibold">ℹ️ Info:</span> This option will only be shown if these conditions are met.
                                                                        </p>
                                                                    </div>
                                                                    <AdvanceConditionEditor
                                                                        conditions={safeOption.conditions}
                                                                        onChange={(conditions) => updateOption(optIdx, { ...safeOption, conditions })}
                                                                    />
                                                                </div>
                                                            </CollapsibleCard>

                                                            <CollapsibleCard title="Effects" count={safeOption.effects.length}>
                                                                <EffectEditor
                                                                    effects={safeOption.effects}
                                                                    onChange={(effects) => updateOption(optIdx, { ...safeOption, effects })}
                                                                />
                                                            </CollapsibleCard>

                                                            <CollapsibleCard title="Dialogue Blocks" count={safeOption.dialogueBlocks.length}>
                                                                <div className="space-y-2">
                                                                    <button
                                                                        onClick={() => addOptionDialogueBlock(optIdx)}
                                                                        className="w-full h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white text-xs rounded"
                                                                    >
                                                                        Add Block
                                                                    </button>
                                                                    {safeOption.dialogueBlocks.map((block, blockIdx) => {
                                                                        // ✅ Safe defaults for block dialogues
                                                                        const safeBlock = {
                                                                            ...block,
                                                                            dialogues: block.dialogues || [],
                                                                            conditions: block.conditions || [],
                                                                        };

                                                                        return (
                                                                            <div key={blockIdx} className="p-2 bg-neutral-900 border border-neutral-800 rounded space-y-2">
                                                                                <div className="flex justify-between items-center">
                                                                                    <span className="text-xs text-neutral-600">Block {blockIdx + 1}</span>
                                                                                    <button
                                                                                        onClick={() => removeOptionDialogueBlock(optIdx, blockIdx)}
                                                                                        className="text-xs text-neutral-600 hover:text-white"
                                                                                    >
                                                                                        Remove
                                                                                    </button>
                                                                                </div>
                                                                                <AdvanceConditionEditor
                                                                                    conditions={safeBlock.conditions}
                                                                                    onChange={(conditions) =>
                                                                                        updateOptionDialogueBlock(optIdx, blockIdx, { ...safeBlock, conditions })
                                                                                    }
                                                                                />
                                                                                <button
                                                                                    onClick={() => addOptionDialogue(optIdx, blockIdx)}
                                                                                    className="w-full h-7 flex items-center justify-center bg-black hover:bg-neutral-950 text-white text-xs rounded"
                                                                                >
                                                                                    Add Dialogue
                                                                                </button>
                                                                                {safeBlock.dialogues.map((dialogue, dialogueIdx) => (
                                                                                    <div key={dialogueIdx} className="p-2 bg-black border border-neutral-800 rounded space-y-2">
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-xs text-neutral-600">#{dialogueIdx + 1}</span>
                                                                                            <button
                                                                                                onClick={() => removeOptionDialogue(optIdx, blockIdx, dialogueIdx)}
                                                                                                className="text-xs text-neutral-600 hover:text-white"
                                                                                            >
                                                                                                Remove
                                                                                            </button>
                                                                                        </div>
                                                                                        <select
                                                                                            value={dialogue.character}
                                                                                            onChange={(e) =>
                                                                                                updateOptionDialogue(optIdx, blockIdx, dialogueIdx, {
                                                                                                    ...dialogue,
                                                                                                    character: e.target.value,
                                                                                                })
                                                                                            }
                                                                                            className="w-full h-7 px-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white"
                                                                                        >
                                                                                            <option value="">Character</option>
                                                                                            {characters.map((char) => (
                                                                                                <option key={char.id} value={char.name}>
                                                                                                    {char.name}
                                                                                                </option>
                                                                                            ))}
                                                                                        </select>
                                                                                        <textarea
                                                                                            value={dialogue.dialogue}
                                                                                            onChange={(e) =>
                                                                                                updateOptionDialogue(optIdx, blockIdx, dialogueIdx, {
                                                                                                    ...dialogue,
                                                                                                    dialogue: e.target.value,
                                                                                                })
                                                                                            }
                                                                                            placeholder="Dialogue..."
                                                                                            rows={2}
                                                                                            className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-white resize-none"
                                                                                        />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </CollapsibleCard>

                                                            <CollapsibleCard title="Images" count={safeOption.images.length}>
                                                                <div className="space-y-2">
                                                                    <button
                                                                        onClick={() => addOptionImage(optIdx)}
                                                                        className="w-full h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white text-xs rounded"
                                                                    >
                                                                        Add Image
                                                                    </button>
                                                                    {safeOption.images.map((image, imgIdx) => {
                                                                        const safeImage = {
                                                                            ...image,
                                                                            urls: image.urls || (image.url ? [image.url] : []), // Migration
                                                                            conditions: image.conditions || [],
                                                                        };

                                                                        return (
                                                                            <div key={imgIdx} className="p-2 bg-neutral-900 border border-neutral-800 rounded space-y-2">
                                                                                <div className="flex justify-between">
                                                                                    <span className="text-xs text-neutral-600">
                                                                                        Image {imgIdx + 1}
                                                                                        {safeImage.urls.length > 1 && ` (🎲 ${safeImage.urls.length} variants)`}
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() => removeOptionImage(optIdx, imgIdx)}
                                                                                        className="text-xs text-neutral-600 hover:text-white"
                                                                                    >
                                                                                        Remove
                                                                                    </button>
                                                                                </div>

                                                                                <AdvanceConditionEditor
                                                                                    conditions={safeImage.conditions}
                                                                                    onChange={(conditions) =>
                                                                                        updateOptionImage(optIdx, imgIdx, { ...safeImage, conditions })
                                                                                    }
                                                                                />

                                                                                <input
                                                                                    type="text"
                                                                                    value={safeImage.title}
                                                                                    onChange={(e) =>
                                                                                        updateOptionImage(optIdx, imgIdx, { ...safeImage, title: e.target.value })
                                                                                    }
                                                                                    placeholder="Title"
                                                                                    className="w-full h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white"
                                                                                />

                                                                                {/* Multiple URL inputs */}
                                                                                <div className="space-y-1">
                                                                                    <div className="flex justify-between items-center">
                                                                                        <label className="text-xs text-neutral-600">URLs</label>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const newUrls = [...safeImage.urls, ''];
                                                                                                updateOptionImage(optIdx, imgIdx, { ...safeImage, urls: newUrls });
                                                                                            }}
                                                                                            className="text-xs text-blue-500 hover:text-blue-400"
                                                                                        >
                                                                                            + Add
                                                                                        </button>
                                                                                    </div>
                                                                                    {safeImage.urls.map((url, urlIdx) => (
                                                                                        <div key={urlIdx} className="flex gap-1">
                                                                                            <input
                                                                                                type="text"
                                                                                                value={url}
                                                                                                onChange={(e) => {
                                                                                                    const newUrls = [...safeImage.urls];
                                                                                                    newUrls[urlIdx] = e.target.value;
                                                                                                    updateOptionImage(optIdx, imgIdx, { ...safeImage, urls: newUrls });
                                                                                                }}
                                                                                                placeholder={`URL ${urlIdx + 1}`}
                                                                                                className="flex-1 h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white"
                                                                                            />
                                                                                            {safeImage.urls.length > 1 && (
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        const newUrls = safeImage.urls.filter((_, i) => i !== urlIdx);
                                                                                                        updateOptionImage(optIdx, imgIdx, { ...safeImage, urls: newUrls });
                                                                                                    }}
                                                                                                    className="h-7 w-7 flex items-center justify-center bg-black hover:bg-neutral-900 border border-neutral-800 rounded text-neutral-600 hover:text-white text-xs"
                                                                                                >
                                                                                                    ×
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </CollapsibleCard>

                                                            <CollapsibleCard title="Loop" count={safeOption.loop ? 1 : 0}>
                                                                <div className="space-y-2">
                                                                    {!safeOption.loop ? (
                                                                        <button
                                                                            onClick={() => addLoop(optIdx)}
                                                                            className="w-full h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white text-xs rounded"
                                                                        >
                                                                            Add Loop
                                                                        </button>
                                                                    ) : (
                                                                        <>
                                                                            <button
                                                                                onClick={() => removeLoop(optIdx)}
                                                                                className="w-full h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white text-xs rounded"
                                                                            >
                                                                                Remove Loop
                                                                            </button>
                                                                            {safeOption.loop.map((loop, loopIdx) => (
                                                                                <div key={loopIdx} className="p-2 bg-neutral-900 border border-neutral-800 rounded">
                                                                                    <AdvanceConditionEditor
                                                                                        conditions={loop.conditions || []}
                                                                                        onChange={(conditions) => updateLoopConditions(optIdx, loopIdx, conditions)}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </CollapsibleCard>
                                                        </div>
                                                    </CollapsibleCard>
                                                )}
                                            </SortableItem>
                                        );
                                    })}
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* Images Tab */}
                    {activeTab === 'images' && (
                        <div className="space-y-3">
                            <button
                                onClick={addImage}
                                className="w-full h-9 flex items-center justify-center bg-white hover:bg-neutral-200 text-black text-sm font-medium rounded transition-colors"
                            >
                                Add Image
                            </button>

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext
                                    items={formData.images.map((_, i) => `img-${i}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className={`grid gap-3 ${isFullscreen ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                                        {formData.images.map((image, idx) => {
                                            // Safe defaults
                                            const safeImage = {
                                                ...image,
                                                urls: image.urls || (image.url ? [image.url] : []), // 👈 Migration from old format
                                                conditions: image.conditions || [],
                                            };

                                            const hasMultipleUrls = safeImage.urls.length > 1;

                                            return (
                                                <SortableItem key={`img-${idx}`} id={`img-${idx}`}>
                                                    {(dragHandle) => (
                                                        <CollapsibleCard
                                                            title={
                                                                hasMultipleUrls
                                                                    ? `🎲 ${image.title || `Image ${idx + 1}`} (${safeImage.urls.length} variants)`
                                                                    : image.title || `Image ${idx + 1}`
                                                            }
                                                            onRemove={() => removeImage(idx)}
                                                            dragHandle={dragHandle}
                                                        >
                                                            <div className="space-y-3">
                                                                {/* Random Mode Indicator */}
                                                                {hasMultipleUrls && (
                                                                    <div className="p-2 bg-blue-950/30 border border-blue-900/50 rounded text-xs text-blue-400">
                                                                        <span className="font-semibold">🎲 Random Selection:</span> One of {safeImage.urls.length} variants will be shown.
                                                                    </div>
                                                                )}

                                                                {/* Conditions */}
                                                                <CollapsibleCard title="Conditions" count={safeImage.conditions.length}>
                                                                    <AdvanceConditionEditor
                                                                        conditions={safeImage.conditions}
                                                                        onChange={(conditions) => updateImage(idx, { ...safeImage, conditions })}
                                                                    />
                                                                </CollapsibleCard>

                                                                {/* Title */}
                                                                <div className="space-y-2">
                                                                    <label className="text-xs text-neutral-200">Title</label>
                                                                    <input
                                                                        type="text"
                                                                        value={safeImage.title}
                                                                        onChange={(e) =>
                                                                            updateImage(idx, { ...safeImage, title: e.target.value })
                                                                        }
                                                                        placeholder="Image title"
                                                                        className="w-full h-8 px-2 bg-neutral-900 border border-neutral-800 rounded text-sm text-white placeholder:text-neutral-700"
                                                                    />
                                                                </div>

                                                                {/* URL Variants */}
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <label className="text-xs text-neutral-200">
                                                                            URL Variants {hasMultipleUrls && '(Random)'}
                                                                        </label>
                                                                        <button
                                                                            onClick={() => {
                                                                                const newUrls = [...safeImage.urls, ''];
                                                                                updateImage(idx, { ...safeImage, urls: newUrls });
                                                                            }}
                                                                            className="text-xs text-blue-500 hover:text-blue-400"
                                                                        >
                                                                            + Add Variant
                                                                        </button>
                                                                    </div>

                                                                    {safeImage.urls.map((url, urlIdx) => (
                                                                        <div key={urlIdx} className="space-y-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="flex-1 relative">
                                                                                    {hasMultipleUrls && (
                                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-600">
                                                                                            #{urlIdx + 1}
                                                                                        </span>
                                                                                    )}
                                                                                    <input
                                                                                        type="text"
                                                                                        value={url}
                                                                                        onChange={(e) => {
                                                                                            const newUrls = [...safeImage.urls];
                                                                                            newUrls[urlIdx] = e.target.value;
                                                                                            updateImage(idx, { ...safeImage, urls: newUrls });
                                                                                        }}
                                                                                        placeholder={`https://... ${hasMultipleUrls ? `(variant ${urlIdx + 1})` : ''}`}
                                                                                        className={`w-full h-8 px-2 bg-neutral-900 border rounded text-sm text-white placeholder:text-neutral-700 ${hasMultipleUrls ? 'pl-10 border-blue-900/50' : 'border-neutral-800'
                                                                                            }`}
                                                                                    />
                                                                                </div>
                                                                                {safeImage.urls.length > 1 && (
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newUrls = safeImage.urls.filter((_, i) => i !== urlIdx);
                                                                                            updateImage(idx, { ...safeImage, urls: newUrls });
                                                                                        }}
                                                                                        className="h-8 w-8 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-neutral-200 hover:text-white transition-colors"
                                                                                        title="Remove variant"
                                                                                    >
                                                                                        ×
                                                                                    </button>
                                                                                )}
                                                                            </div>

                                                                            {/* Preview */}
                                                                            {url && (
                                                                                <div className="rounded overflow-hidden border border-neutral-800 relative">
                                                                                    {hasMultipleUrls && (
                                                                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
                                                                                            Variant {urlIdx + 1}
                                                                                        </div>
                                                                                    )}
                                                                                    <img
                                                                                        src={url}
                                                                                        alt={`${safeImage.title} - variant ${urlIdx + 1}`}
                                                                                        className="w-full h-32 object-cover"
                                                                                        onError={(e) => {
                                                                                            e.currentTarget.style.display = 'none';
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </CollapsibleCard>
                                                    )}
                                                </SortableItem>
                                            );
                                        })}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdvancedNodeEditor;