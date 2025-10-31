'use client';

import { useEffect, useState } from "react";

export default function BlueScreen() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    // In a real scenario, this would trigger a reboot
                    // For now, it just stays on the BSOD screen.
                    // To make it reboot: window.location.reload();
                    return 100;
                }
                return prev + 1;
            });
        }, 80);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-[#0000AA] text-white font-code flex flex-col items-center justify-center z-[9999] animate-in fade-in">
            <div className="w-[80%] max-w-4xl">
                <p className="text-4xl text-center mb-10">:(</p>
                <p className="text-lg mb-6">
                    Your PC ran into a problem and needs to restart. We're just
                    collecting some error info, and then we'll restart for you.
                </p>
                <p className="text-lg mb-10">
                    {progress}% complete
                </p>
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-white flex items-center justify-center">
                        {/* A fake QR code */}
                        <svg width="80" height="80" viewBox="0 0 100 100" className="text-black">
                            <path fill="currentColor" d="M0 0h30v30H0z M70 0h30v30H70z M0 70h30v30H0z M10 10h10v10H10z M80 10h10v10H80z M10 80h10v10H10z M40 0h10v10H40z M0 40h10v10H0z M40 40h30v30H40z M50 50h10v10H50z M90 40h10v10H90z M40 90h10v10H40z M90 70h10v10H90z M70 70h10v10H70z M70 40h10v10H70z M40 20h10v10H40z M20 40h10v10H20z M20 20h10v10H20z M70 20h10v10H70z M90 20h10v10H90z"/>
                        </svg>
                    </div>
                    <div>
                        <p>For more information about this issue and possible fixes, visit</p>
                        <p>https://www.virtual-nightmare.com/support</p>
                        <p className="mt-4">If you call a support person, give them this info:</p>
                        <p>Stop Code: AI_CORE_INTEGRITY_FAILURE</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
