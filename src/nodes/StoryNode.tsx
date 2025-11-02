// src/nodes/StoryNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StoryNodeData } from '@/types';

const StoryNode: React.FC<NodeProps<StoryNodeData>> = ({ data, selected }) => {
    const dialogueCount = data.dialogueBlocks?.reduce(
        (acc, block) => acc + (block.dialogues?.length || 0),
        0
    ) || 0;
    const optionsCount = data.options?.length || 0;
    const hasNextPiece = data.nextStoryPiece !== -1;

    return (
        <div
            className={`bg-black border-l-4 border-l-gray-500 rounded-lg shadow-lg min-w-[280px] transition-all ${selected ? 'ring-2 ring-blue-500 shadow-xl' : 'border-2 border-gray-800'
                }`}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-blue-500!"
            />

            <div className="bg-black px-4 py-3 border-b border-gray-800 rounded-t-lg">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📄</span>
                        <strong className="text-sm font-semibold text-gray-200">
                            {data.title || 'Untitled'}
                        </strong>
                    </div>
                    <span className="text-xs bg-neutral-800 text-gray-300 px-2 py-1 rounded font-mono">
                        {data.id}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-400">
                            <span>💬</span>
                            Dialogues
                        </span>
                        <span className="font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {dialogueCount}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-gray-400">
                            <span>🔀</span>
                            Options
                        </span>
                        <span className="font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {optionsCount}
                        </span>
                    </div>

                    {data.images && data.images.length > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-gray-400">
                                <span>🖼️</span>
                                Images
                            </span>
                            <span className="font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                                {data.images.length}
                            </span>
                        </div>
                    )}

                    {hasNextPiece && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                            <span className="flex items-center gap-1 text-gray-400">
                                <span>➡️</span>
                                Next Piece
                            </span>
                            <span className="font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded font-mono">
                                {data.nextStoryPiece}
                            </span>
                        </div>
                    )}
                </div>

                {/* Show option connections */}
                {optionsCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                        <p className="text-xs text-gray-300 mb-2">Options lead to:</p>
                        <div className="space-y-1">
                            {data.options.map((opt, idx) => (
                                <div key={idx} className="text-xs text-gray-200 bg-neutral-900 px-2 py-1 rounded flex items-center justify-between">
                                    <span className="truncate flex-1">{opt.option || `Option ${idx + 1}`}</span>
                                    <span className="font-mono text-purple-700 ml-2">→ {opt.nextPieceId}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-blue-500!"
            />
        </div>
    );
};

export default memo(StoryNode);