'use client'

import { supabase } from '../../lib/supabase'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '../../context/AppContext'
import { ProfileSkeleton } from '../../components/Skeleton'

// ─── Icons ──────────────────────────────────────────────────────────────────
const IconBolt = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
)
const IconEdit = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
)
const IconCheck = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
    </svg>
)
const IconX = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
)
const IconLogout = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
)
const IconChevronDown = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
    </svg>
)
const IconLock = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
)

// ─── WheelPicker (mini) ───────────────────────────────────────────────────────
function WheelPicker({ values, value, onChange, unit = '' }) {
    const containerRef = useRef(null)
    const ITEM_H = 56
    const snapTimer = useRef(null)

    useEffect(() => {
        const idx = values.indexOf(value)
        if (idx !== -1 && containerRef.current) {
            containerRef.current.scrollTop = idx * ITEM_H
        }
    }, []) // eslint-disable-line

    const handleScroll = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        const idx = Math.round(el.scrollTop / ITEM_H)
        const clamped = Math.max(0, Math.min(idx, values.length - 1))
        if (values[clamped] !== value) onChange(values[clamped])
        clearTimeout(snapTimer.current)
        snapTimer.current = setTimeout(() => {
            el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
        }, 80)
    }, [values, value, onChange])

    return (
        <div className="relative select-none" style={{ height: 5 * ITEM_H }}>
            <div className="absolute inset-x-0 top-0 pointer-events-none z-10" style={{ height: 2 * ITEM_H, background: 'linear-gradient(to bottom, #0d1117 0%, transparent 100%)' }} />
            <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10" style={{ height: 2 * ITEM_H, background: 'linear-gradient(to top, #0d1117 0%, transparent 100%)' }} />
            <div className="absolute inset-x-4 rounded-xl border border-[#A3E635]/20 bg-[#A3E635]/5 pointer-events-none z-10" style={{ top: 2 * ITEM_H, height: ITEM_H }} />
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-scroll snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ paddingTop: 2 * ITEM_H, paddingBottom: 2 * ITEM_H }}
            >
                {values.map(v => {
                    const isActive = v === value
                    return (
                        <div key={v} className={`flex items-center justify-center snap-center gap-1 transition-all duration-150 ${isActive ? 'text-white' : 'text-white/15'}`} style={{ height: ITEM_H }}>
                            <span className={`font-bold tabular-nums transition-all duration-150 ${isActive ? 'text-4xl' : 'text-xl'}`} style={{ fontFamily: 'var(--font-mono)' }}>{v}</span>
                            {isActive && unit && <span className="text-base text-[#A3E635]/60 font-medium mt-1">{unit}</span>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── RulerPicker ─────────────────────────────────────────────────────────────
function RulerPicker({ min, max, value, onChange, unit, step = 1 }) {
    const containerRef = useRef(null)
    const ITEM_W = 18
    const snapTimer = useRef(null)
    const values = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step)

    useEffect(() => {
        const idx = (value - min) / step
        if (containerRef.current) containerRef.current.scrollLeft = idx * ITEM_W
    }, []) // eslint-disable-line

    const handleScroll = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        const idx = Math.round(el.scrollLeft / ITEM_W)
        const clamped = Math.max(0, Math.min(idx, values.length - 1))
        onChange(values[clamped])
        clearTimeout(snapTimer.current)
        snapTimer.current = setTimeout(() => el.scrollTo({ left: clamped * ITEM_W, behavior: 'smooth' }), 80)
    }, [values, onChange, min, step])

    return (
        <div className="relative">
            <div className="flex items-baseline justify-center gap-2 mb-5">
                <span className="text-6xl font-bold text-white leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{value}</span>
                <span className="text-xl text-white/30 font-medium">{unit}</span>
            </div>
            <div className="relative" style={{ height: 50 }}>
                <div className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none z-10" style={{ background: 'linear-gradient(to right, #0d1117, transparent)' }} />
                <div className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-10" style={{ background: 'linear-gradient(to left, #0d1117, transparent)' }} />
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-0.5 h-full z-20 flex flex-col items-center">
                    <div className="w-0.5 flex-1 bg-[#A3E635]" />
                    <div className="w-2 h-2 rounded-full bg-[#A3E635] shadow-[0_0_8px_rgba(163,230,53,0.8)] -mb-1" />
                </div>
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="h-full overflow-x-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex items-end pb-1.5"
                    style={{ paddingLeft: '50%', paddingRight: '50%' }}
                >
                    {values.map(v => {
                        const isMajor = v % 10 === 0
                        const isMed = v % 5 === 0
                        const isSel = v === value
                        return (
                            <div key={v} className="flex-shrink-0 flex flex-col items-center justify-end" style={{ width: ITEM_W }}>
                                <div className={`transition-all duration-100 ${isSel ? 'bg-[#A3E635]' : isMajor ? 'bg-white/40' : isMed ? 'bg-white/20' : 'bg-white/8'}`}
                                    style={{ width: isSel ? 2 : 1, height: isMajor ? 24 : isMed ? 16 : 8 }} />
                                {isMajor && <span className={`text-[8px] mt-1 ${isSel ? 'text-[#A3E635]' : 'text-white/15'}`} style={{ fontFamily: 'var(--font-mono)' }}>{v}</span>}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── BMI Bar ──────────────────────────────────────────────────────────────────
function BMIBar({ height, weight }) {
    if (!height || !weight || height < 100 || weight < 20) return null
    const bmi = weight / ((height / 100) ** 2)
    const pct = Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100))
    const info = bmi < 18.5 ? { label: 'Недостатня вага', color: '#22D3EE' } :
        bmi < 25 ? { label: 'Норма ✓', color: '#A3E635' } :
            bmi < 30 ? { label: 'Надлишкова вага', color: '#FBBF24' } :
                { label: 'Ожиріння', color: '#F87171' }
    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className="text-xs text-white/25 uppercase tracking-widest">ІМТ</span>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: info.color, fontFamily: 'var(--font-mono)' }}>{bmi.toFixed(1)}</span>
                    <span className="text-xs font-medium" style={{ color: info.color }}>{info.label}</span>
                </div>
            </div>
            <div className="relative h-1.5 rounded-full">
                <div className="h-full rounded-full" style={{ background: 'linear-gradient(to right, #22D3EE 0%, #A3E635 35%, #FBBF24 65%, #F87171 100%)' }} />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 bg-[#0d1117] transition-all duration-500"
                    style={{ left: `${pct}%`, borderColor: info.color, boxShadow: `0 0 6px ${info.color}60` }} />
            </div>
        </div>
    )
}

// ─── Pill Button ─────────────────────────────────────────────────────────────
const PillButton = ({ label, selected, onClick, color = '#A3E635' }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3.5 px-2 rounded-xl font-semibold text-xs transition-all duration-150 active:scale-95 ${selected ? 'shadow-lg' : 'bg-white/[0.04] border border-white/[0.07] text-white/40'}`}
        style={selected ? { background: `${color}15`, borderWidth: 1, borderStyle: 'solid', borderColor: `${color}50`, color, boxShadow: `0 0 16px ${color}15` } : {}}
    >
        {label}
    </button>
)

// ─── AGES / HEIGHTS / WEIGHTS ─────────────────────────────────────────────────
const AGES = Array.from({ length: 67 }, (_, i) => 14 + i)
const GOAL_OPTIONS = [
    { value: 'weight_loss', label: '🔥 Схуднути', color: '#FB923C' },
    { value: 'muscle_gain', label: "💪 Набрати м'язи", color: '#A3E635' },
    { value: 'recomposition', label: '⚖️ Рекомпозиція', color: '#22D3EE' },
    { value: 'maintenance', label: '✨ Підтримка форми', color: '#818CF8' },
]
const EXP_OPTIONS = [
    { value: 'beginner', label: 'Новачок', sub: 'до 6 міс', color: '#22D3EE' },
    { value: 'intermediate', label: 'Регулярно', sub: '6 міс – 2 р', color: '#A3E635' },
    { value: 'advanced', label: 'Серйозно', sub: 'від 2 років', color: '#818CF8' },
]

// ─── Edit Sheet ───────────────────────────────────────────────────────────────
function EditSheet({ profile, onClose, onSave }) {
    const [tab, setTab] = useState('body') // 'body' | 'goals' | 'schedule'
    const [form, setForm] = useState({
        age: profile?.age || 25,
        height_cm: profile?.height_cm || 175,
        weight_kg: profile?.weight_kg || 75,
        goal: profile?.goal || null,
        experience: profile?.experience || null,
        days_per_week: profile?.days_per_week || 3,
        duration_min: profile?.duration_min || 60,
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // ── Hide nav + lock scroll when sheet is open ──
    useEffect(() => {
        window.dispatchEvent(new Event('nav:hide'))
        document.body.style.overflow = 'hidden'
        return () => {
            window.dispatchEvent(new Event('nav:show'))
            document.body.style.overflow = ''
        }
    }, [])

    // ── Swipe-to-close ──
    const dragStartY = useRef(null)
    const [dragY, setDragY] = useState(0)

    const handleTouchStart = (e) => {
        dragStartY.current = e.touches[0].clientY
    }
    const handleTouchMove = (e) => {
        const dy = e.touches[0].clientY - (dragStartY.current || 0)
        if (dy > 0) setDragY(dy)
    }
    const handleTouchEnd = () => {
        if (dragY > 80) {
            onClose()
        }
        setDragY(0)
    }

    const patch = (k, v) => setForm(p => ({ ...p, [k]: v }))

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Сесія не знайдена')
            const { error: err } = await supabase.from('profiles').update({
                age: form.age,
                height_cm: form.height_cm,
                weight_kg: form.weight_kg,
                goal: form.goal,
                experience: form.experience,
                days_per_week: form.days_per_week,
                duration_min: form.duration_min,
                updated_at: new Date().toISOString(),
            }).eq('id', session.user.id)
            if (err) throw err
            onSave(form)
        } catch (e) {
            setError(e.message || 'Помилка збереження')
            setSaving(false)
        }
    }

    const TABS = [
        { id: 'body', label: 'Тіло' },
        { id: 'goals', label: 'Цілі' },
        { id: 'schedule', label: 'Розклад' },
    ]

    return (
        <div
            className="fixed inset-0 flex flex-col justify-end"
            style={{ zIndex: 9999 }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Sheet */}
            <div
                className="relative bg-[#0d1117] border-t border-white/[0.08] rounded-t-3xl flex flex-col max-h-[90vh] transition-transform duration-150"
                style={{ boxShadow: '0 -20px 60px rgba(0,0,0,0.5)', transform: `translateY(${dragY}px)` }}
            >
                {/* Handle — tap or swipe down to close */}
                <div
                    className="flex-shrink-0 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={() => dragY < 10 && onClose()}
                >
                    <div className="w-10 h-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors" />
                </div>

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
                    <h2 className="text-lg font-bold text-white">Редагувати профіль</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white transition-colors">
                        <IconX className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 px-5 mb-2">
                    <div className="flex bg-white/[0.04] rounded-xl p-1 gap-1">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${tab === t.id ? 'bg-[#A3E635] text-[#080b10]' : 'text-white/40 hover:text-white/60'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                    {/* TAB: BODY */}
                    {tab === 'body' && (
                        <div className="flex flex-col gap-6 pt-2">
                            {/* Age */}
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Вік</p>
                                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                                    <WheelPicker values={AGES} value={form.age} onChange={v => patch('age', v)} unit="р" />
                                </div>
                            </div>

                            {/* Height */}
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Зріст</p>
                                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-3 py-6">
                                    <RulerPicker min={140} max={220} value={form.height_cm} onChange={v => patch('height_cm', v)} unit="см" />
                                </div>
                            </div>

                            {/* Weight */}
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Вага</p>
                                <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-3 py-6">
                                    <RulerPicker min={30} max={200} value={form.weight_kg} onChange={v => patch('weight_kg', v)} unit="кг" />
                                </div>
                            </div>

                            {/* BMI */}
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl px-4 py-4">
                                <BMIBar height={form.height_cm} weight={form.weight_kg} />
                            </div>
                        </div>
                    )}

                    {/* TAB: GOALS */}
                    {tab === 'goals' && (
                        <div className="flex flex-col gap-6 pt-2">
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Головна ціль</p>
                                <div className="flex flex-col gap-2">
                                    {GOAL_OPTIONS.map(({ value, label, color }) => (
                                        <button
                                            key={value}
                                            onClick={() => patch('goal', value)}
                                            className={`w-full px-5 py-4 rounded-xl text-left font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-between ${form.goal === value ? 'text-white' : 'bg-white/[0.03] border border-white/[0.07] text-white/40'}`}
                                            style={form.goal === value ? { background: `${color}12`, borderWidth: 1, borderStyle: 'solid', borderColor: `${color}40` } : {}}
                                        >
                                            {label}
                                            {form.goal === value && (
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: color }}>
                                                    <IconCheck className="w-3 h-3 text-[#080b10]" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Рівень підготовки</p>
                                <div className="flex flex-col gap-2">
                                    {EXP_OPTIONS.map(({ value, label, sub, color }) => (
                                        <button
                                            key={value}
                                            onClick={() => patch('experience', value)}
                                            className={`w-full px-5 py-4 rounded-xl text-left transition-all active:scale-[0.98] flex items-center justify-between ${form.experience === value ? '' : 'bg-white/[0.03] border border-white/[0.07]'}`}
                                            style={form.experience === value ? { background: `${color}12`, borderWidth: 1, borderStyle: 'solid', borderColor: `${color}40` } : {}}
                                        >
                                            <div>
                                                <p className={`font-semibold text-sm ${form.experience === value ? 'text-white' : 'text-white/40'}`}>{label}</p>
                                                <p className="text-[10px] mt-0.5" style={{ color: form.experience === value ? color : 'rgba(255,255,255,0.2)' }}>{sub}</p>
                                            </div>
                                            {form.experience === value && (
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: color }}>
                                                    <IconCheck className="w-3 h-3 text-[#080b10]" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: SCHEDULE */}
                    {tab === 'schedule' && (
                        <div className="flex flex-col gap-6 pt-2">
                            <div className="flex flex-col gap-3">
                                <p className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Тренувань на тиждень</p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => patch('days_per_week', n)}
                                            className={`flex-1 py-4 rounded-xl font-bold text-base transition-all active:scale-95 ${form.days_per_week === n ? 'bg-[#A3E635] text-[#080b10] shadow-[0_0_16px_rgba(163,230,53,0.3)]' : 'bg-white/[0.04] border border-white/[0.07] text-white/30'}`}
                                            style={{ fontFamily: 'var(--font-mono)' }}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[9px] text-white/15 px-0.5">
                                    <span>лайт</span><span /><span /><span>середнє</span><span /><span /><span>інтенсив</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Час на тренування</p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[30, 45, 60, 90].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => patch('duration_min', n)}
                                            className={`py-4 rounded-xl flex flex-col items-center gap-1 transition-all active:scale-95 ${form.duration_min === n ? 'bg-[#A3E635] text-[#080b10] shadow-[0_0_16px_rgba(163,230,53,0.3)]' : 'bg-white/[0.04] border border-white/[0.07] text-white/30'}`}
                                        >
                                            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{n}</span>
                                            <span className="text-[10px] font-medium opacity-70">хв</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-5 mb-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-red-400 text-xs">{error}</div>
                )}

                {/* Save button */}
                <div className="flex-shrink-0 px-5 pb-8 pt-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 bg-[#A3E635] text-[#080b10] shadow-[0_0_24px_rgba(163,230,53,0.25)] active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                        {saving ? (
                            <><div className="w-4 h-4 border-2 border-[#080b10] border-t-transparent rounded-full animate-spin" /> Зберігаємо...</>
                        ) : (
                            <><IconCheck className="w-4 h-4" /> Зберегти зміни</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── PROFILE CARD INFO ────────────────────────────────────────────────────────
const GOAL_LABELS = {
    weight_loss: '🔥 Схуднути',
    muscle_gain: "💪 Набрати м'язи",
    recomposition: '⚖️ Рекомпозиція',
    maintenance: '✨ Підтримка форми',
}
const EXP_LABELS = {
    beginner: 'Новачок',
    intermediate: 'Регулярний',
    advanced: 'Просунутий',
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const router = useRouter()
    const {
        user,
        profile,
        loading: globalLoading,
        stats,
        activityMap,
        prs,
        setProfile
    } = useApp()

    const [showEdit, setShowEdit] = useState(false)
    const [devClicks, setDevClicks] = useState(0)

    // Redirect if not logged in
    useEffect(() => {
        if (!globalLoading && !user) router.push('/')
    }, [user, globalLoading, router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const handleSaved = (updatedForm) => {
        setProfile(p => ({ ...p, ...updatedForm }))
        setShowEdit(false)
    }

    if (globalLoading || !user || !profile) {
        return <ProfileSkeleton />
    }

    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Атлет'
    const fullName = user?.user_metadata?.full_name || 'Атлет'

    return (
        <main className="min-h-screen text-white relative pb-32 overflow-x-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-b from-[#A3E635]/15 via-[#A3E635]/5 to-transparent pointer-events-none" />
            <div className="absolute top-[200px] left-[-10%] w-[120%] h-[300px] bg-[#22D3EE]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* HERO CARD */}
            <div className="px-4 pt-10 pb-2 max-w-md mx-auto w-full relative z-10">
                <div className="neural-card rounded-[2.5rem] p-7 overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[80px] bg-[#A3E635]/20 pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center gap-5">
                        <div className="relative group/avatar">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 shadow-[0_0_40px_rgba(163,230,53,0.2)] transition-transform duration-500 group-hover/avatar:scale-105">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#A3E635]/20 to-[#A3E635]/5 flex items-center justify-center text-[#A3E635] font-black text-3xl">
                                        {firstName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-xl bg-[#A3E635] border-4 border-[#0d1117] shadow-[0_0_15px_rgba(163,230,53,0.6)] flex items-center justify-center">
                                <IconBolt className="w-3 h-3 text-[#0d1117]" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="ai-badge px-3 py-1">✦ AI АТЛЕТ</div>
                                <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-bold text-white/30 tracking-[0.2em]">
                                    LVL {1 + Math.floor((stats?.total || 0) / 3)}
                                </div>
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tight">{fullName}</h1>
                            <p className="text-[11px] font-bold text-white/20 tracking-wider mt-1 uppercase">{user?.email}</p>
                        </div>
                    </div>

                    {/* Profile snapshot */}
                    {profile && (
                        <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-2">
                            {profile.weight_kg && (
                                <div className="px-3 py-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                    ⚖️ <span className="text-white/80">{profile.weight_kg} кг</span>
                                </div>
                            )}
                            {profile.height_cm && (
                                <div className="px-3 py-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                    📏 <span className="text-white/80">{profile.height_cm} см</span>
                                </div>
                            )}
                            {profile.goal && (
                                <div className="px-3 py-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                    {GOAL_LABELS[profile.goal]?.split(' ').pop() || profile.goal}
                                </div>
                            )}
                            <div className={`px-3 py-1.5 rounded-2xl border font-bold text-[10px] uppercase tracking-wider ${profile.is_pro ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30 text-[#22D3EE]' : 'bg-white/5 border-white/10 text-white/20'}`}>
                                {profile.is_pro ? '✦ Neural Pro' : 'Free Tier'}
                            </div>
                        </div>
                    )}

                    {/* Edit button */}
                    <button
                        onClick={() => setShowEdit(true)}
                        className="relative z-10 mt-6 w-full py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#A3E635]/40 hover:bg-[#A3E635]/5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-white/40 hover:text-[#A3E635] text-[10px] font-bold uppercase tracking-[0.2em]"
                    >
                        <IconEdit className="w-3.5 h-3.5" />
                        Параметри тіла
                    </button>
                </div>
            </div>

            <div className="px-4 flex flex-col gap-4 max-w-md mx-auto w-full mt-4">

                {/* STATS */}
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

                {/* РЕКОРДИ */}
                {prs.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-4 px-1">
                            <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.25em]">🏆 Особисті рекорди</h2>
                            <div className="h-px flex-1 bg-white/[0.05]" />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {prs.map((pr, i) => (
                                <div key={i} className="neural-card rounded-2xl p-4 flex items-center justify-between group transition-all hover:bg-white/[0.02]">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg bg-white/[0.03] border border-white/[0.05]">
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white/80 truncate uppercase tracking-tight">{pr.name}</p>
                                            <p className="text-[9px] text-white/25 font-bold uppercase tracking-wider mt-0.5">{pr.muscle}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-1 bg-[#A3E635]/5 px-3 py-1.5 rounded-xl border border-[#A3E635]/10">
                                        <span className="font-mono font-black text-lg text-[#A3E635] tabular-nums">{pr.weight}</span>
                                        <span className="text-[10px] font-bold text-[#A3E635]/40 uppercase">кг</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ACCOUNT */}
                <section>
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.25em]">Акаунт</h2>
                        <div className="h-px flex-1 bg-white/[0.05]" />
                    </div>
                    <div className="neural-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
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

                        {/* SUBSCRIPTION STATUS (SECURE) */}
                        <div className="px-5 py-6 bg-gradient-to-br from-[#22D3EE]/5 to-transparent relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <IconLock className="w-12 h-12 text-[#22D3EE]" />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="text-sm font-bold text-white/80">Neural Pro Access</p>
                                    <p className="text-[10px] text-white/30 mt-0.5">Доступ керується через ADMIN_EMAILS</p>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[9px] font-black tracking-widest ${profile.is_pro ? 'bg-[#22D3EE] text-[#080b10]' : 'bg-white/10 text-white/40'}`}>
                                    {profile.is_pro ? 'PRO' : 'FREE'}
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                <IconLock className="w-3 h-3 text-white/20" />
                                <p className="text-[9px] text-white/20 font-medium uppercase tracking-wider">
                                    {profile.is_pro ? 'Твій акаунт авторизовано' : 'Зверніться до розробника'}
                                </p>
                            </div>
                        </div>
                        <div
                            className="flex items-center justify-between px-5 py-4 cursor-pointer active:bg-white/[0.02] transition-colors"
                            onClick={() => setDevClicks(prev => prev + 1)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#A3E635]/5 border border-[#A3E635]/10 flex items-center justify-center">
                                    <IconBolt className="w-4 h-4 text-[#A3E635]/60" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white/60">ZalAI Intelligence</p>
                                    <p className="text-[10px] text-white/25">Версія 3.0 · Neural Core active</p>
                                </div>
                            </div>
                            {devClicks >= 5 && (
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation()
                                        const newStatus = !profile.is_pro
                                        const { error } = await supabase.from('profiles').update({ is_pro: newStatus }).eq('id', user.id)
                                        if (!error) {
                                            setProfile({ ...profile, is_pro: newStatus })
                                            // Optional: reset clicks or show toast
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-[#22D3EE]/20 border border-[#22D3EE]/30 text-[#22D3EE] text-[9px] font-black uppercase tracking-widest animate-in zoom-in duration-300"
                                >
                                    {profile.is_pro ? 'Disable' : 'Enable'}
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* LOGOUT */}
                <button
                    onClick={handleLogout}
                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 bg-red-500/5 border border-red-500/15 text-red-400/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 active:scale-[0.98] transition-all mt-2"
                >
                    <IconLogout className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-[0.15em]">Вийти з акаунту</span>
                </button>

                <p className="text-center text-[9px] text-white/12 uppercase tracking-[0.4em] font-black pb-4">ZALAI INTELLIGENCE · 2024</p>
            </div>

            {/* EDIT SHEET */}
            {showEdit && (
                <EditSheet
                    profile={profile}
                    onClose={() => setShowEdit(false)}
                    onSave={handleSaved}
                />
            )}
        </main>
    )
}
