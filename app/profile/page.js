'use client'

import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function HeatMap({ activityMap }) {
    // Останні 7 тижнів
    const weeks = 7
    const days = []
    const today = new Date()
    for (let i = weeks * 7 - 1; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        days.push(d.toISOString().split('T')[0])
    }

    const columns = []
    for (let w = 0; w < weeks; w++) {
        columns.push(days.slice(w * 7, w * 7 + 7))
    }

    return (
        <div className="flex gap-1.5">
            {columns.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1.5">
                    {week.map(date => {
                        const count = activityMap[date] || 0
                        return (
                            <div
                                key={date}
                                title={date}
                                className={`w-[calc((100vw-80px)/7-6px)] max-w-[36px] aspect-square rounded-[4px] transition-all ${count > 0
                                    ? 'bg-[#A3E635] shadow-[0_0_8px_rgba(163,230,53,0.5)]'
                                    : 'bg-white/[0.05]'
                                    }`}
                            />
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, totalSets: 0, streak: 0 })
    const [activityMap, setActivityMap] = useState({})

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.user) { router.push('/'); return }
            const u = session.user
            setUser(u)

            // Завантаження статистики
            const { data: workouts } = await supabase
                .from('workouts')
                .select('id, date, status')
                .eq('user_id', u.id)
                .eq('is_template', false)
                .eq('status', 'completed')
                .order('date', { ascending: false })

            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            const thisMonth = workouts?.filter(w => w.date >= monthStart).length || 0

            // Серія (streak) — підряд ідуть дні
            let streak = 0
            if (workouts && workouts.length > 0) {
                const dates = [...new Set(workouts.map(w => w.date))].sort().reverse()
                const today = new Date().toISOString().split('T')[0]
                let check = today
                for (const d of dates) {
                    if (d === check) {
                        streak++
                        const prev = new Date(check)
                        prev.setDate(prev.getDate() - 1)
                        check = prev.toISOString().split('T')[0]
                    } else break
                }
            }

            // Загальна кількість підходів
            const workoutIds = workouts?.map(w => w.id) || []
            let totalSets = 0
            if (workoutIds.length > 0) {
                const { data: weData } = await supabase.from('workout_exercises').select('id').in('workout_id', workoutIds)
                if (weData && weData.length > 0) {
                    const { count } = await supabase.from('sets').select('id', { count: 'exact', head: true }).in('workout_exercise_id', weData.map(w => w.id)).eq('is_completed', true)
                    totalSets = count || 0
                }
            }

            setStats({ total: workouts?.length || 0, thisMonth, totalSets, streak })

            // Heat-map — останні 49 днів
            const map = {}
            workouts?.forEach(w => { map[w.date] = (map[w.date] || 0) + 1 })
            setActivityMap(map)

            setLoading(false)
        }
        init()
    }, [router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#A3E635] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Завантаження</span>
                </div>
            </div>
        )
    }

    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Атлет'
    const fullName = user?.user_metadata?.full_name || 'Атлет'

    return (
        <main className="min-h-screen text-white relative pb-32">

            {/* ХЕДЕР — Герой */}
            <div className="px-4 pt-8 pb-2 max-w-md mx-auto w-full">
                <div className="neural-card rounded-3xl p-6 relative overflow-hidden">
                    {/* Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] bg-[#A3E635]/10 pointer-events-none" />

                    <div className="relative z-10 flex items-center gap-4">
                        {/* Аватар */}
                        <div className="relative shrink-0">
                            <div className="w-18 h-18 rounded-2xl overflow-hidden border-2 border-white/10 shadow-[0_0_20px_rgba(163,230,53,0.1)]" style={{ width: 72, height: 72 }}>
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-[#A3E635]/10 flex items-center justify-center text-[#A3E635] font-bold text-2xl">
                                        {user?.email?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {/* Online dot */}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#A3E635] border-2 border-[#080b10] shadow-[0_0_8px_rgba(163,230,53,0.8)]" />
                        </div>

                        <div className="min-w-0">
                            <div className="ai-badge mb-2 w-fit">✦ AI Атлет</div>
                            <h1 className="text-xl font-bold text-white tracking-tight truncate">{fullName}</h1>
                            <p className="text-[10px] text-white/30 truncate mt-0.5">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 flex flex-col gap-4 max-w-md mx-auto w-full mt-4">

                {/* СТАТИСТИКА — 4 картки */}
                <section>
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.25em]">Статистика</h2>
                        <div className="h-px flex-1 bg-white/[0.05]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: stats.total, label: 'Всього тренувань', color: '#A3E635', icon: '⚡' },
                            { value: stats.thisMonth, label: 'Цього місяця', color: '#22D3EE', icon: '📅' },
                            { value: stats.totalSets, label: 'Підходів виконано', color: '#818CF8', icon: '💪' },
                            { value: `${stats.streak}д`, label: 'Серія поспіль', color: '#A3E635', icon: '🔥' },
                        ].map(({ value, label, color, icon }) => (
                            <div key={label} className="neural-card rounded-2xl p-5 flex flex-col gap-2">
                                <span className="text-lg">{icon}</span>
                                <span className="text-3xl font-mono font-bold" style={{ color }}>{value}</span>
                                <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider leading-tight">{label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* HEAT-MAP АКТИВНОСТІ */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.25em]">Активність · 7 тижнів</h2>
                        <div className="h-px flex-1 mx-3 bg-white/[0.05]" />
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-white/[0.05]" />
                            <div className="w-2.5 h-2.5 rounded-sm bg-[#A3E635] shadow-[0_0_6px_rgba(163,230,53,0.5)]" />
                        </div>
                    </div>
                    <div className="neural-card rounded-2xl p-4 overflow-x-auto">
                        <HeatMap activityMap={activityMap} />
                    </div>
                </section>

                {/* НАЛАШТУВАННЯ */}
                <section>
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.25em]">Акаунт</h2>
                        <div className="h-px flex-1 bg-white/[0.05]" />
                    </div>
                    <div className="neural-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                        {/* Поточна тема */}
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white/60">Тема</p>
                                    <p className="text-[10px] text-white/25">Neural Dark</p>
                                </div>
                            </div>
                            <div className="ai-badge">Активна</div>
                        </div>

                        {/* Версія */}
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#A3E635]/5 border border-[#A3E635]/10 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-[#A3E635]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white/60">ZalAI</p>
                                    <p className="text-[10px] text-white/25">Версія 2.0 · Neural Athlete</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ВИЙТИ */}
                <button
                    onClick={handleLogout}
                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 bg-red-500/5 border border-red-500/15 text-red-400/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 active:scale-[0.98] transition-all group mt-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm font-bold uppercase tracking-[0.15em]">Вийти з акаунту</span>
                </button>

                <p className="text-center text-[9px] text-white/12 uppercase tracking-widest pb-4">ZalAI Intelligence · v2.0</p>
            </div>
        </main>
    )
}
