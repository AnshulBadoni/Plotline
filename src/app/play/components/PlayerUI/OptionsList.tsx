'use client';

import { ChevronRight } from 'lucide-react';

export default function OptionsList({ options, onSelect }: {
    options: { option: string }[];
    onSelect: (opt: any) => void;
}) {
    return (
        <div className="space-y-3">
            {options.map((option, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(option)}
                    className="w-full bg-zinc-900/95 hover:bg-zinc-800/95 backdrop-blur-md border border-zinc-800/50 hover:border-zinc-700 rounded-xl p-6 transition-all text-left group shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-zinc-100 font-medium text-lg pr-4">
                            {option.option}
                        </span>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                </button>
            ))}
        </div>
    );
}