'use client';

import { ChevronRight } from 'lucide-react';

export default function NextButton({ onNext }: { onNext: () => void; }) {
    return (
        <div className="flex justify-end">
            <button
                onClick={onNext}
                className="bg-zinc-100 hover:bg-black text-zinc-900 px-10 py-4 rounded-xl font-semibold transition-all flex items-center gap-3 shadow-lg text-lg"
            >
                <span>Continue</span>
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
}