// src/components/NodeEditor.tsx
import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { NodeData, StoryNodeData, ChoiceNodeData } from '@/types';

interface NodeEditorProps {
  node: Node<NodeData> | null;
  onUpdate: (nodeId: string, newData: Partial<NodeData>) => void;
  onDelete: () => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ node, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    label: '',
    text: '',
    character: '',
    background: '',
    choices: [] as string[],
  });

  useEffect(() => {
    if (node) {
      const data = node.data as any;
      setFormData({
        label: data.label || '',
        text: data.text || '',
        character: data.character || '',
        background: data.background || '',
        choices: data.choices || [],
      });
    }
  }, [node]);

  const handleChange = (field: string, value: string | string[]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (node) {
      onUpdate(node.id, newData as any);
    }
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...formData.choices];
    newChoices[index] = value;
    handleChange('choices', newChoices);
  };

  const addChoice = () => {
    handleChange('choices', [...formData.choices, `Choice ${formData.choices.length + 1}`]);
  };

  const removeChoice = (index: number) => {
    const newChoices = formData.choices.filter((_, i) => i !== index);
    handleChange('choices', newChoices);
  };

  if (!node) {
    return (
      <div className="w-80 bg-black border-l border-gray-200 flex items-center justify-center">
        <p className="text-gray-400 text-base">👈 Select a node to edit</p>
      </div>
    );
  }

  const isChoiceNode = node.type === 'choiceNode';

  return (
    <div className="w-80 bg-black border-l border-gray-200 flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>✏️</span>
          Edit Block
        </h3>
        <button
          onClick={onDelete}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          🗑️ Delete
        </button>
      </div>

      <div className="p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Label</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Block name..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {!isChoiceNode && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Story Text</label>
            <textarea
              value={formData.text}
              onChange={(e) => handleChange('text', e.target.value)}
              placeholder="Enter your story text here..."
              rows={6}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Character Name</label>
          <input
            type="text"
            value={formData.character}
            onChange={(e) => handleChange('character', e.target.value)}
            placeholder="Character speaking..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">Background</label>
          <input
            type="text"
            value={formData.background}
            onChange={(e) => handleChange('background', e.target.value)}
            placeholder="Background image URL..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {isChoiceNode && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Choices</label>
            <div className="space-y-2">
              {formData.choices.map((choice, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    placeholder={`Choice ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeChoice(index)}
                    className="w-10 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addChoice}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-2"
              >
                + Add Choice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeEditor;