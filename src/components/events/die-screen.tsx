'use client';

export default function DieScreen() {
    return (
        <div className="fixed inset-0 bg-black text-red-500 font-bold flex items-center justify-center z-[9999] animate-in fade-in">
            <h1 className="text-9xl animate-die-spam">
                DIE
            </h1>
        </div>
    );
}
