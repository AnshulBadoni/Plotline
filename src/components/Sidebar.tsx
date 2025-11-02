// src/components/Sidebar.tsx
import React from 'react';

interface SidebarProps {
  onAddNode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddNode }) => {
  return (
    <div className="w-72 bg-black p-6 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-200 mb-6 flex items-center gap-2">
        Story Elements
      </h3>

      <button
        onClick={onAddNode}
        className="w-full flex items-center gap-4 p-4  rounded-lg bg-neutral-800 hover:border-purple-500 hover:translate-x-1 transition-all group mb-4"
      >
        <span className="text-3xl">📄</span>
        <div className="flex flex-col items-start">
          <strong className="text-sm text-gray-100 group-hover:text-purple-600">
            Story Node
          </strong>
          <small className="text-xs text-gray-200">Add a story piece</small>
        </div>
      </button>

      {/* <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span>ℹ️</span>
          How to use:
        </h4>
        <ul className="space-y-2 text-xs text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">1.</span>
            <span>Add characters in Character Manager</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">2.</span>
            <span>Create story nodes and add dialogues</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">3.</span>
            <span>Add options to create branches</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">4.</span>
            <span>Connect nodes by dragging from handles</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">5.</span>
            <span>Configure story settings and export</span>
          </li>
        </ul>
      </div> */}
    </div>
  );
};

export default Sidebar;