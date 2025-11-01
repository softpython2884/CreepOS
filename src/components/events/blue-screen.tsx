'use client';

export default function BlueScreen() {
    return (
        <div className="w-full h-full bg-blue-900 text-white font-mono flex items-center justify-center p-8 animate-in fade-in">
            <div className="text-center">
                <p className="text-3xl">:(</p>
                <p className="mt-4 text-lg">Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</p>
                <p className="mt-8 text-sm">For more information about this issue and possible fixes, visit https://www.windows.com/stopcode</p>
                <p className="mt-2 text-sm">If you call a support person, give them this info:</p>
                <p className="text-sm">Stop Code: AI_CORE_INTEGRITY_VIOLATION</p>
            </div>
        </div>
    );
}
