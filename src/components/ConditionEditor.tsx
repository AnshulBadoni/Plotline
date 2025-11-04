// src/components/ConditionEditor.tsx
'use client';

import React from 'react';
import { useCharacterStore } from '@/store/characterStore';

interface ConditionEditorProps {
    conditions: any[];
    onChange: (conditions: any[]) => void;
}

const ConditionEditor: React.FC<ConditionEditorProps> = ({ conditions, onChange }) => {
    const { characters } = useCharacterStore();

    const addCondition = () => {
        onChange([...conditions, { character: '', attribute: '', operator: '==', value: '' }]);
    };

    const updateCondition = (index: number, field: string, value: any) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };

        // Reset attribute if character changes
        if (field === 'character') {
            newConditions[index].attribute = '';
        }

        onChange(newConditions);
    };

    const removeCondition = (index: number) => {
        onChange(conditions.filter((_, i) => i !== index));
    };

    // Get attributes for selected character
    const getAttributesForCharacter = (characterName: string) => {
        if (!characterName) return [];
        const char = characters.find(c => c.name === characterName);
        if (!char?.details) return [];
        return Object.keys(char.details);
    };

    return (
        <div className="space-y-2">
            <button
                onClick={addCondition}
                className="w-full h-7 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 text-white text-xs rounded"
            >
                Add Condition
            </button>

            {conditions.map((condition, index) => {
                const availableAttributes = getAttributesForCharacter(condition.character);

                return (
                    <div key={index} className="p-2 bg-neutral-900 border border-neutral-800 rounded space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-600">
                                {index > 0 && <span className="font-semibold text-blue-500 mr-1">AND</span>}
                                Condition {index + 1}
                            </span>
                            <button
                                onClick={() => removeCondition(index)}
                                className="text-xs text-neutral-600 hover:text-white"
                            >
                                Remove
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {/* Character Dropdown */}
                            <select
                                value={condition.character}
                                onChange={(e) => updateCondition(index, 'character', e.target.value)}
                                className="h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white"
                            >
                                <option value="">Select Character</option>
                                {characters.map((char) => (
                                    <option key={char.id} value={char.name}>
                                        {char.name}
                                    </option>
                                ))}
                            </select>

                            {/* Attribute Dropdown - Dynamic based on character */}
                            <select
                                value={condition.attribute}
                                onChange={(e) => updateCondition(index, 'attribute', e.target.value)}
                                disabled={!condition.character}
                                className="h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select Attribute</option>
                                {availableAttributes.map((attr) => (
                                    <option key={attr} value={attr}>
                                        {attr}
                                    </option>
                                ))}
                                {/* Special attributes */}
                                <option value="0">🎲 Story Random</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <select
                                value={condition.operator}
                                onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                                className="h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white"
                            >
                                <option value="==">Equal (=)</option>
                                <option value="!=">Not Equal (≠)</option>
                                <option value=">">Greater Than ({'>'}) </option>
                                <option value="<">Less Than ({'<'})</option>
                                <option value=">=">Greater or Equal (≥)</option>
                                <option value="<=">Less or Equal (≤)</option>
                                <option value="random">Random Chance</option>
                            </select>

                            <input
                                type="text"
                                value={condition.value}
                                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                placeholder="Value"
                                className="h-7 px-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder:text-neutral-700"
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ConditionEditor;