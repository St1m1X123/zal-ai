'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

// ─── Icons (custom SVG, Neural Athlete style) ─────────────────────────────────

const IconBolt = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
)
const IconMale = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <circle cx="10" cy="14" r="5" />
        <path d="M15 9l5-5M15 4h5v5" />
    </svg>
)
const IconFemale = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <circle cx="12" cy="9" r="5" />
        <path d="M12 14v6M9 18h6" />
    </svg>
)
const IconFire = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c0 6-6 7-6 12a6 6 0 0012 0c0-5-6-6-6-12z" />
        <path d="M12 22c0-4 3-5 3-8a3 3 0 00-6 0c0 3 3 4 3 8z" />
    </svg>
)
const IconMuscle = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5c.5-1.5 2-2.5 3.5-2s2.5 2 2.5 3.5v1.5h3c1 0 2 .5 2.5 1.5s.5 2-.5 2.5l-1 .5c0 1-.5 2-1.5 2.5s-2 .5-2.5-.5l-.5-1c-.5.5-1.5 1-2.5.5S7 14 7 13l-2 .5c-1 .5-2 0-2.5-1S2 10 3 9.5L5 9c.5-1 1.5-2 1.5-2.5z" />
    </svg>
)
const IconBalance = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M5 6l7-3 7 3M3 11l4 6H3l4-6zM17 11l4 6h-8l4-6z" />
    </svg>
)
const IconStar = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
)
const IconCheck = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
    </svg>
)
const IconArrowRight = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
)
const IconChevronLeft = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 19l-7-7 7-7" />
    </svg>
)
const IconGym = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 5v14M18 5v14M6 12h12M3 7h3M18 7h3M3 17h3M18 17h3" />
    </svg>
)
const IconHome = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
)
const IconStreet = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.5 2 6 5 6 8c0 5 6 14 6 14s6-9 6-14c0-3-2.5-6-6-6z" />
        <circle cx="12" cy="8" r="2" />
    </svg>
)

