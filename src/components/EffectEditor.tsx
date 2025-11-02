// src/components/EffectEditor.tsx
'use client';

import React from 'react';
import { Effect } from '@/types';
import { useCharacterStore } from '@/store/characterStore';

interface EffectEditorProps {
    effects: Effect[];
    onChange: (effects: Effect[]) => void;
}

const OPERATORS: Effect['operator'][] = ['+', '-', '='];

const EffectEditor: React.FC<EffectEditorProps> = ({ effects, onChange }) => {
    const { characters } = useCharacterStore();

    const addEffect = () => {
        onChange([
            ...effects,
            { character: '', attribute: '', operator: '=', value: '' },
        ]);
    };

    const updateEffect = (index: number, field: keyof Effect, value: string) => {
        const newEffects = [...effects];
        newEffects[index] = { ...newEffects[index], [field]: value };
        onChange(newEffects);
    };

    const removeEffect = (index: number) => {
        onChange(effects.filter((_, i) => i !== index));
    };

    const getCharacterAttributes = (characterName: string) => {
        const char = characters.find((c) => c.name === characterName);
        return char ? Object.keys(char.details) : [];
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">Effects</label>
                <button
                    type="button"
                    onClick={addEffect}
                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded"
                >
                    + Add
                </button>
            </div>

            {effects.map((effect, idx) => (
                <div key={idx} className="bg-black p-2 rounded border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Effect {idx + 1}</span>
                        <button
                            type="button"
                            onClick={() => removeEffect(idx)}
                            className="text-red-600 hover:text-red-700 text-xs"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={effect.character}
                            onChange={(e) => updateEffect(idx, 'character', e.target.value)}
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
                            value={effect.attribute}
                            onChange={(e) => updateEffect(idx, 'attribute', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                            <option value="">Select Attribute</option>
                            {getCharacterAttributes(effect.character).map((attr) => (
                                <option key={attr} value={attr}>
                                    {attr}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={effect.operator}
                            onChange={(e) => updateEffect(idx, 'operator', e.target.value as Effect['operator'])}
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
                            value={effect.value}
                            onChange={(e) => updateEffect(idx, 'value', e.target.value)}
                            placeholder="Value"
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EffectEditor;