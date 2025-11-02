// src/nodes/ChoiceNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChoiceNodeData } from '@/types';

const ChoiceNode: React.FC<NodeProps<ChoiceNodeData>> = ({ data, selected }) => {
    return (
        <div
            className={`bg-black border-l-4 border-l-orange-500 rounded-lg shadow-lg min-w-[220px] transition-all ${selected ? 'ring-2 ring-blue-500 shadow-xl' : 'border-2 border-gray-300'
                }`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-blue-500!"
            />

            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg flex items-center gap-2">
                <span className="text-xl">🔀</span>
                <strong className="text-sm font-semibold text-gray-800">{data.label}</strong>
            </div>

            <div className="p-4">
                <div className="flex flex-col gap-2">
                    {data.choices?.map(({ choice, idx }) => (
                        <div
                            key={idx}
                            className="bg-gray-50 px-3 py-2 rounded border-l-3 border-l-orange-500 text-sm text-gray-600"
                        >
                            {idx + 1}. {choice}
                        </div>
                    ))}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="choice-1"
                className="w-3 h-3 bg-blue-500!"
                style={{ left: '30%' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="choice-2"
                className="w-3 h-3 bg-blue-500!"
                style={{ left: '70%' }}
            />
        </div>
    );
};

export default memo(ChoiceNode);