// ─── WheelPicker ──────────────────────────────────────────────────────────────
const WheelPicker = ({ values, value, onChange, unit = '' }) => {
    const containerRef = useRef(null)
    const ITEM_H = 64
    const VISIBLE = 5
    const isScrolling = useRef(false)
    const scrollTimer = useRef(null)

    // Scroll to initial position
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

        // Snap after scroll ends
        clearTimeout(scrollTimer.current)
        scrollTimer.current = setTimeout(() => {
            el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
        }, 80)
    }, [values, value, onChange])

    return (
        <div className="relative select-none" style={{ height: VISIBLE * ITEM_H }}>
            {/* Top fade */}
            <div className="absolute inset-x-0 top-0 pointer-events-none z-10" style={{ height: 2 * ITEM_H, background: 'linear-gradient(to bottom, #080b10 0%, transparent 100%)' }} />
            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10" style={{ height: 2 * ITEM_H, background: 'linear-gradient(to top, #080b10 0%, transparent 100%)' }} />
            {/* Selection band */}
            <div
                className="absolute inset-x-6 rounded-2xl border border-[#A3E635]/20 bg-[#A3E635]/5 pointer-events-none z-10"
                style={{ top: 2 * ITEM_H, height: ITEM_H }}
            />

            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-scroll snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ paddingTop: 2 * ITEM_H, paddingBottom: 2 * ITEM_H }}
            >
                {values.map(v => {
                    const isActive = v === value
                    return (
                        <div
                            key={v}
                            className={`flex items-center justify-center snap-center transition-all duration-150 gap-1.5 ${isActive ? 'text-white' : 'text-white/15'}`}
                            style={{ height: ITEM_H }}
                        >
                            <span
                                className={`font-bold tabular-nums transition-all duration-150 ${isActive ? 'text-5xl' : 'text-2xl'}`}
                                style={{ fontFamily: 'var(--font-mono)', transform: isActive ? 'scale(1)' : 'scale(0.85)' }}
                            >
                                {v}
                            </span>
                            {isActive && unit && (
                                <span className="text-lg text-[#A3E635]/60 font-medium mt-2">{unit}</span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── RulerPicker ──────────────────────────────────────────────────────────────
const RulerPicker = ({ min, max, value, onChange, unit, step = 1 }) => {
    const containerRef = useRef(null)
    const ITEM_W = 18
    const snapTimer = useRef(null)
    const values = Array.from(
        { length: Math.floor((max - min) / step) + 1 },
        (_, i) => Math.round((min + i * step) * 10) / 10
    )

    useEffect(() => {
        const idx = (value - min) / step
        if (containerRef.current) {
            containerRef.current.scrollLeft = idx * ITEM_W
        }
    }, []) // eslint-disable-line

    const handleScroll = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        const idx = Math.round(el.scrollLeft / ITEM_W)
        const clamped = Math.max(0, Math.min(idx, values.length - 1))
        onChange(values[clamped])
        clearTimeout(snapTimer.current)
        snapTimer.current = setTimeout(() => {
            el.scrollTo({ left: clamped * ITEM_W, behavior: 'smooth' })
        }, 80)
    }, [values, onChange, min, step])

    return (
        <div className="relative">
            {/* Big value display */}
            <div className="flex items-baseline justify-center gap-2 mb-6">
                <span className="text-7xl font-bold text-white leading-none" style={{ fontFamily: 'var(--font-mono)' }}>
                    {value}
                </span>
                <span className="text-2xl text-white/30 font-medium">{unit}</span>
            </div>

            {/* Ruler */}
            <div className="relative" style={{ height: 56 }}>
                {/* Left and right fades */}
                <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-10" style={{ background: 'linear-gradient(to right, #080b10, transparent)' }} />
                <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10" style={{ background: 'linear-gradient(to left, #080b10, transparent)' }} />
                {/* Center marker */}
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-0.5 h-full z-20 flex flex-col items-center">
                    <div className="w-0.5 flex-1 bg-[#A3E635]" />
                    <div className="w-2 h-2 rounded-full bg-[#A3E635] shadow-[0_0_8px_rgba(163,230,53,0.8)] -mb-1" />
                </div>

                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="h-full overflow-x-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex items-end pb-2"
                    style={{ paddingLeft: '50%', paddingRight: '50%' }}
                >
                    {values.map((v) => {
                        const isMajor = v % 10 === 0
                        const isMed = v % 5 === 0
                        const isSelected = v === value
                        return (
                            <div
                                key={v}
                                className="flex-shrink-0 flex flex-col items-center justify-end"
                                style={{ width: ITEM_W }}
                            >
                                <div
                                    className={`transition-all duration-100 ${isSelected ? 'bg-[#A3E635]' : isMajor ? 'bg-white/40' : isMed ? 'bg-white/20' : 'bg-white/8'}`}
                                    style={{
                                        width: isSelected ? 2 : 1,
                                        height: isMajor ? 28 : isMed ? 18 : 10,
                                    }}
                                />
                                {isMajor && (
                                    <span
                                        className={`text-[8px] mt-1 font-medium ${isSelected ? 'text-[#A3E635]' : 'text-white/15'}`}
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                    >
                                        {v}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// ─── BMI Bar ──────────────────────────────────────────────────────────────────
const BMIBar = ({ height, weight }) => {
    if (!height || !weight || height < 100 || weight < 20) return null
    const bmi = weight / ((height / 100) ** 2)
    const pct = Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100))
    const info =
        bmi < 18.5 ? { label: 'Недостатня вага', color: '#22D3EE' } :
            bmi < 25 ? { label: 'Норма', color: '#A3E635' } :
                bmi < 30 ? { label: 'Надлишкова вага', color: '#FBBF24' } :
                    { label: 'Ожиріння', color: '#F87171' }

    return (
        <div className="px-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
                <span className="text-xs text-white/25 font-medium uppercase tracking-widest">ІМТ</span>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: info.color, fontFamily: 'var(--font-mono)' }}>{bmi.toFixed(1)}</span>
                    <span className="text-xs font-medium" style={{ color: info.color }}>{info.label}</span>
                </div>
            </div>
            <div className="relative h-2 rounded-full overflow-visible">
                <div className="h-full rounded-full" style={{ background: 'linear-gradient(to right, #22D3EE 0%, #A3E635 35%, #FBBF24 65%, #F87171 100%)' }} />
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 bg-[#080b10] shadow-lg transition-all duration-500"
                    style={{ left: `${pct}%`, borderColor: info.color, boxShadow: `0 0 8px ${info.color}60` }}
                />
            </div>
            <div className="flex justify-between text-[9px] text-white/15" style={{ fontFamily: 'var(--font-mono)' }}>
                <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
        </div>
    )
}

// ─── SelectCard (big tappable card) ──────────────────────────────────────────
const SelectCard = ({ icon, title, subtitle, selected, onClick, accentColor = '#A3E635' }) => (
    <button
        onClick={onClick}
        className={`w-full p-5 rounded-2xl text-left flex items-center gap-4 transition-all duration-200 active:scale-[0.98] ${selected
            ? 'border shadow-lg'
            : 'bg-white/[0.03] border border-white/[0.07] hover:border-white/15'
            }`}
        style={selected ? {
            background: `${accentColor}10`,
            borderColor: `${accentColor}50`,
            boxShadow: `0 0 20px ${accentColor}15`,
        } : {}}
    >
        <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: selected ? `${accentColor}20` : 'rgba(255,255,255,0.04)' }}
        >
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${selected ? 'text-white' : 'text-white/50'}`}>{title}</p>
            {subtitle && <p className="text-xs text-white/25 mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>
        {selected && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: accentColor }}>
                <IconCheck className="w-3.5 h-3.5 text-[#080b10]" />
            </div>
        )}
    </button>
)

// ─── Chip (multi-select) ──────────────────────────────────────────────────────
const Chip = ({ label, icon, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-150 active:scale-95 ${selected
            ? 'bg-[#22D3EE]/15 border border-[#22D3EE]/40 text-[#22D3EE]'
            : 'bg-white/[0.03] border border-white/[0.07] text-white/35 hover:text-white/60'
            }`}
    >
        <span>{icon}</span>
        {label}
    </button>
)

// ─── Equipment Tile ───────────────────────────────────────────────────────────
const EquipmentTile = ({ icon, label, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`py-4 px-2 rounded-2xl flex flex-col items-center gap-2.5 transition-all duration-150 active:scale-95 ${selected
            ? 'bg-[#A3E635]/10 border border-[#A3E635]/40'
            : 'bg-white/[0.03] border border-white/[0.06] hover:border-white/15'
            }`}
    >
        <span className={`transition-all ${selected ? 'opacity-100' : 'opacity-30'}`}>{icon}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider text-center leading-tight ${selected ? 'text-[#A3E635]' : 'text-white/25'}`}>
            {label}
        </span>
    </button>
)

// ─── GYM EQUIPMENT PRESETS ────────────────────────────────────────────────────
const GYM_PRESET = ['barbell', 'dumbbells', 'kettlebells', 'cables', 'machines', 'cardio', 'pullup_bar', 'bands']
const HOME_PRESET = []
const STREET_PRESET = ['pullup_bar', 'parallel_bars']

const EQUIPMENT_LIST = [
    { value: 'barbell', label: 'Штанга', icon: <IconGym className="w-6 h-6 text-current" /> },
    { value: 'dumbbells', label: 'Гантелі', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M6 8h4M14 8h4M6 16h4M14 16h4M10 8v8M14 8v8" /></svg> },
    { value: 'kettlebells', label: 'Гирі', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M12 4a3 3 0 100 6 3 3 0 000-6zM8 10l-2 8h12l-2-8" /></svg> },
    { value: 'bands', label: 'Резинки', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><ellipse cx="12" cy="12" rx="9" ry="4" /><path d="M3 12c0 4.97 4.03 8 9 8s9-3.03 9-8" /></svg> },
    { value: 'pullup_bar', label: 'Турнік', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M3 6h18M8 6v14M16 6v14" /></svg> },
    { value: 'parallel_bars', label: 'Бруси', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 6v12M20 6v12M4 12h16" /></svg> },
    { value: 'cables', label: 'Кросовер', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 4v16M20 4v16M4 12l8 4M20 12l-8 4" /></svg> },
    { value: 'machines', label: 'Тренаж.', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="4" y="4" width="6" height="16" rx="1" /><rect x="14" y="4" width="6" height="16" rx="1" /><path d="M10 12h4" /></svg> },
    { value: 'cardio', label: 'Кардіо', icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
]

const HEALTH_TAGS = [
    { value: 'knee', label: 'Коліно', icon: '🦵' },
    { value: 'back', label: 'Спина', icon: '🔙' },
    { value: 'shoulder', label: 'Плече', icon: '💪' },
    { value: 'wrist', label: "Зап'ясток", icon: '✋' },
    { value: 'hip', label: 'Стегно', icon: '🦴' },
    { value: 'ankle', label: 'Гомілка', icon: '🦶' },
    { value: 'neck', label: 'Шия', icon: '🔝' },
    { value: 'heart', label: 'Серце', icon: '❤️' },
    { value: 'asthma', label: 'Астма', icon: '🫁' },
    { value: 'hernia', label: 'Грижа', icon: '⚠️' },
]

// ─── Age ranges ───────────────────────────────────────────────────────────────
const AGES = Array.from({ length: 67 }, (_, i) => 14 + i) // 14–80
const HEIGHTS = Array.from({ length: 81 }, (_, i) => 140 + i) // 140–220
const WEIGHTS = Array.from({ length: 171 }, (_, i) => 30 + i) // 30–200

// ─── TOTAL STEPS ─────────────────────────────────────────────────────────────
const TOTAL_STEPS = 11 // 0..10

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [dir, setDir] = useState(1)
    const [animating, setAnimating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const [form, setForm] = useState({
        gender: null,
        age: 25,
        height_cm: 175,
        weight_kg: 75,
        goal: null,
        experience: null,
        location: null,
        equipment: [],
        days_per_week: 3,
        duration_min: null,
        health_tags: [],
        health_notes: '',
    })

    const patch = (key, val) => setForm(p => ({ ...p, [key]: val }))
    const toggleArr = (key, val) =>
        setForm(p => ({
            ...p,
            [key]: p[key].includes(val) ? p[key].filter(v => v !== val) : [...p[key], val],
        }))
    const setLocation = (loc) => {
        const preset = loc === 'gym' ? GYM_PRESET : loc === 'street' ? STREET_PRESET : HOME_PRESET
        setForm(p => ({ ...p, location: loc, equipment: preset }))
    }

    // Validation per step
    const canNext = () => {
        switch (step) {
            case 0: return true
            case 1: return !!form.gender
            case 2: return form.age >= 14
            case 3: return form.height_cm >= 140
            case 4: return form.weight_kg >= 30
            case 5: return !!form.goal
            case 6: return !!form.experience
            case 7: return !!form.location
            case 8: return true // equipment optional
            case 9: return !!form.days_per_week && !!form.duration_min
            case 10: return true // health optional
            default: return false
        }
    }

    const navigate = (delta) => {
        if (animating) return
        if (delta > 0 && !canNext()) return
        if (delta > 0 && step === TOTAL_STEPS - 1) { handleSave(); return }
        setDir(delta)
        setAnimating(true)
        setTimeout(() => { setStep(s => s + delta); setAnimating(false) }, 240)
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Сесія не знайдена')

            const { error: err } = await supabase.from('profiles').insert([{
                id: session.user.id,
                gender: form.gender,
                age: form.age,
                height_cm: form.height_cm,
                weight_kg: form.weight_kg,
                goal: form.goal,
                experience: form.experience,
                location: form.location,
                equipment: form.equipment,
                days_per_week: form.days_per_week,
                duration_min: form.duration_min,
                health_tags: form.health_tags,
                health_notes: form.health_notes || null,
            }])
            if (err) throw err
            router.push('/')
        } catch (e) {
            setError(e.message || 'Щось пішло не так.')
            setSaving(false)
        }
    }

    const slideStyle = {
        opacity: animating ? 0 : 1,
        transform: animating ? `translateX(${dir * -48}px)` : 'translateX(0)',
        transition: 'opacity 0.24s ease, transform 0.24s ease',
    }

    const steps = [
        /* ── 0: WELCOME ──────────────────────────────────────────────────────── */
        <div key="welcome" className="flex flex-col items-center text-center gap-8">
            <div className="relative">
                <div className="absolute inset-0 rounded-full blur-[80px] bg-[#A3E635]/25 scale-[2] pointer-events-none" />
                <div className="relative w-24 h-24 rounded-[28px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shadow-[0_0_50px_rgba(163,230,53,0.2)]">
                    <IconBolt className="w-11 h-11 text-[#A3E635]" />
                </div>
                <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] text-[10px] font-bold uppercase tracking-widest">
                    ✦ AI
                </div>
            </div>

            <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Привіт! 👋</h1>
                <h2 className="text-4xl font-bold text-[#A3E635] tracking-tight">Давай почнемо</h2>
                <p className="text-white/35 text-sm mt-3 leading-relaxed max-w-xs mx-auto">
                    Налаштуємо твого персонального AI-тренера. Це займе менше 2 хвилин.
                </p>
            </div>

            <div className="w-full flex flex-col gap-2.5">
                {[
                    { icon: <IconFire className="w-5 h-5 text-[#A3E635]" />, text: 'Персоналізований план тренувань' },
                    { icon: <IconBolt className="w-5 h-5 text-[#22D3EE]" />, text: 'AI підбирає ваги під твій рівень' },
                    { icon: <IconStar className="w-5 h-5 text-[#818CF8]" />, text: 'Відстеження прогресу і статистика' },
                ].map(({ icon, text }, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">{icon}</div>
                        <span className="text-sm text-white/45">{text}</span>
                    </div>
                ))}
            </div>
        </div>,

        /* ── 1: GENDER ───────────────────────────────────────────────────────── */
        <div key="gender" className="flex flex-col gap-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Ти хлопець<br />чи дівчина?</h2>
                <p className="text-white/30 text-sm mt-2">Впливає на розрахунок калорій і гормональні особливості</p>
            </div>
            <div className="flex flex-col gap-4">
                {[
                    {
                        value: 'male', icon: <IconMale className="w-10 h-10" />, title: 'Чоловік', subtitle: "Більше тестостерону = швидший ріст м'язів"
                    },
                    { value: 'female', icon: <IconFemale className="w-10 h-10" />, title: 'Жінка', subtitle: 'Окремі підходи до циклу та гормонального фону' },
                ].map(({ value, icon, title, subtitle }) => (
                    <button
                        key={value}
                        onClick={() => patch('gender', value)}
                        className={`p-6 rounded-3xl text-left flex flex-col gap-4 transition-all duration-200 active:scale-[0.98] ${form.gender === value
                            ? 'bg-[#A3E635]/10 border border-[#A3E635]/50 shadow-[0_0_30px_rgba(163,230,53,0.08)]'
                            : 'bg-white/[0.03] border border-white/[0.07] hover:border-white/15'
                            }`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${form.gender === value ? 'bg-[#A3E635]/20 text-[#A3E635]' : 'bg-white/[0.05] text-white/30'}`}>
                            {icon}
                        </div>
                        <div>
                            <p className={`text-xl font-bold ${form.gender === value ? 'text-white' : 'text-white/40'}`}>{title}</p>
                            <p className="text-xs text-white/25 mt-1">{subtitle}</p>
                        </div>
                        {form.gender === value && (
                            <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-[#A3E635] flex items-center justify-center">
                                <IconCheck className="w-4 h-4 text-[#080b10]" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>,

        /* ── 2: AGE (Wheel) ──────────────────────────────────────────────────── */
        <div key="age" className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Скільки тобі<br />років?</h2>
                <p className="text-white/30 text-sm mt-2">Від цього залежить відновлення і інтенсивність</p>
            </div>
            <div className="neural-card rounded-3xl py-6 px-4">
                <WheelPicker
                    values={AGES}
                    value={form.age}
                    onChange={v => patch('age', v)}
                    unit="р"
                />
            </div>
        </div>,

        /* ── 3: HEIGHT (Ruler) ───────────────────────────────────────────────── */
        <div key="height" className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Який у тебе<br />зріст?</h2>
                <p className="text-white/30 text-sm mt-2">Прокрути лінійку, щоб вибрати</p>
            </div>
            <div className="neural-card rounded-3xl py-8 px-4">
                <RulerPicker
                    min={140} max={220}
                    value={form.height_cm}
                    onChange={v => patch('height_cm', v)}
                    unit="см"
                />
            </div>
        </div>,

        /* ── 4: WEIGHT (Ruler + BMI) ─────────────────────────────────────────── */
        <div key="weight" className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Яка у тебе<br />вага?</h2>
                <p className="text-white/30 text-sm mt-2">Потрібно для розрахунку навантаження та ІМТ</p>
            </div>
            <div className="neural-card rounded-3xl py-8 px-4 flex flex-col gap-6">
                <RulerPicker
                    min={30} max={200}
                    value={form.weight_kg}
                    onChange={v => patch('weight_kg', v)}
                    unit="кг"
                />
                <BMIBar height={form.height_cm} weight={form.weight_kg} />
            </div>
        </div>,

        /* ── 5: GOAL ─────────────────────────────────────────────────────────── */
        <div key="goal" className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Яка твоя<br />головна ціль?</h2>
                <p className="text-white/30 text-sm mt-2">Від цього залежить вся стратегія тренувань</p>
            </div>
            <div className="flex flex-col gap-3">
                {[
                    { value: 'weight_loss', icon: <IconFire className="w-6 h-6 text-orange-400" />, title: 'Схуднути', subtitle: 'Жиросп. тренування, дефіцит калорій', color: '#FB923C' },
                    {
                        value: 'muscle_gain', icon: <IconMuscle className="w-6 h-6 text-[#A3E635]" />, title: "Набрати м'язи", subtitle: 'Силовий тренінг, гіпертрофія, прогресія', color: '#A3E635'
                    },
                    {
                        value: 'recomposition', icon: <IconBalance className="w-6 h-6 text-[#22D3EE]" />, title: 'Рекомпозиція', subtitle: "Схуднути і набрати м'язи одночасно", color: '#22D3EE'
                    },
                    { value: 'maintenance', icon: <IconStar className="w-6 h-6 text-[#818CF8]" />, title: 'Підтримка форми', subtitle: 'Зберегти результат і залишатись у тонусі', color: '#818CF8' },
                ].map(({ value, icon, title, subtitle, color }) => (
                    <SelectCard
                        key={value}
                        icon={icon}
                        title={title}
                        subtitle={subtitle}
                        selected={form.goal === value}
                        onClick={() => patch('goal', value)}
                        accentColor={color}
                    />
                ))}
            </div>
        </div>,

        /* ── 6: EXPERIENCE ───────────────────────────────────────────────────── */
        <div key="exp" className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Як довго ти<br />тренуєшся?</h2>
                <p className="text-white/30 text-sm mt-2">Будь чесним — це вплине на підбір ваг і програми</p>
            </div>
            <div className="flex flex-col gap-3">
                {[
                    {
                        value: 'beginner',
                        title: 'Тільки починаю',
                        subtitle: 'Менше 6 місяців або після довгої перерви. Базові вправи ще даються складно.',
                        badge: 'до 6 місяців',
                        color: '#22D3EE',
                        icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>,
                    },
                    {
                        value: 'intermediate',
                        title: 'Тренуюсь регулярно',
                        subtitle: 'Від 6 місяців до 2 років. Знаю техніку базових вправ, є розуміння тренінгу.',
                        badge: '6 міс – 2 роки',
                        color: '#A3E635',
                        icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
                    },
                    {
                        value: 'advanced',
                        title: 'Серйозний тренінг',
                        subtitle: 'Більше 2 років. Стежу за технікою, прогресую у вагах, розумію періодизацію.',
                        badge: 'від 2 років',
                        color: '#818CF8',
                        icon: <IconMuscle className="w-6 h-6" />,
                    },
                ].map(({ value, title, subtitle, badge, color, icon }) => (
                    <button
                        key={value}
                        onClick={() => patch('experience', value)}
                        className={`p-5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] ${form.experience === value
                            ? 'border shadow-sm'
                            : 'bg-white/[0.03] border border-white/[0.07]'
                            }`}
                        style={form.experience === value ? { background: `${color}0D`, borderColor: `${color}40` } : {}}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: form.experience === value ? `${color}20` : 'rgba(255,255,255,0.04)', color: form.experience === value ? color : 'rgba(255,255,255,0.2)' }}>
                                {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-bold text-sm ${form.experience === value ? 'text-white' : 'text-white/40'}`}>{title}</p>
                                </div>
                                <span
                                    className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg mb-2"
                                    style={{ background: `${color}15`, color: form.experience === value ? color : 'rgba(255,255,255,0.15)' }}
                                >
                                    {badge}
                                </span>
                                <p className="text-xs text-white/25 leading-relaxed">{subtitle}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>,

        /* ── 7: LOCATION ─────────────────────────────────────────────────────── */
        <div key="location" className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Де ти<br />тренуєшся?</h2>
                <p className="text-white/30 text-sm mt-2">На наступному кроці налаштуємо інвентар</p>
            </div>
            <div className="flex flex-col gap-3">
                {[
                    { value: 'gym', icon: <IconGym className="w-6 h-6" />, title: 'Спортзал', subtitle: 'Повна база обладнання — штанги, тренажери, кардіо' },
                    { value: 'home', icon: <IconHome className="w-6 h-6" />, title: 'Вдома', subtitle: 'Від порожньої кімнати до повноцінного домашнього залу' },
                    { value: 'street', icon: <IconStreet className="w-6 h-6" />, title: 'На вулиці', subtitle: 'Воркаут-майданчики, турніки, бруси, стріт-тренінг' },
                ].map(({ value, icon, title, subtitle }) => (
                    <SelectCard
                        key={value}
                        icon={icon}
                        title={title}
                        subtitle={subtitle}
                        selected={form.location === value}
                        onClick={() => setLocation(value)}
                    />
                ))}
            </div>
        </div>,

        /* ── 8: EQUIPMENT ────────────────────────────────────────────────────── */
        <div key="equipment" className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Який інвентар<br />є в наявності?</h2>
                <p className="text-white/30 text-sm mt-2">
                    {form.location === 'gym' ? 'Зал вже вибрано — відмінь зайве' : 'Вибери все що є'}
                </p>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2">
                <button
                    onClick={() => patch('equipment', EQUIPMENT_LIST.map(e => e.value))}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-[#A3E635]/20 text-[#A3E635]/60 hover:text-[#A3E635] hover:border-[#A3E635]/40 transition-all"
                >
                    Вибрати все
                </button>
                <button
                    onClick={() => patch('equipment', [])}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/[0.07] text-white/25 hover:text-white/50 transition-all"
                >
                    Очистити
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
                {EQUIPMENT_LIST.map(({ value, label, icon }) => (
                    <EquipmentTile
                        key={value}
                        icon={<span className={form.equipment.includes(value) ? 'text-[#A3E635]' : 'text-white/20'}>{icon}</span>}
                        label={label}
                        selected={form.equipment.includes(value)}
                        onClick={() => toggleArr('equipment', value)}
                    />
                ))}
            </div>

            {form.equipment.length === 0 && (
                <div className="flex items-center gap-3 bg-[#22D3EE]/5 border border-[#22D3EE]/15 rounded-2xl px-4 py-3">
                    <span className="text-[#22D3EE] text-lg">ℹ️</span>
                    <p className="text-xs text-white/30 leading-relaxed">
                        AI складе програму тільки з власною вагою — це теж ефективно!
                    </p>
                </div>
            )}
        </div>,

        /* ── 9: SCHEDULE ─────────────────────────────────────────────────────── */
        <div key="schedule" className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Розклад<br />тренувань</h2>
                <p className="text-white/30 text-sm mt-2">AI побудує план під твій ритм</p>
            </div>

            <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Тренувань на тиждень</label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                        <button
                            key={n}
                            onClick={() => patch('days_per_week', n)}
                            className={`flex-1 py-4 rounded-xl font-bold text-base transition-all duration-150 active:scale-95 ${form.days_per_week === n
                                ? 'bg-[#A3E635] text-[#080b10] shadow-[0_0_20px_rgba(163,230,53,0.3)]'
                                : 'bg-white/[0.04] border border-white/[0.07] text-white/30 hover:text-white/60'
                                }`}
                            style={{ fontFamily: 'var(--font-mono)' }}
                        >
                            {n}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between text-[9px] text-white/15 px-1">
                    <span>лайт</span><span></span><span></span><span>середнє</span><span></span><span></span><span>інтенсив</span>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Час на тренування</label>
                <div className="grid grid-cols-4 gap-2.5">
                    {[
                        { min: 30, label: '30', sub: 'хв' },
                        { min: 45, label: '45', sub: 'хв' },
                        { min: 60, label: '60', sub: 'хв' },
                        { min: 90, label: '90', sub: 'хв' },
                    ].map(({ min, label, sub }) => (
                        <button
                            key={min}
                            onClick={() => patch('duration_min', min)}
                            className={`py-4 rounded-2xl flex flex-col items-center gap-1 transition-all duration-150 active:scale-95 ${form.duration_min === min
                                ? 'bg-[#A3E635] text-[#080b10] shadow-[0_0_20px_rgba(163,230,53,0.3)]'
                                : 'bg-white/[0.04] border border-white/[0.07] text-white/30 hover:text-white/60'
                                }`}
                        >
                            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{label}</span>
                            <span className="text-[10px] font-medium opacity-70">{sub}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>,

        /* ── 10: HEALTH ──────────────────────────────────────────────────────── */
        <div key="health" className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Травми або<br />обмеження?</h2>
                <p className="text-white/30 text-sm mt-2">
                    AI врахує це при складанні плану. Якщо нічого немає — просто тисни «Далі»
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {HEALTH_TAGS.map(({ value, label, icon }) => (
                    <Chip
                        key={value}
                        icon={icon}
                        label={label}
                        selected={form.health_tags.includes(value)}
                        onClick={() => toggleArr('health_tags', value)}
                    />
                ))}
            </div>

            {form.health_tags.length > 0 && (
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-white/25 uppercase tracking-[0.2em]">Уточнення (необов'язково)</label>
                    <textarea
                        value={form.health_notes}
                        onChange={e => patch('health_notes', e.target.value)}
                        placeholder="Наприклад: права нога після операції, не можу присідати зі штангою..."
                        rows={3}
                        maxLength={300}
                        className="w-full bg-white/[0.03] border border-white/[0.07] focus:border-[#22D3EE]/30 rounded-2xl px-4 py-4 text-sm text-white/60 placeholder:text-white/15 outline-none resize-none transition-colors"
                    />
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-[#A3E635]/5 border border-[#A3E635]/15 rounded-2xl px-4 py-3 flex items-start gap-3">
                <IconBolt className="w-4 h-4 text-[#A3E635] mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/30 leading-relaxed">
                    Ці дані побачить тільки AI-тренер. Вони потрібні щоб не пропонувати вправи що тобі протипоказані.
                </p>
            </div>
        </div>,
    ]

    const isLastStep = step === TOTAL_STEPS - 1
    const isFirstStep = step === 0
    const btnReady = canNext() && !saving

    return (
        <main className="min-h-screen text-white flex flex-col relative overflow-hidden">
            {/* Ambient */}
            <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[90vw] h-[50vh] rounded-full blur-[140px] bg-[#A3E635]/5 pointer-events-none" />

            <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-5 pt-12 pb-8 gap-6">

                {/* ── Top bar ── */}
                <div className="flex items-center justify-between flex-shrink-0">
                    <button
                        onClick={() => navigate(-1)}
                        disabled={isFirstStep}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isFirstStep
                            ? 'opacity-0 pointer-events-none'
                            : 'bg-white/[0.04] border border-white/[0.07] text-white/40 hover:text-white/70 active:scale-95'
                            }`}
                    >
                        <IconChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Step dots */}
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: i === step ? 20 : 6,
                                    height: 6,
                                    background: i === step
                                        ? '#A3E635'
                                        : i < step
                                            ? 'rgba(163,230,53,0.3)'
                                            : 'rgba(255,255,255,0.08)',
                                    boxShadow: i === step ? '0 0 8px rgba(163,230,53,0.6)' : 'none',
                                }}
                            />
                        ))}
                    </div>

                    <div className="w-10 h-10" />
                </div>

                {/* ── Content ── */}
                <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={slideStyle}>
                    {steps[step]}
                </div>

                {/* ── Next button ── */}
                <button
                    onClick={() => navigate(1)}
                    disabled={!btnReady}
                    className={`flex-shrink-0 w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] ${btnReady
                        ? isLastStep
                            ? 'bg-[#A3E635] text-[#080b10] shadow-[0_0_30px_rgba(163,230,53,0.3)]'
                            : 'bg-white/[0.07] border border-white/[0.1] text-white hover:bg-white/10'
                        : 'bg-white/[0.03] border border-white/[0.04] text-white/20 cursor-not-allowed'
                        }`}
                >
                    {saving ? (
                        <>
                            <div className="w-4 h-4 border-2 border-[#080b10] border-t-transparent rounded-full animate-spin" />
                            Зберігаємо...
                        </>
                    ) : isLastStep ? (
                        'Запустити ZalAI 🚀'
                    ) : isFirstStep ? (
                        <><span>Почати</span> <IconArrowRight className="w-4 h-4" /></>
                    ) : (
                        <><span>Далі</span> <IconArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </main>
    )
}
