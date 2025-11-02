// src/components/CharacterManager.tsx - COMPACT & ELEGANT UI

'use client';

import React, { useState } from 'react';
import { useCharacterStore } from '@/store/characterStore';
import { Character } from '@/types';
import { Users, X, Edit2, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const COLORS = [
    'bg-gradient-to-br from-red-400 to-red-600',
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-green-400 to-green-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-yellow-400 to-yellow-600',
    'bg-gradient-to-br from-cyan-400 to-cyan-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
];

const EMOJIS = ['👨', '👩', '🧙', '🤖', '👽', '🦸', '🧛', '👮', '🕵️', '💂'];
const ROLES = ['friend', 'foe', 'neutral', 'narrator'];

const CharacterManager: React.FC = () => {
    const { characters, addCharacter, updateCharacter, deleteCharacter } = useCharacterStore();
    const [isOpen, setIsOpen] = useState(false);
    const [editingChar, setEditingChar] = useState<Character | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        role: 'friend',
        color: COLORS[0],
        emoji: EMOJIS[0],
        details: {} as { [key: string]: string },
        image: '',
        bgImage: '',
    });
    const [newDetail, setNewDetail] = useState({ key: '', value: '' });
    const [expandedSections, setExpandedSections] = useState({
        appearance: true,
        images: false,
        attributes: true,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (editingChar) {
            updateCharacter(editingChar.id, {
                name: formData.name,
                role: formData.role,
                color: formData.color,
                emoji: formData.emoji,
                details: formData.details,
                image: formData.image,
                bgImage: formData.bgImage,
            });
        } else {
            const newChar: Character = {
                id: Date.now(),
                name: formData.name,
                role: formData.role,
                color: formData.color,
                emoji: formData.emoji,
                details: formData.details,
                image: formData.image,
                bgImage: formData.bgImage,
            };
            addCharacter(newChar);
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            role: 'friend',
            color: COLORS[0],
            emoji: EMOJIS[0],
            details: {},
            image: '',
            bgImage: '',
        });
        setEditingChar(null);
        setIsOpen(false);
    };

    const handleEdit = (char: Character) => {
        setEditingChar(char);
        setFormData({
            name: char.name,
            role: char.role,
            color: char.color,
            emoji: char.emoji,
            details: char.details || {},
            image: char.image || '',
            bgImage: char.bgImage || '',
        });
        setIsOpen(true);
    };

    const addDetail = () => {
        if (newDetail.key) {
            setFormData({
                ...formData,
                details: {
                    ...formData.details,
                    [newDetail.key]: newDetail.value,
                },
            });
            setNewDetail({ key: '', value: '' });
        }
    };

    const removeDetail = (key: string) => {
        const newDetails = { ...formData.details };
        delete newDetails[key];
        setFormData({ ...formData, details: newDetails });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all"
            >
                <Users className="w-4 h-4" />
                Characters ({characters.length})
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6" onClick={resetForm}>
                    <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden flex border border-zinc-800" onClick={(e) => e.stopPropagation()}>

                        {/* Left Side - Character List */}
                        <div className="w-2/5 border-r border-zinc-800 flex flex-col">
                            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950">
                                <h3 className="text-lg font-bold text-white">Characters</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">{characters.length} total</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {characters.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                                            <p className="text-zinc-500 text-sm">No characters yet</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {characters.map((char) => (
                                            <div
                                                key={char.id}
                                                className="bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 rounded-lg p-3 transition-all group cursor-pointer"
                                                onClick={() => handleEdit(char)}
                                            >
                                                <div className="flex items-start gap-2 mb-2">
                                                    <div className={`w-10 h-10 rounded-lg ${char.color} flex items-center justify-center text-lg shrink-0`}>
                                                        {char.emoji}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-white text-sm capitalize truncate">
                                                            {char.name}
                                                        </h4>
                                                        <p className="text-xs text-zinc-500 capitalize">{char.role}</p>
                                                    </div>
                                                </div>

                                                {char.details && Object.keys(char.details).length > 0 && (
                                                    <div className="flex gap-1 flex-wrap mb-2">
                                                        {Object.entries(char.details).slice(0, 2).map(([key, value]) => (
                                                            <span
                                                                key={key}
                                                                className="text-[10px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded"
                                                            >
                                                                {key}: {value}
                                                            </span>
                                                        ))}
                                                        {Object.keys(char.details).length > 2 && (
                                                            <span className="text-[10px] text-zinc-500">+{Object.keys(char.details).length - 2}</span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex gap-1 pt-2 border-t border-zinc-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(char);
                                                        }}
                                                        className="flex-1 text-blue-400 hover:text-blue-300 text-xs py-1 rounded hover:bg-zinc-700/50 transition-colors"
                                                    >
                                                        <Edit2 className="w-3 h-3 mx-auto" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteCharacter(char.id);
                                                        }}
                                                        className="flex-1 text-red-400 hover:text-red-300 text-xs py-1 rounded hover:bg-zinc-700/50 transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3 mx-auto" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Form */}
                        <div className="flex-1 flex flex-col">
                            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {editingChar ? 'Edit Character' : 'New Character'}
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {editingChar ? 'Update character details' : 'Create a new character'}
                                    </p>
                                </div>
                                <button
                                    onClick={resetForm}
                                    className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Basic Info */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Character name"
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-transparent text-white placeholder-zinc-500 transition-all text-sm"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                                                Role
                                            </label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-transparent text-white capitalize transition-all text-sm"
                                            >
                                                {ROLES.map((role) => (
                                                    <option key={role} value={role} className="capitalize">
                                                        {role}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Appearance - Collapsible */}
                                    {/* <div className="border border-zinc-800 rounded-lg overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection('appearance')}
                                            className="w-full px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-between transition-colors"
                                        >
                                            <span className="text-xs font-semibold text-zinc-300">Appearance</span>
                                            {expandedSections.appearance ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                        </button>
                                        {expandedSections.appearance && (
                                            <div className="p-3 space-y-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Emoji</label>
                                                    <div className="grid grid-cols-5 gap-1.5">
                                                        {EMOJIS.map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, emoji })}
                                                                className={`text-xl p-2 rounded-lg border transition-all ${formData.emoji === emoji
                                                                        ? 'border-purple-500 bg-purple-900/30'
                                                                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                                                                    }`}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Color</label>
                                                    <div className="grid grid-cols-4 gap-1.5">
                                                        {COLORS.map((color) => (
                                                            <button
                                                                key={color}
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, color })}
                                                                className={`h-9 rounded-lg ${color} transition-all ${formData.color === color
                                                                        ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-zinc-900'
                                                                        : ''
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div> */}

                                    {/* Images - Collapsible */}
                                    <div className="border border-zinc-800 rounded-lg overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection('images')}
                                            className="w-full px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-between transition-colors"
                                        >
                                            <span className="text-xs font-semibold text-zinc-300">Images (Optional)</span>
                                            {expandedSections.images ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                        </button>
                                        {expandedSections.images && (
                                            <div className="p-3 space-y-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                                                        Character Image URL
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.image}
                                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                                        placeholder="https://..."
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-1 focus:ring-purple-500 text-white placeholder-zinc-500 transition-all text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                                                        Background Image URL
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.bgImage}
                                                        onChange={(e) => setFormData({ ...formData, bgImage: e.target.value })}
                                                        placeholder="https://..."
                                                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-1 focus:ring-purple-500 text-white placeholder-zinc-500 transition-all text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Attributes - Collapsible */}
                                    <div className="border border-zinc-800 rounded-lg overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleSection('attributes')}
                                            className="w-full px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 flex items-center justify-between transition-colors"
                                        >
                                            <span className="text-xs font-semibold text-zinc-300">
                                                Attributes {formData.details && Object.keys(formData.details).length > 0 &&
                                                    <span className="text-zinc-500 ml-1">({Object.keys(formData.details).length})</span>
                                                }
                                            </span>
                                            {expandedSections.attributes ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                                        </button>
                                        {expandedSections.attributes && (
                                            <div className="p-3 space-y-2">
                                                {formData.details && Object.entries(formData.details).map(([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 p-2 rounded-lg group"
                                                    >
                                                        <span className="flex-1 text-xs text-zinc-300">
                                                            <span className="font-medium text-white">{key}:</span> {value}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDetail(key)}
                                                            className="text-red-400 hover:text-red-300 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <div className="flex gap-2 pt-2">
                                                    <input
                                                        type="text"
                                                        value={newDetail.key}
                                                        onChange={(e) => setNewDetail({ ...newDetail, key: e.target.value })}
                                                        placeholder="Key"
                                                        className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-xs focus:ring-1 focus:ring-purple-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={newDetail.value}
                                                        onChange={(e) => setNewDetail({ ...newDetail, value: e.target.value })}
                                                        placeholder="Value"
                                                        className="w-20 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 text-xs focus:ring-1 focus:ring-purple-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addDetail}
                                                        className="bg-zinc-700 hover:bg-zinc-600 text-white p-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all"
                                        >
                                            {editingChar ? 'Update' : 'Create'}
                                        </button>
                                        {editingChar && (
                                            <button
                                                type="button"
                                                onClick={resetForm}
                                                className="px-4 py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg font-semibold text-sm transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterManager;