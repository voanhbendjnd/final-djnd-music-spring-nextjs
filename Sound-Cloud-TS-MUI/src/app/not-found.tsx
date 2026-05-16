'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MusicNotFound() {
    const [rotation, setRotation] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setRotation(prev => prev + 8);
            }, 30);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const toggleVinyl = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative flex items-center justify-center font-sans">
            {/* Background Audio Visualizer Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[length:40px_40px] opacity-30"></div>

            {/* Subtle animated sound waves */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="w-[800px] h-[800px] border border-white/10 rounded-full animate-[ping_8s_infinite]"></div>
                <div className="w-[600px] h-[600px] border border-white/10 rounded-full animate-[ping_6s_infinite_0.5s]"></div>
            </div>

            <div className="relative z-10 max-w-2xl mx-auto text-center px-6">
                {/* Vinyl Record */}
                <div className="flex justify-center mb-12">
                    <div
                        onClick={toggleVinyl}
                        className="relative w-64 h-64 cursor-pointer group"
                    >
                        {/* Vinyl */}
                        <div
                            className="w-64 h-64 rounded-full border-8 border-zinc-900 shadow-2xl relative overflow-hidden transition-all duration-300 group-hover:scale-105"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        >
                            {/* Grooves */}
                            <div className="absolute inset-4 rounded-full border border-white/20"></div>
                            <div className="absolute inset-8 rounded-full border border-white/20"></div>
                            <div className="absolute inset-12 rounded-full border border-white/20"></div>
                            <div className="absolute inset-16 rounded-full border border-white/20"></div>

                            {/* Center Label */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-inner">
                                    <div className="text-xs font-mono tracking-[4px] text-white/90 rotate-12">ERROR 404</div>
                                </div>
                            </div>

                            {/* Shine */}
                            <div className="absolute top-6 left-8 w-12 h-12 bg-white/30 rounded-full blur-xl"></div>
                        </div>

                        {/* Tonearm */}
                        <div className="absolute -top-6 -right-8 w-40 h-6 bg-gradient-to-r from-zinc-400 to-white origin-left rotate-[-25deg] shadow-xl transition-transform group-hover:rotate-[-12deg]"></div>
                        <div className="absolute -top-8 -right-8 w-4 h-4 bg-red-500 rounded-full shadow-[0_0_20px_#f00]"></div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Glitch Title */}
                    <div className="relative">
                        <h1 className="text-[180px] md:text-[220px] font-black tracking-[-8px] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 select-none">
                            404
                        </h1>

                        {/* Glitch overlay */}
                        <div className="absolute inset-0 text-[180px] md:text-[220px] font-black tracking-[-8px] leading-none text-pink-500 opacity-30 animate-[glitch_0.6s_infinite] select-none pointer-events-none">
                            404
                        </div>
                    </div>

                    <div className="-mt-10">
                        <p className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-white">
                            TRACK NOT FOUND
                        </p>
                        <p className="text-xl text-zinc-400 max-w-md mx-auto">
                            The song you're looking for has been lost in the mix.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Link
                            href="/"
                            className="group relative px-10 py-5 bg-white text-black font-semibold text-lg rounded-full flex items-center gap-3 overflow-hidden hover:scale-105 active:scale-95 transition-all duration-300"
                        >
              <span className="relative z-10 flex items-center gap-3">
                RETURN TO MIX
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M5 12h14" />
                </svg>
              </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"></div>
                        </Link>

                        <button
                            onClick={toggleVinyl}
                            className="px-8 py-5 border border-white/30 hover:border-white/70 text-white font-medium rounded-full flex items-center gap-3 transition-all hover:bg-white/5 active:scale-95"
                        >
                            <div className={`w-4 h-4 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-white'}`}></div>
                            {isPlaying ? 'PAUSE VINYL' : 'SPIN VINYL'}
                        </button>
                    </div>
                </div>

                {/* Footer hint */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-zinc-500 text-sm flex items-center gap-2">
                    <div className="w-px h-3 bg-white/30"></div>
                    MAYBE TRY SEARCHING FOR ANOTHER BANGER?
                    <div className="w-px h-3 bg-white/30"></div>
                </div>
            </div>

            {/* Floating music notes */}
            <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">♪</div>
            <div className="absolute bottom-32 right-12 text-7xl opacity-20 animate-float-delay">♫</div>
            <div className="absolute top-1/3 right-20 text-5xl opacity-20 animate-float">♬</div>

            <style jsx>{`
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-4px, 4px); }
          40% { transform: translate(-4px, -4px); }
          60% { transform: translate(4px, 4px); }
          80% { transform: translate(4px, -4px); }
          100% { transform: translate(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float 8s ease-in-out infinite 2s;
        }
      `}</style>
        </div>
    );
}