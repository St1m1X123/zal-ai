'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ExerciseDetailPage({ params }) {
    const { id } = use(params)
    const router = useRouter()
    const [exercise, setExercise] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            // 1. Fetch exercise details
            const { data: exData } = await supabase
                .from('exercises')
                .select('*')
                .eq('id', id)
                .single()

            if (exData) {
                setExercise(exData)

                // 2. Fetch user's history for this exercise
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: workoutExs } = await supabase
                        .from('workout_exercises')
                        .select(`
              id,
              workout_id,
              workouts!inner(date, status, user_id)
            `)
                        .eq('exercise_id', id)
                        .eq('workouts.user_id', user.id)
                        .eq('workouts.status', 'completed')
                        .order('workouts(date)', { ascending: false })

                    if (workoutExs?.length > 0) {
                        const weIds = workoutExs.map(we => we.id)
                        const { data: setsData } = await supabase
                            .from('sets')
                            .select('*')
                            .in('workout_exercise_id', weIds)
                            .eq('is_completed', true)

                        // Group sets by workout date
                        const historyMap = {}
                        setsData?.forEach(set => {
                            const we = workoutExs.find(we => we.id === set.workout_exercise_id)
                            const date = we.workouts.date
                            if (!historyMap[date]) {
                                historyMap[date] = {
                                    date,
                                    maxWeight: 0,
                                    totalVolume: 0,
                                    sets: []
                                }
                            }
                            historyMap[date].sets.push(set)
                            if (set.weight > historyMap[date].maxWeight) {
                                historyMap[date].maxWeight = set.weight
                            }
                            historyMap[date].totalVolume += (set.weight || 0) * (set.reps || 0)
                        })

                        const sortedHistory = Object.values(historyMap).sort((a, b) => new Date(b.date) - new Date(a.date))
                        setHistory(sortedHistory)
                    }
                }
            }
            setLoading(false)
        }
        fetchData()
    }, [id, supabase])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#080b10] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#A3E635]/20 border-t-[#A3E635] rounded-full animate-spin" />
            </div>
        )
    }

    if (!exercise) {
        return (
            <div className="min-h-screen bg-[#080b10] p-6 flex flex-col items-center justify-center text-center">
                <h1 className="text-xl font-bold text-white mb-2">Вправу не знайдено</h1>
                <button onClick={() => router.back()} className="text-[#A3E635] text-sm font-bold">Повернутися назад</button>
            </div>
        )
    }

    const instructions = Array.isArray(exercise.instructions)
        ? exercise.instructions
        : (exercise.instructions?.split('\n').filter(Boolean) || [])

    return (
        <main className="min-h-screen bg-[#080b10] pb-12 overflow-x-hidden">
            {/* Плавний фоновий градієнт */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-[#A3E635]/10 via-[#A3E635]/5 to-transparent pointer-events-none" />

            {/* Шапка */}
            <header className="sticky top-0 z-30 px-4 py-4 bg-[#080b10]/60 backdrop-blur-xl border-b border-white/[0.05]">
                <div className="max-w-md mx-auto w-full flex items-center justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-[#A3E635] uppercase tracking-[0.3em] mb-0.5">Деталі вправи</span>
                        <h1 className="text-sm font-bold text-white/90 truncate max-w-[200px]">{exercise.name}</h1>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            <div className="relative z-10 px-4 py-8 flex flex-col gap-8 max-w-md mx-auto w-full">
                {/* Картка інформації */}
                <section className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2 text-white">
                        <div className="px-3 py-1 rounded-full bg-[#A3E635]/10 border border-[#A3E635]/20 text-[10px] font-bold text-[#A3E635] uppercase tracking-wider">
                            {exercise.muscle}
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                            {exercise.type === 'weight' ? 'З вагою' : exercise.type === 'time' ? 'На час' : 'Власна вага'}
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                        {exercise.name}
                    </h2>
                </section>

                {/* Прогрес (Графік) */}
                {history.length > 0 && (
                    <section className="neural-card rounded-3xl p-6 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#A3E635]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Твій прогрес
                            </h3>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{history.length} тренувань</span>
                        </div>

                        <div className="h-40 w-full relative flex items-end gap-1 px-1">
                            {/* Проста візуалізація графіка */}
                            {history.slice(0, 10).reverse().map((day, i) => {
                                const maxInBatch = Math.max(...history.map(h => h.maxWeight)) || 1
                                const height = (day.maxWeight / maxInBatch) * 100
                                return (
                                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                                        <div
                                            className="w-full bg-gradient-to-t from-[#A3E635]/20 to-[#A3E635] rounded-t-sm transition-all duration-500 hover:from-[#A3E635]/40 hover:to-[#A3E635]"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        />
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[#A3E635] text-[#080b10] text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg transition-opacity whitespace-nowrap z-20">
                                            {day.maxWeight} кг
                                        </div>
                                    </div>
                                )
                            })}
                            {/* Baseline */}
                            <div className="absolute bottom-0 left-0 w-full h-px bg-white/10" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Макс. вага</span>
                                <span className="text-xl font-mono font-bold text-[#A3E635]">{Math.max(...history.map(h => h.maxWeight))} кг</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Останній раз</span>
                                <span className="text-xl font-mono font-bold text-white/80">{history[0].maxWeight} кг</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* Інструкції */}
                {instructions.length > 0 && (
                    <section className="flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] px-1">Інструкції</h3>
                        <div className="flex flex-col gap-4">
                            {instructions.map((step, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-white/30 group-hover:border-[#A3E635]/30 group-hover:text-[#A3E635] transition-all">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-white/60 leading-relaxed pt-0.5">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Світла порожнеча якщо немає історії */}
                {history.length === 0 && (
                    <div className="neural-card rounded-3xl p-8 text-center flex flex-col items-center gap-4 opacity-50">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                            </svg>
                        </div>
                        <p className="text-xs text-white/30 leading-relaxed">Тут з'явиться історія твоїх досягнень,<br />коли ти виконаєш цю вправу вперше!</p>
                    </div>
                )}
            </div>
        </main>
    )
}
