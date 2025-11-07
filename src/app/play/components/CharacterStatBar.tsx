// src/app/play/components/CharacterStatBar.tsx
'use client';

export const getStatIcon = (key: string) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('health') || lowerKey.includes('hp')) return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>;
    if (lowerKey.includes('power') || lowerKey.includes('attack')) return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    if (lowerKey.includes('defense') || lowerKey.includes('shield')) return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z" /></svg>;
    return null;
};

export default function CharacterStatBar({ label, value }: { label: string; value: string; }) {
    const numericValue = Math.min(parseFloat(value) || 0, 100);
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                {getStatIcon(label)}
                <span className="text-sm font-medium capitalize">{label}</span>
            </div>
            <div className="text-4xl font-bold text-white">{value}</div>
            <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-600 rounded-full transition-all" style={{ width: `${numericValue}%` }} />
            </div>
        </div>
    );
}