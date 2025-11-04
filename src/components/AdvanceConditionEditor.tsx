// src/components/AdvancedConditionEditor.tsx
'use client';

import React from 'react';
import { useCharacterStore } from '@/store/characterStore';

interface ConditionEditorProps {
    conditions: any[];
    onChange: (conditions: any[]) => void;
    depth?: number;
}

const AdvancedConditionEditor: React.FC<ConditionEditorProps> = ({
    conditions,
    onChange,
    depth = 0
}) => {
    const { characters } = useCharacterStore();
    const maxDepth = 3; // Prevent infinite nesting

    const addCondition = () => {
        onChange([...conditions, {
            character: '',
            attribute: '',
            operator: '==',
            value: ''
        }]);
    };

    const addGroup = () => {
        onChange([...conditions, {
            type: 'group',
            logic: 'AND',
            conditions: []
        }]);
    };

    const updateItem = (index: number, newItem: any) => {
        const newConditions = [...conditions];
        newConditions[index] = newItem;
        onChange(newConditions);
    };

    const removeItem = (index: number) => {
        onChange(conditions.filter((_, i) => i !== index));
    };

    const getAttributesForCharacter = (characterName: string) => {
        if (!characterName) return [];
        const char = characters.find(c => c.name === characterName);
        if (!char?.details) return [];
        return Object.keys(char.details);
    };

    const getLogicColor = (logic: string) => {
        return logic === 'OR' ? 'text-orange-500' : 'text-blue-500';
    };

    const indentClass = depth > 0 ? `ml-${depth * 4} border-l-2 border-neutral-700 pl-3` : '';

    return (
        <div className={`space-y-2 ${indentClass}`}>
            <div className="flex gap-2">
                <button
                    onClick={addCondition}
                    className="flex-1 h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white text-xs rounded"
                >
                    + Condition
                </button>
                {depth < maxDepth && (
                    <button
                        onClick={addGroup}
                        className="flex-1 h-7 flex items-center justify-center bg-blue-900 hover:bg-blue-800 text-white text-xs rounded"
                    >
                        + Group
                    </button>
                )}
            </div>

            {conditions.map((item, index) => {
                const isGroup = item.type === 'group';

                return (
                    <div
                        key={index}
                        className={`p-2 border rounded ${isGroup
                                ? 'border-blue-800 bg-blue-950/20'
                                : 'border-neutral-800 bg-neutral-900'
                            }`}
                    >
                        {/* Logic Operator Label */}
                        {index > 0 && (
                            <div className="text-xs font-bold mb-2 text-center">
                                <span className={getLogicColor(depth === 0 ? 'AND' : 'OR')}>
                                    {depth === 0 ? 'AND' : 'OR'}
                                </span>
                            </div>
                        )}

                        {isGroup ? (
                            // GROUP
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-neutral-500">
                                            Group {index + 1}
                                        </span>
                                        <select
                                            value={item.logic}
                                            onChange={(e) => updateItem(index, {
                                                ...item,
                                                logic: e.target.value
                                            })}
                                            className="h-6 px-2 bg-black border border-neutral-700 rounded text-xs text-white"
                                        >
                                            <option value="AND">ALL (AND)</option>
                                            <option value="OR">ANY (OR)</option>
                                        </select>
                                        <span className="text-xs text-neutral-600">
                                            ({item.conditions?.length || 0} items)
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="text-xs text-neutral-600 hover:text-white"
                                    >
                                        Remove Group
                                    </button>
                                </div>

                                {/* Recursive! */}
                                <AdvancedConditionEditor
                                    conditions={item.conditions || []}
                                    onChange={(newConditions) =>
                                        updateItem(index, { ...item, conditions: newConditions })
                                    }
                                    depth={depth + 1}
                                />
                            </>
                        ) : (
                            // SINGLE CONDITION
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-neutral-600">
                                        Condition {index + 1}
                                    </span>
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="text-xs text-neutral-600 hover:text-white"
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <select
                                        value={item.character}
                                        onChange={(e) => updateItem(index, {
                                            ...item,
                                            character: e.target.value,
                                            attribute: ''
                                        })}
                                        className="h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white"
                                    >
                                        <option value="">Character</option>
                                        {characters.map((char) => (
                                            <option key={char.id} value={char.name}>
                                                {char.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={item.attribute}
                                        onChange={(e) => updateItem(index, {
                                            ...item,
                                            attribute: e.target.value
                                        })}
                                        disabled={!item.character}
                                        className="h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white disabled:opacity-50"
                                    >
                                        <option value="">Attribute</option>
                                        {getAttributesForCharacter(item.character).map((attr) => (
                                            <option key={attr} value={attr}>
                                                {attr}
                                            </option>
                                        ))}
                                        <option value="0">🎲 Story Random</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={item.operator}
                                        onChange={(e) => updateItem(index, {
                                            ...item,
                                            operator: e.target.value
                                        })}
                                        className="h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white"
                                    >
                                        <option value="==">=</option>
                                        <option value="!=">≠</option>
                                        <option value=">">{'>'}</option>
                                        <option value="<">{'<'}</option>
                                        <option value=">=">{'>='}</option>
                                        <option value="<=">{'<='}</option>
                                        <option value="random">Random</option>
                                    </select>

                                    <input
                                        type="text"
                                        value={item.value}
                                        onChange={(e) => updateItem(index, {
                                            ...item,
                                            value: e.target.value
                                        })}
                                        placeholder="Value"
                                        className="h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder:text-neutral-700"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default AdvancedConditionEditor;