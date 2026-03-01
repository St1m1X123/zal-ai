'use client'

import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

export default function ProgramsPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [templates, setTemplates] = useState([])
    const [isCreating, setIsCreating] = useState(null)
    const [isDeleting, setIsDeleting] = useState(null)

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const currentUser = session?.user
            if (!currentUser) { router.push('/'); return }
            setUser(currentUser)

            const { data, error } = await supabase
                .from('workouts')
                .select('*, workout_exercises(count)')
                .eq('is_template', true).eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
            if (!error) setTemplates(data || [])
            setLoading(false)
        }
        init()
    }, [router])

    const handleStartWorkout = async (template) => {
        setIsCreating(template.id)
        try {
            const { data: newWorkoutId, error } = await supabase.rpc('start_workout_from_template', {
                p_template_id: template.id, p_user_id: user.id, p_workout_name: template.name
            })
            if (error) throw error
            router.push(`/workout/${newWorkoutId}`)
        } catch {
            alert('Не вдалося запустити тренування.')
            setIsCreating(null)
        }
    }

    const handleDeleteTemplate = async (templateId, templateName) => {
        if (!window.confirm(`Видалити програму "${templateName}"?`)) return
        setIsDeleting(templateId)
        try {
            const { error } = await supabase.from('workouts').delete().eq('id', templateId).eq('user_id', user.id)
            if (error) throw error
            setTemplates(prev => prev.filter(t => t.id !== templateId))
        } catch {
            alert('Помилка при видаленні.')
        } finally {
            setIsDeleting(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center">
                        <IconBolt className="w-5 h-5 text-[#A3E635] animate-pulse" />
                    </div>
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Завантаження</span>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen text-white relative pb-32">

            {/* ХЕДЕР */}
            <header className="sticky top-0 z-20 px-4 pt-5 pb-4">
                <div className="mx-auto w-full max-w-md">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-[#22D3EE]/50 uppercase tracking-[0.25em] mb-1">ZalAI</p>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Програми</h1>
                        </div>
                        <div className="ai-badge">
                            <span>✦</span> {templates.length} програм
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-4 flex flex-col gap-3 max-w-md mx-auto w-full">

                {templates.length > 0 ? (
                    <>
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="neural-card rounded-2xl px-5 py-4 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-9 h-9 rounded-xl bg-[#A3E635]/5 border border-[#A3E635]/10 flex items-center justify-center shrink-0">
                                        <IconBolt className="w-4 h-4 text-[#A3E635]/60" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-white/80 truncate">{template.name}</h3>
                                        <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] mt-0.5">
                                            {template.workout_exercises?.[0]?.count
                                                ? `${template.workout_exercises[0].count} вправ`
                                                : 'Шаблон'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-3 shrink-0">
                                    {/* Видалити */}
                                    <button
                                        onClick={() => handleDeleteTemplate(template.id, template.name)}
                                        disabled={isDeleting === template.id}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    >
                                        {isDeleting === template.id
                                            ? <div className="w-3.5 h-3.5 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                                            : <IconTrash className="w-4 h-4" />
                                        }
                                    </button>

                                    {/* Запустити */}
                                    <button
                                        onClick={() => handleStartWorkout(template)}
                                        disabled={isCreating === template.id}
                                        className="w-9 h-9 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center text-[#A3E635] hover:bg-[#A3E635] hover:text-[#080b10] hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] transition-all"
                                    >
                                        {isCreating === template.id
                                            ? <div className="w-3.5 h-3.5 border border-[#A3E635]/50 border-t-[#A3E635] rounded-full animate-spin" />
                                            : <IconPlay className="w-4 h-4 ml-0.5" />
                                        }
                                    </button>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    /* Порожній стан */
                    <div className="neural-card rounded-3xl p-10 text-center flex flex-col items-center gap-5 mt-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-[#22D3EE]/5 border border-[#22D3EE]/15 flex items-center justify-center">
                                <svg className="w-7 h-7 text-[#22D3EE]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 ai-badge">AI</div>
                        </div>
                        <div>
                            <h3 className="text-white/60 font-semibold text-sm mb-1">Програм ще немає</h3>
                            <p className="text-white/25 text-xs leading-relaxed">Створи свою першу програму<br />і ZalAI запам'ятає всі ваги</p>
                        </div>
                        <Link
                            href="/create-workout"
                            className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#A3E635]/10 border border-[#A3E635]/25 text-[#A3E635] hover:bg-[#A3E635] hover:text-[#080b10] transition-all"
                        >
                            Створити програму
                        </Link>
                    </div>
                )}

                {/* Кнопка нова програма */}
                {templates.length > 0 && (
                    <Link
                        href="/create-workout"
                        className="neural-card rounded-2xl py-4 flex items-center justify-center gap-3 group hover:border-[#A3E635]/20 active:scale-[0.98] transition-all mt-2"
                    >
                        <div className="w-7 h-7 rounded-lg bg-[#A3E635]/5 border border-[#A3E635]/15 flex items-center justify-center group-hover:bg-[#A3E635]/10 group-hover:border-[#A3E635]/30 transition-all">
                            <svg className="w-3.5 h-3.5 text-[#A3E635]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/70 transition-colors">
                            Нова програма
                        </span>
                    </Link>
                )}
            </div>
        </main>
    )
}
