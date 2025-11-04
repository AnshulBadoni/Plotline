'use client';

export default function Background({ imageUrl, isVideo }: { imageUrl?: string; isVideo: boolean; }) {
    if (!imageUrl) return <div className="absolute inset-0 bg-zinc-950" />;

    return (
        <div className="absolute inset-0">
            {isVideo ? (
                <video src={imageUrl} autoPlay muted loop className="w-full h-full object-cover" />
            ) : (
                <img src={imageUrl} alt="Scene background" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/60" />
        </div>
    );
}