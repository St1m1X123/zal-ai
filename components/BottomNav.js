'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '../context/AppContext'
import { useEffect, useState } from 'react'

export default function BottomNav() {
    const pathname = usePathname()
    const { user, loading } = useApp()

    if (loading || !user) return null
    if (pathname.startsWith('/auth/')) return null

    const tabs = [
        {
            name: 'Головна',
            href: '/',
            icon: (active) => (
                <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            name: 'Програми',
            href: '/programs',
            icon: (active) => (
                <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        },
        {
            name: 'Профіль',
            href: '/profile',
            icon: (active) => (
                <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        }
    ]

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[300px] px-4">
            <nav className="relative flex justify-around items-center h-[60px] rounded-[20px] overflow-hidden">
                {/* Скляний фон */}
                <div className="absolute inset-0 bg-[#0d1117]/80 backdrop-blur-2xl border border-white/[0.08] rounded-[20px]" />
                {/* Верхня лінія-блиск */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                {tabs.map((tab) => {
                    const isActive = pathname === tab.href ||
                        (tab.href !== '/' && pathname.startsWith(tab.href))

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="relative z-10 flex flex-col items-center justify-center w-16 h-full gap-1 group"
                        >
                            <div className={`transition-all duration-300 ${isActive
                                ? 'text-[#A3E635] scale-110'
                                : 'text-white/25 group-hover:text-white/50'
                                }`}>
                                {tab.icon(isActive)}
                            </div>

                            <span className={`text-[9px] font-semibold tracking-wide transition-all duration-300 ${isActive
                                ? 'text-[#A3E635]'
                                : 'text-white/20 group-hover:text-white/40'
                                }`}>
                                {tab.name}
                            </span>

                            {/* Active glow dot */}
                            {isActive && (
                                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#A3E635] shadow-[0_0_8px_#A3E635,0_0_16px_rgba(163,230,53,0.5)]" />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
