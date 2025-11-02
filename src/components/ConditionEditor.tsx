// src/components/ConditionEditor.tsx
'use client';

import React from 'react';
import { Condition } from '@/types/node.types';
import { useCharacterStore } from '@/store/characterStore';

interface ConditionEditorProps {
    conditions: Condition[];
    onChange: (conditions: Condition[]) => void;
}

const OPERATORS: Condition['operator'][] = ['==', '!=', '>', '<', '>=', '<='];

const ConditionEditor: React.FC<ConditionEditorProps> = ({
    conditions,
    onChange,
}) => {
    const { characters } = useCharacterStore();

    const addCondition = () => {
        onChange([
            ...conditions,
            { character: '', attribute: '', operator: '==', value: '' },
        ]);
    };

    const updateCondition = (index: number, field: keyof Condition, value: string) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        onChange(newConditions);
    };

    const removeCondition = (index: number) => {
        onChange(conditions.filter((_, i) => i !== index));
    };

    const getCharacterAttributes = (characterName: string) => {
        const char = characters.find((c) => c.name === characterName);
        return char ? Object.keys(char.details) : [];
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">Conditions</label>
                <button
                    type="button"
                    onClick={addCondition}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                >
                    + Add
                </button>
            </div>

            {conditions.map((condition, idx) => (
                <div key={idx} className="bg-black p-2 rounded border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Condition {idx + 1}</span>
                        <button
                            type="button"
                            onClick={() => removeCondition(idx)}
                            className="text-red-600 hover:text-red-700 text-xs"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={condition.character}
                            onChange={(e) => updateCondition(idx, 'character', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                            <option value="">Select Character</option>
                            {characters.map((char) => (
                                <option key={char.id} value={char.name}>
                                    {char.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={condition.attribute}
                            onChange={(e) => updateCondition(idx, 'attribute', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                            <option value="">Select Attribute</option>
                            {getCharacterAttributes(condition.character).map((attr) => (
                                <option key={attr} value={attr}>
                                    {attr}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(idx, 'operator', e.target.value as Condition['operator'])}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                            {OPERATORS.map((op) => (
                                <option key={op} value={op}>
                                    {op}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            value={condition.value}
                            onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                            placeholder="Value"
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ConditionEditor;