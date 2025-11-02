// src/components/VNEditor.tsx - WITH IMPORT FUNCTIONALITY

'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Panel,
  Node,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, Download, Plus, Layers, Link as LinkIcon, Edit3, Calendar, Box, Upload, AlertTriangle } from 'lucide-react';

import StoryNode from '@/nodes/StoryNode';
import Sidebar from './Sidebar';
import AdvancedNodeEditor from '@/nodes/AdvanceNodeEditor';
import CharacterManager from './CharacterManager';
import StoryManager from './StoryManager';
import { useVNStore } from '@/store/vnStore';
import { useStoryManagement } from '@/store/storyManagement';
import { StoryNodeData } from '@/types';

const nodeTypes = {
  storyNode: StoryNode,
};

const VNEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<StoryNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { selectedNode, setSelectedNode } = useVNStore();

  const { currentStoryId, getCurrentStory, updateStory, stories, setCurrentStoryId, addStory } = useStoryManagement();

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importFileName, setImportFileName] = useState('');
  const [conflictingStory, setConflictingStory] = useState<any>(null);
  const [newStoryName, setNewStoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load story when selected
  useEffect(() => {
    const currentStory = getCurrentStory();
    if (currentStory && currentStory.story[0]) {
      const loadedNodes: Node<StoryNodeData>[] = currentStory.story[0].map((nodeData: StoryNodeData, index: number) => ({
        id: `node-${nodeData.id}`,
        type: 'storyNode',
        position: { x: 100 + index * 350, y: 100 + (index % 3) * 250 },
        data: nodeData,
      }));
      setNodes(loadedNodes);
    }
  }, [currentStoryId]);

  // Auto-save to current story
  useEffect(() => {
    if (currentStoryId && nodes.length > 0) {
      const storyData = [
        nodes.map((node) => {
          const data = node.data as StoryNodeData;
          return {
            id: data.id,
            title: data.title,
            dialogueBlocks: data.dialogueBlocks || [],
            images: data.images || [],
            options: data.options || [],
            nextStoryPiece: data.nextStoryPiece ?? -1,
          };
        }),
      ];
      updateStory(currentStoryId, storyData);
    }
  }, [nodes, currentStoryId]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onAddNode = useCallback(() => {
    if (!currentStoryId) {
      alert('Please select or create a story first!');
      return;
    }

    const newId = Date.now();
    const newNode: Node<StoryNodeData> = {
      id: `node-${newId}`,
      type: 'storyNode',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: {
        id: newId,
        title: `node_${newId}`,
        dialogueBlocks: [],
        images: [],
        options: [],
        nextStoryPiece: -1,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, currentStoryId]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<StoryNodeData>) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  const onUpdateNode = useCallback(
    (nodeId: string, newData: Partial<StoryNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...newData } };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const onDeleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
        )
      );
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges, setSelectedNode]);

  const onExport = useCallback(() => {
    if (!currentStoryId) {
      alert('No story selected!');
      return;
    }

    const currentStory = getCurrentStory();
    if (!currentStory) {
      alert('Story not found!');
      return;
    }

    const exportData = {
      story: currentStory.story,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentStory.metadata.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [currentStoryId, getCurrentStory]);

  // Import handlers
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Validate JSON structure
        if (!json.story || !Array.isArray(json.story)) {
          alert('Invalid story format! JSON must contain a "story" array.');
          return;
        }

        // Extract story name from filename (without extension and timestamp)
        let fileName = file.name.replace('.json', '');
        fileName = fileName.replace(/_\d+$/, ''); // Remove timestamp if present
        fileName = fileName.replace(/_/g, ' '); // Replace underscores with spaces

        // Check for conflicts
        const existingStory = Object.values(stories).find(
          (s: any) => s.metadata.title.toLowerCase() === fileName.toLowerCase()
        );

        if (existingStory) {
          setConflictingStory(existingStory);
          setImportData(json);
          setImportFileName(fileName);
          setNewStoryName(fileName);
          setShowImportModal(true);
        } else {
          // No conflict, import directly
          importStory(json, fileName);
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import JSON. Please check the file format.');
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  const importStory = (data: any, storyName: string) => {
    const newStoryId = `story_${Date.now()}`;
    const newStory = {
      metadata: {
        id: newStoryId,
        title: storyName,
        description: `Imported story from ${storyName}.json`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      story: data.story,
    };

    addStory(newStory);
    setCurrentStoryId(newStoryId);
    setShowImportModal(false);
    setImportData(null);
    setConflictingStory(null);
  };

  const handleConfirmImport = () => {
    if (!importData) return;

    if (conflictingStory && newStoryName.toLowerCase() === conflictingStory.metadata.title.toLowerCase()) {
      // Overwrite existing story
      updateStory(conflictingStory.metadata.id, importData.story);
      setCurrentStoryId(conflictingStory.metadata.id);
      alert(`Story "${conflictingStory.metadata.title}" has been overwritten!`);
    } else {
      // Import with new name
      importStory(importData, newStoryName);
      alert(`Story "${newStoryName}" imported successfully!`);
    }

    setShowImportModal(false);
    setImportData(null);
    setConflictingStory(null);
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setImportData(null);
    setConflictingStory(null);
    setNewStoryName('');
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <header className="bg-black border-b border-zinc-800 px-4 sm:px-8 py-4 sm:py-5 shadow-2xl">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-4">
          <div className="shrink-0">

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="font-medium">Nodes:</span>
                <span className="text-white font-semibold">{nodes.length}</span>
              </div>
              <div className="w-px h-4 bg-zinc-700"></div>
              <div className="flex items-center gap-2 text-zinc-400">
                <LinkIcon className="w-3.5 h-3.5" />
                <span className="font-medium">Connections:</span>
                <span className="text-white font-semibold">{edges.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-end text-xs">
            <StoryManager />
            <CharacterManager />
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            {currentStoryId && (
              <>
                <button
                  onClick={() => {
                    window.location.href = `/play?story=${currentStoryId}`;
                  }}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 sm:px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap"
                >
                  <Play className="w-4 h-4" />
                  Play Story
                </button>
                <button
                  onClick={onExport}
                  className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 px-4 sm:px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Import Conflict Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6" onClick={handleCancelImport}>
          <div className="bg-black rounded-2xl shadow-2xl max-w-lg w-full border border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Story Name Conflict</h2>
                  <p className="text-zinc-400 text-sm mt-1">
                    A story with this name already exists
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <p className="text-sm text-zinc-400 mb-2">Existing Story:</p>
                <p className="text-white font-semibold">{conflictingStory?.metadata.title}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {conflictingStory?.story[0]?.length || 0} nodes • Last updated: {' '}
                  {new Date(conflictingStory?.metadata.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">
                  Story Name
                </label>
                <input
                  type="text"
                  value={newStoryName}
                  onChange={(e) => setNewStoryName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-500 transition-all"
                  placeholder="Enter a new name or keep to overwrite"
                />
                {newStoryName.toLowerCase() === conflictingStory?.metadata.title.toLowerCase() && (
                  <p className="text-yellow-500 text-xs mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    This will overwrite the existing story
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancelImport}
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
                >
                  {newStoryName.toLowerCase() === conflictingStory?.metadata.title.toLowerCase()
                    ? 'Overwrite'
                    : 'Import as New'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!currentStoryId ? (
        // Story Selection Grid
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-3">Select Your Story</h2>
              <p className="text-zinc-500 text-lg">Choose a story to edit or create a new one</p>
            </div>

            {Object.keys(stories).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {Object.values(stories).map((storyData: any) => (
                  <button
                    key={storyData.metadata.id}
                    onClick={() => setCurrentStoryId(storyData.metadata.id)}
                    className="group bg-black border-2 border-zinc-800 hover:border-zinc-700 rounded-xl p-6 transition-all hover:bg-zinc-800/50 hover:scale-105 text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white group-hover:text-zinc-100 mb-1">
                          {storyData.metadata.title}
                        </h3>
                        <p className="text-zinc-400 text-sm line-clamp-2">
                          {storyData.metadata.description || 'No description available'}
                        </p>
                      </div>
                      <Edit3 className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0 ml-3" />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-600">
                      <div className="flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5" />
                        <span>{storyData.story[0]?.length || 0} nodes</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(storyData.metadata.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-medium">Click to edit</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-xs text-zinc-500">Ready</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 mb-8">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800">
                  <Layers className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Stories Yet</h3>
                <p className="text-zinc-500 mb-6">Create your first story to get started</p>
              </div>
            )}

            <div className="text-center">
              <StoryManager />
            </div>
          </div>
        </div>
      ) : (
        // Main Editor
        <div className="flex flex-1 overflow-hidden">
          {/* <Sidebar onAddNode={onAddNode} /> */}

          <div className="flex-1 bg-black relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-black"
            >
              <Controls className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 shadow-2xl rounded-xl" />
              <MiniMap
                className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 shadow-2xl rounded-xl"
                maskColor="rgb(24, 24, 27, 0.8)"
                nodeColor={(node) => {
                  if (node.selected) return '#10b981';
                  return '#52525b';
                }}
              />
              <Background
                variant={BackgroundVariant.Dots}
                gap={16}
                size={1.5}
                color="#3f3f46"
                className="bg-black"
              />

              {currentStoryId && (
                <Panel position="top-right" className="m-4">
                  <button
                    onClick={onAddNode}
                    className="flex items-center gap-2 text-xs bg-zinc-100 hover:bg-white text-zinc-900 px-5 py-3 rounded-xl font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Add Node
                  </button>
                </Panel>
              )}
            </ReactFlow>
          </div>

          <AdvancedNodeEditor
            node={selectedNode as Node<StoryNodeData>}
            onUpdate={onUpdateNode}
            onDelete={onDeleteNode}
            allNodes={nodes}
          />
        </div>
      )}
    </div>
  );
};

export default VNEditor;