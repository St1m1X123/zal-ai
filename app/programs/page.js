'use client'

import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '../../context/AppContext'
import { ProgramsSkeleton } from '../../components/Skeleton'

const IconBolt = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
)
const IconPlay = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
    </svg>
)
const IconTrash = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
)
const IconChevronDown = ({ className, isOpen }) => (
    <svg className={`${className} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
)

export default function ProgramsPage() {
    const router = useRouter()
    const { user, loading: globalLoading, programs: cachedPrograms, setPrograms, templates } = useApp()
    
    // We display templates that don't belong to any specific AI program
    const standaloneTemplates = templates?.filter(t => t.program_id === null) || []
    
    const [expandedProgram, setExpandedProgram] = useState(null)
    const [isCreating, setIsCreating] = useState(null)
    const [isDeletingId, setIsDeletingId] = useState(null)

    const handleStartWorkout = async (templateId, templateName) => {
        setIsCreating(templateId)
        try {
            const { data: newWorkoutId, error } = await supabase.rpc('start_workout_from_template', {
                p_template_id: templateId, p_user_id: user.id, p_workout_name: templateName
            })
            if (error) throw error
            router.push(`/workout/${newWorkoutId}`)
        } catch {
            alert('Не вдалося запустити тренування.')
            setIsCreating(null)
        }
    }

    const handleEditTemplate = (templateId) => {
        router.push(`/template/${templateId}`)
    }

    const handleDeleteProgram = async (programId, name) => {
        if (!window.confirm(`Видалити програму "${name}" та всі її дні?`)) return
        setIsDeletingId(programId)
        try {
            const { error } = await supabase.from('programs').delete().eq('id', programId).eq('user_id', user.id)
            if (error) throw error
            if (setPrograms) {
                setPrograms(prev => prev.filter(p => p.id !== programId))
            }
        } catch {
            alert('Помилка при видаленні.')
        } finally {
            setIsDeletingId(null)
        }
    }

    const handleDeleteStandaloneTemplate = async (templateId, name) => {
        if (!window.confirm(`Видалити тренування "${name}"?`)) return
        setIsDeletingId(templateId)
        try {
            const { error } = await supabase.from('workouts').delete().eq('id', templateId).eq('user_id', user.id)
            if (error) throw error
            if (setTemplates) {
                setTemplates(prev => prev.filter(t => t.id !== templateId))
            }
        } catch {
            alert('Помилка при видаленні.')
        } finally {
            setIsDeletingId(null)
        }
    }

    if (globalLoading || !user) {
        return <ProgramsSkeleton />
    }

    const hasContent = cachedPrograms?.length > 0 || standaloneTemplates.length > 0

    return (
        <main className="min-h-screen text-white relative pb-32">
            {/* ХЕДЕР */}
            <header className="sticky top-0 z-20 px-4 pt-5 pb-4 bg-[#080b10] border-b border-white/[0.05]">
                <div className="mx-auto w-full max-w-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[#22D3EE]/50 tracking-[0.2em] mb-1">AI Розклад</p>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Мої Програми</h1>
                        </div>
                        <button
                            onClick={() => router.push('/create-workout')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A3E635] text-[#080b10] font-black text-[11px] uppercase tracking-widest hover:bg-[#b8f053] active:scale-95 transition-all shadow-[0_0_20px_rgba(163,230,53,0.25)]"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            Тренування
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-4 py-6 flex flex-col gap-6 max-w-md mx-auto w-full">

                {!hasContent && (
                    <div className="neural-card rounded-3xl p-10 text-center flex flex-col items-center gap-5 mt-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-[#22D3EE]/5 border border-[#22D3EE]/15 flex items-center justify-center">
                                <svg className="w-7 h-7 text-[#22D3EE]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 ai-badge text-[9px]">AI</div>
                        </div>
                        <div>
                            <h3 className="text-white/60 font-semibold text-sm mb-1">Програм ще немає</h3>
                            <p className="text-white/25 text-xs leading-relaxed">Згенеруй план через AI на головній<br />або створи свій власний шаблон</p>
                        </div>
                        <Link href="/" className="px-6 py-2.5 rounded-full text-xs font-bold tracking-wider bg-[#22D3EE]/10 border border-[#22D3EE]/25 text-[#22D3EE] hover:bg-[#22D3EE] hover:text-[#080b10] transition-all">
                            На головну
                        </Link>
                    </div>
                )}

                {/* РОЗКЛАДИ (AI Програми) */}
                {cachedPrograms?.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <h2 className="text-[11px] font-bold text-[#22D3EE]/60 tracking-wider px-1">AI Плани на тиждень</h2>
                        {cachedPrograms.map(p => {
                            const isExpanded = expandedProgram === p.id
                            return (
                                <div key={p.id} className="neural-card rounded-2xl overflow-hidden border border-[#22D3EE]/10" style={{ background: isExpanded ? 'rgba(34,211,238,0.02)' : '' }}>
                                    {/* Program Header */}
                                    <button
                                        onClick={() => setExpandedProgram(isExpanded ? null : p.id)}
                                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center shrink-0">
                                                <svg className="w-5 h-5 text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-white/90">{p.name}</h3>
                                                <p className="text-[10px] text-white/40 mt-0.5">{p.goal} · {p.days_per_week} дні(в) на тиждень</p>
                                            </div>
                                        </div>
                                        <IconChevronDown className="w-5 h-5 text-white/30" isOpen={isExpanded} />
                                    </button>

                                    {/* Expanded Days Area */}
                                    {isExpanded && (
                                        <div className="border-t border-white/[0.05] bg-[#080B10]/40 p-3 flex flex-col gap-2">
                                            {p.workouts.map(day => (
                                                <div key={day.id} className="rounded-xl border border-white/[0.03] bg-white/[0.02] px-4 py-3 flex items-center justify-between group">
                                                    <div className="flex-1 min-w-0 relative">
                                                        <h4 className="text-xs font-semibold text-white/80">{day.name}</h4>
                                                        <div className="flex flex-nowrap gap-1 mt-2 overflow-x-auto hide-scrollbar [mask-image:linear-gradient(to_right,white_85%,transparent)]">
                                                            {day.workout_exercises?.filter(we => we.exercises).map((we, i) => (
                                                                <Link
                                                                    key={i}
                                                                    href={`/exercises/${we.exercise_id}`}
                                                                    className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.05] text-[8px] font-medium text-white/40 whitespace-nowrap hover:bg-[#A3E635]/20 hover:text-[#A3E635] hover:border-[#A3E635]/30 transition-all flex items-center gap-1"
                                                                >
                                                                    {we.exercises.name}
                                                                    <span className="opacity-40 italic font-serif">i</span>
                                                                </Link>
                                                            ))}
                                                            {(!day.workout_exercises || day.workout_exercises.length === 0) && (
                                                                <span className="text-[10px] text-white/40">Немає вправ</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEditTemplate(day.id)}
                                                            className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-white/30 hover:text-white/80 hover:bg-white/5 transition-all duration-300 active:scale-90"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleStartWorkout(day.id, day.name)}
                                                            disabled={isCreating === day.id}
                                                            className="h-9 px-5 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/30 flex items-center justify-center text-[#A3E635] text-[10px] font-black tracking-widest hover:bg-[#A3E635] hover:text-[#080b10] hover:shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all duration-300 active:scale-95 disabled:opacity-50"
                                                        >
                                                            {isCreating === day.id ? '...' : 'СТАРТ'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="mt-2 text-right flex justify-end">
                                                <button
                                                    onClick={() => handleDeleteProgram(p.id, p.name)}
                                                    disabled={isDeletingId === p.id}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                >
                                                    {isDeletingId === p.id ? <div className="w-3.5 h-3.5 border border-red-500/50 border-t-red-500 rounded-full animate-spin" /> : <IconTrash className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </section>
                )}

                {/* МОЇ ТРЕНУВАННЯ */}
                {standaloneTemplates.length > 0 && (
                    <section className="flex flex-col gap-3">
                        <div className="flex items-center justify-between mb-1 px-1 mt-2">
                            <h2 className="text-[11px] font-bold text-white/30 tracking-wider">Мої тренування</h2>
                        </div>

                        {standaloneTemplates.map(template => (
                            <div key={template.id} className="neural-card rounded-2xl px-5 py-4 flex items-center justify-between group">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-9 h-9 rounded-xl bg-[#A3E635]/5 border border-[#A3E635]/10 flex items-center justify-center shrink-0">
                                        <IconBolt className="w-4 h-4 text-[#A3E635]/60" />
                                    </div>
                                    <div className="min-w-0 relative">
                                        <h3 className="text-sm font-semibold text-white/80 truncate">{template.name}</h3>
                                        <div className="flex flex-nowrap gap-1 mt-2 overflow-x-auto hide-scrollbar [mask-image:linear-gradient(to_right,white_85%,transparent)]">
                                            {template.workout_exercises?.filter(we => we.exercises).map((we, i) => (
                                                <Link
                                                    key={i}
                                                    href={`/exercises/${we.exercise_id}`}
                                                    className="px-1.5 py-0.5 rounded bg-[#A3E635]/5 border border-[#A3E635]/10 text-[8px] font-medium text-[#A3E635]/50 whitespace-nowrap hover:bg-[#A3E635]/20 hover:text-[#A3E635] transition-all flex items-center gap-1"
                                                >
                                                    {we.exercises.name}
                                                    <span className="opacity-40 italic font-serif">i</span>
                                                </Link>
                                            ))}
                                            {(!template.workout_exercises || template.workout_exercises.length === 0) && (
                                                <span className="text-[10px] text-white/40">Немає вправ</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-3 shrink-0">
                                    <button
                                        onClick={() => handleDeleteStandaloneTemplate(template.id, template.name)}
                                        disabled={isDeletingId === template.id}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        {isDeletingId === template.id ? <div className="w-3.5 h-3.5 border border-red-400/40 border-t-red-400 rounded-full animate-spin" /> : <IconTrash className="w-4 h-4" />}
                                    </button>

                                    <button
                                        onClick={() => handleEditTemplate(template.id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => handleStartWorkout(template.id, template.name)}
                                        disabled={isCreating === template.id}
                                        className="w-9 h-9 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center text-[#A3E635] hover:bg-[#A3E635] hover:text-[#080b10] hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] transition-all"
                                    >
                                        {isCreating === template.id ? <div className="w-3.5 h-3.5 border border-[#A3E635]/50 border-t-[#A3E635] rounded-full animate-spin" /> : <IconPlay className="w-4 h-4 ml-0.5" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </section>
                )}


            </div>
        </main >
    )
}
