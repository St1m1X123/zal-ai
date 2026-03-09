'use client'

import { supabase } from '../lib/supabase'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '../context/AppContext'
import { DashboardSkeleton } from '../components/Skeleton'

// --- SVG Іконки ---
const IconBolt = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const IconGoogle = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)
const IconChevron = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
const IconChevronDown = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)
const IconGoal = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const IconLevel = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)
const IconCalendar = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)
const IconPlay = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
)
const IconSparkles = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
)
const IconFire = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.866 8.21 8.21 0 003 2.48z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
  </svg>
)
const IconSearch = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)
const IconInfo = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
const IconDumbbell = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5l11 11M3 21l3-3M18 6l3-3M2 18l3-3M19 9l3-3M9 19l-3 3M6 18l3 3M18 6l3 3M15 5l3 3M5 15l3 3" />
  </svg>
)
const IconMuscle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5c.5-1.5 2-2.5 3.5-2s2.5 2 2.5 3.5v1.5h3c1 0 2 .5 2.5 1.5s.5 2-.5 2.5l-1 .5c0 1-.5 2-1.5 2.5s-2 .5-2.5-.5l-.5-1c-.5.5-1.5 1-2.5.5S7 14 7 13l-2 .5c-1 .5-2 0-2.5-1S2 10 3 9.5L5 9c.5-1 1.5-2 1.5-2.5z" />
  </svg>
)

// --- Нейронна сітка (декоративна) ---
const NeuralPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
    viewBox="0 0 300 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="30" cy="40" r="2.5" fill="#A3E635" />
    <circle cx="120" cy="20" r="2" fill="#22D3EE" />
    <circle cx="220" cy="60" r="2.5" fill="#A3E635" />
    <circle cx="270" cy="30" r="2" fill="#22D3EE" />
    <circle cx="80" cy="100" r="2" fill="#22D3EE" />
    <circle cx="180" cy="130" r="2.5" fill="#A3E635" />
    <circle cx="250" cy="110" r="2" fill="#22D3EE" />
    <circle cx="50" cy="160" r="2" fill="#A3E635" />
    <circle cx="150" cy="180" r="2.5" fill="#22D3EE" />

    <line x1="30" y1="40" x2="120" y2="20" stroke="#A3E635" strokeWidth="0.5" />
    <line x1="120" y1="20" x2="220" y2="60" stroke="#22D3EE" strokeWidth="0.5" />
    <line x1="220" y1="60" x2="270" y2="30" stroke="#A3E635" strokeWidth="0.5" />
    <line x1="30" y1="40" x2="80" y2="100" stroke="#22D3EE" strokeWidth="0.5" />
    <line x1="80" y1="100" x2="180" y2="130" stroke="#A3E635" strokeWidth="0.5" />
    <line x1="180" y1="130" x2="250" y2="110" stroke="#22D3EE" strokeWidth="0.5" />
    <line x1="220" y1="60" x2="180" y2="130" stroke="#A3E635" strokeWidth="0.5" />
    <line x1="50" y1="160" x2="150" y2="180" stroke="#22D3EE" strokeWidth="0.5" />
    <line x1="80" y1="100" x2="50" y2="160" stroke="#A3E635" strokeWidth="0.5" />
    <line x1="150" y1="180" x2="250" y2="110" stroke="#22D3EE" strokeWidth="0.5" />
  </svg>
)

const HEALTH_LABELS = {
  hernia: 'Грижі / Протрузії',
  knees: 'Біль у колінах',
  back: 'Нижня частина спини',
  shoulders: 'Проблеми з плечима',
  heart: 'Серцево-судинні',
}

export default function Home() {
  const router = useRouter()
  const {
    user,
    profile,
    loading: globalLoading,
    popularExercises,
    templates,
    recentWorkouts,
    activityDays,
    streakWeeks,
    setProfile
  } = useApp()

  const [exerciseSearch, setExerciseSearch] = useState('')
  const [isCreating, setIsCreating] = useState(null)
  const [showProModal, setShowProModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false)
  const pickerScrollRef = useRef(null)
  const configInitialized = useRef(false)

  // AI Config State
  const [aiConfig, setAiConfig] = useState({
    goal: '',
    experience: '',
    location: '',
    equipment: [],
    health_tags: [],
    muscle_focus: [],
    selected_exercises: [],
    style: 'balanced',
    duration: 60
  })

  // Swipe State
  const [activeSlide, setActiveSlide] = useState(0)
  const scrollerRef = useRef(null)

  // AI Planner State
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiPhase, setAiPhase] = useState('')
  const [aiGoal, setAiGoal] = useState('muscle_gain')
  const [aiLevel, setAiLevel] = useState('intermediate')
  const [aiDays, setAiDays] = useState(3)

  // Scroll Lock & Nav Hide when Modal open
  useEffect(() => {
    if (showConfigModal || showProModal) {
      document.body.style.overflow = 'hidden'
      window.dispatchEvent(new CustomEvent('nav:hide'))
    } else {
      document.body.style.overflow = 'unset'
      window.dispatchEvent(new CustomEvent('nav:show'))
    }
  }, [showConfigModal, showProModal])

  // Handle AI Config Initialization and Restoration
  useEffect(() => {
    if (globalLoading || !profile || configInitialized.current) return

    configInitialized.current = true
    const savedStateStr = sessionStorage.getItem('ai_config_restore')
    const savedState = savedStateStr ? JSON.parse(savedStateStr) : null

    const profileConfig = {
      goal: profile.goal || '',
      experience: profile.experience || '',
      location: profile.location || '',
      equipment: profile.equipment || [],
      health_tags: profile.health_tags || [],
      muscle_focus: [],
      selected_exercises: [],
      style: 'balanced',
      duration: profile.duration_min || 60
    }

    setAiConfig(savedState?.aiConfig || profileConfig)

    // Restore other UI states
    if (savedState) {
      if (savedState.exerciseSearch !== undefined) setExerciseSearch(savedState.exerciseSearch)
      if (savedState.isExercisePickerOpen !== undefined) setIsExercisePickerOpen(savedState.isExercisePickerOpen)
      if (savedState.showConfigModal !== undefined) setShowConfigModal(savedState.showConfigModal)

      if (savedState.scrollTop) {
        setTimeout(() => {
          if (pickerScrollRef.current) {
            pickerScrollRef.current.scrollTop = savedState.scrollTop
          }
        }, 200)
      }
      sessionStorage.removeItem('ai_config_restore')
    }

    if (savedState?.scrollPos) {
      setTimeout(() => window.scrollTo(0, savedState.scrollPos), 150)
    }
  }, [globalLoading, profile])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const handleStartFreeWorkout = async () => {
    setIsCreating('free')
    try {
      const { data: workoutData, error } = await supabase
        .from('workouts')
        .insert([{ name: 'Вільне тренування', is_template: false, user_id: user.id, status: 'in_progress', date: new Date().toISOString().split('T')[0] }])
        .select().single()
      if (error) throw error
      router.push(`/workout/${workoutData.id}`)
    } catch {
      alert('Помилка при створенні тренування.')
      setIsCreating(null)
    }
  }

  const handleStartWorkoutTemplate = async (template) => {
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

  const handleGenerateProgramAPI = async () => {
    setIsGenerating(true)
    const phases = [
      'Аналізую твій профіль...',
      'Підбираю оптимальні вправи...',
      'Балансую м\'язові групи...',
      'Враховую обмеження та травми...',
      'Складаю тижневий розклад...',
    ]
    let pi = 0
    setAiPhase(phases[0])
    const iv = setInterval(() => { pi = (pi + 1) % phases.length; setAiPhase(phases[pi]) }, 1800)

    try {
      const res = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: aiConfig })
      })
      const data = await res.json()
      clearInterval(iv)

      if (!res.ok) throw new Error(data.error || 'Помилка AI')

      // Navigate to programs page to see the created plan
      router.push('/programs')

    } catch (e) {
      clearInterval(iv)
      alert(e.message)
      setIsGenerating(false)
      setAiPhase('')
    }
  }

  const handleScroll = (e) => {
    const el = e.target
    const slideIndex = Math.round(el.scrollLeft / el.clientWidth)
    if (slideIndex !== activeSlide) setActiveSlide(slideIndex)
  }

  // --- ЕКРАН ЗАВАНТАЖЕННЯ (Тільки при першому вході) ---
  if (globalLoading && !user) {
    return <DashboardSkeleton />
  }

  // --- ЛЕНДІНГ (не авторизовано) ---
  if (!user) {
    return (
      <main className="min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] bg-[#A3E635]/10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] bg-[#22D3EE]/8 pointer-events-none" />

        <div className="z-10 w-full max-w-sm flex flex-col items-center text-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-[22px] neural-card flex items-center justify-center shadow-[0_0_40px_rgba(163,230,53,0.15)]">
                <IconBolt className="w-9 h-9 text-[#A3E635]" />
              </div>
              <div className="absolute -top-2 -right-2 ai-badge"><span className="text-[#22D3EE]">✦</span> AI</div>
            </div>
            <div className="mt-2">
              <h1 className="text-5xl font-bold tracking-tight text-white">
                Zal<span className="text-[#A3E635]">AI</span>
              </h1>
              <p className="text-white/30 text-xs tracking-wider font-medium mt-2">
                Розумний трекер тренувань
              </p>
            </div>
          </div>

          <div className="neural-card rounded-2xl p-5 w-full text-left">
            <p className="text-white/50 text-sm leading-relaxed">
              Мінімум кліків у залі. Додаток сам запам'ятає прогрес, а AI складе крутий план.
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="relative w-full py-4 rounded-2xl bg-white text-[#080b10] font-bold text-sm overflow-hidden group active:scale-[0.98] transition-all shadow-[0_4px_30px_rgba(255,255,255,0.1)]"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#A3E635]/20 to-transparent group-hover:animate-[shimmer_1.5s_ease-in-out]" />
            <span className="relative flex items-center justify-center gap-3">
              <IconGoogle /> Увійти через Google
            </span>
          </button>
        </div>
      </main>
    )
  }

  // --- ДАШБОРД (авторизовано) ---
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Атлет'

  return (
    <main className="min-h-screen text-white relative overflow-x-hidden pb-32">
      {/* AI Генерація — Повноекранний оверлей */}
      {isGenerating && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center" style={{ background: 'rgba(8,11,16,0.97)', backdropFilter: 'blur(20px)' }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute w-1.5 h-1.5 rounded-full animate-ping"
                style={{
                  background: i % 2 === 0 ? '#22D3EE' : '#A3E635', opacity: 0.4,
                  left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.4}s`, animationDuration: '2s'
                }} />
            ))}
          </div>
          <div className="relative flex flex-col items-center gap-8 px-8 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)' }}>
                <div className="w-10 h-10 border-2 border-t-[#22D3EE] border-[#22D3EE]/10 rounded-full animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 ai-badge text-[9px]" style={{ background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.3)', color: '#22D3EE' }}>❖ AI</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Збираю програму</h2>
              <p className="text-sm font-medium" style={{ color: '#22D3EE' }}>{aiPhase}</p>
            </div>
          </div>
        </div>
      )}

      {/* ХЕДЕР */}
      <header className="sticky top-0 z-20 px-4 pt-5 pb-2">
        <div className="mx-auto w-full max-w-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full border border-white/10" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center text-[#A3E635] font-bold text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[10px] text-white/25 tracking-widest font-medium">Привіт,</p>
              <p className="text-sm font-semibold text-white/80 leading-none mt-0.5">{firstName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {streakWeeks > 0 && (
              <div className="flex items-center gap-1 bg-[#ff4500]/10 px-2 py-1 rounded-full border border-[#ff4500]/20 mr-1 animate-in zoom-in duration-300">
                <span className="text-[10px]">&nbsp;🔥&nbsp;</span>
                <span className="text-[10px] font-bold text-[#ff4500] tracking-wider">{streakWeeks} тиж</span>
              </div>
            )}
            {last7Days.map((date) => {
              const isActive = activityDays.has(date)
              return (
                <div key={date} className={`rounded-full transition-all ${isActive ? 'w-2 h-2 bg-[#A3E635] shadow-[0_0_8px_rgba(163,230,53,0.8)]' : 'w-1.5 h-1.5 bg-white/8'}`} />
              )
            })}
          </div>
        </div>
      </header>

      {/* SWIPER PAGER DOTS */}
      <div className="flex gap-2 justify-center mt-3 mb-2 max-w-md mx-auto w-full">
        <button onClick={() => { setActiveSlide(0); scrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' }) }}
          className={`h-1 rounded-full transition-all ${activeSlide === 0 ? 'w-10 bg-[#22D3EE]' : 'w-3 bg-white/10'}`} />
        <button onClick={() => { setActiveSlide(1); scrollerRef.current?.scrollTo({ left: window.innerWidth, behavior: 'smooth' }) }}
          className={`h-1 rounded-full transition-all ${activeSlide === 1 ? 'w-10 bg-[#A3E635]' : 'w-3 bg-white/10'}`} />
      </div>

      {/* СВАЙП КОНТЕЙНЕР (Головні картки) */}
      <section className="relative w-full max-w-md mx-auto overflow-hidden">
        <div
          ref={scrollerRef}
          className="flex w-full overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {styleHideScrollbar}

          {/* СЛАЙД 1: AI ПЛАНУВАЛЬНИК */}
          <div className="w-full shrink-0 snap-center px-4">
            <div className="relative w-full h-[330px] flex flex-col justify-between rounded-[28px] p-5 text-left border border-[#22D3EE]/20 bg-gradient-to-br from-[#22D3EE]/[0.05] to-[#121820] overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] bg-[#22D3EE]/15 pointer-events-none" />
              <NeuralPattern />

              <div className="relative z-10 flex flex-col gap-5">
                {/* Title */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="ai-badge w-fit mb-2 border-white/10" style={{ background: 'rgba(34,211,238,0.1)', color: '#22D3EE' }}>
                      ❖ AI Планувальник
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight leading-none leading-snug">
                      Створити програму<br />
                      <span style={{ color: '#22D3EE' }}>на тиждень</span>
                    </h2>
                  </div>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
                    <IconSparkles className="w-5 h-5 text-[#22D3EE]" />
                  </div>
                </div>

                {/* Subtitle/Description instead of inputs */}
                <div className="flex flex-col gap-1.5 mb-2">
                  <p className="text-white/60 text-sm font-medium">Персоналізований Neural Coach</p>
                  <p className="text-white/30 text-[11px] leading-relaxed">
                    AI створить повноцінний тренувальний план на тиждень, враховуючи твої цілі, травми та доступне обладнання.
                  </p>
                </div>

                {/* Generate Button */}
                {!profile?.is_pro ? (
                  <button
                    onClick={() => setShowProModal(true)}
                    className="w-full py-3.5 rounded-xl bg-[#22D3EE] text-[#080b10] font-bold text-sm shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-[0.98] transition-all relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Активувати Neural Pro
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="w-full py-3.5 rounded-xl bg-[#22D3EE] text-[#080b10] font-bold text-sm hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-[0.98] transition-all"
                  >
                    Налаштувати та згенерувати
                  </button>
                )}
              </div>

              {/* Ultra-Premium Locked Overlay (V2) */}
              {!profile?.is_pro && (
                <div className="absolute inset-0 z-20 bg-[#080b11]/80 backdrop-blur-[12px] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                  {/* 1. Deep Neural Background */}
                  <div className="absolute inset-0 opacity-40 pointer-events-none">
                    {/* Pulsing Core */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-[#22D3EE]/20 to-[#0EA5E9]/20 rounded-full blur-[100px] animate-pulse" />

                    {/* Moving Grid Paths */}
                    <svg className="absolute inset-0 w-full h-full text-[#22D3EE]/5" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="transparent" />
                          <stop offset="50%" stopColor="currentColor" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                      <path d="M0,20 Q50,15 100,20" fill="none" stroke="url(#lineGrad)" strokeWidth="0.05" />
                      <path d="M0,80 Q50,85 100,80" fill="none" stroke="url(#lineGrad)" strokeWidth="0.05" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.03" strokeDasharray="1 2" className="animate-[spin_20s_linear_infinite]" />
                    </svg>
                  </div>

                  {/* 2. Content Container */}
                  <div className="relative z-10 flex flex-col items-center">
                    {/* Premium Ring & Lock */}
                    <div className="relative mb-8 group">
                      {/* Animated Rings */}
                      <div className="absolute inset-[-10px] rounded-full border border-[#22D3EE]/10 animate-[ping_3s_ease-in-out_infinite]" />
                      <div className="absolute inset-[-4px] rounded-full border border-[#22D3EE]/30" />

                      <div className="w-20 h-20 rounded-full bg-[#080b11] border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.15)] relative">
                        <svg className="w-8 h-8 text-[#22D3EE] drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17V15M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11M5 11H19C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11Z"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>

                    {/* Branding */}
                    <div className="space-y-2 mb-6">
                      <h4 className="text-xl font-black text-white tracking-[0.3em] uppercase flex items-center gap-2">
                        Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] to-[#0EA5E9]">Engine</span>
                      </h4>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.4em]">Інтелект заблоковано</p>
                    </div>

                    {/* Elegant Pro Notice */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <p className="text-[9px] font-black text-[#22D3EE]/60 uppercase tracking-[0.2em]">
                        Доступно за підпискою Pro
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* СЛАЙД 2: ВІЛЬНЕ ТРЕНУВАННЯ */}
          <div className="w-full shrink-0 snap-center px-4">
            <button
              onClick={handleStartFreeWorkout}
              disabled={isCreating === 'free'}
              className="relative w-full h-[330px] flex flex-col justify-between bg-[#121820] border border-white/[0.05] rounded-[28px] p-6 text-left active:scale-[0.98] transition-all duration-200 group overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] bg-[#A3E635]/10 pointer-events-none" />
              {/* Фонова декорація щоб картка не здавалась пустою */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full border-[10px] border-[#A3E635]/5 opacity-50 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
              <NeuralPattern />

              <div className="relative z-10 flex flex-col gap-3">
                <div className="ai-badge w-fit bg-white/[0.03] text-white/50 border-white/10">
                  Вільний режим
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                    Своє<br />
                    <span className="text-[#A3E635]">тренування</span>
                  </h2>
                </div>
                <p className="text-white/40 text-sm mt-1 max-w-[80%]">
                  Порожній шаблон для самостійного залу. Додавай вправи на льоту та фіксуй підходи.
                </p>
              </div>

              <div className="relative z-10 flex w-full justify-end mt-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isCreating === 'free'
                  ? 'bg-[#A3E635]/20 border border-[#A3E635]/30'
                  : 'bg-[#A3E635]/10 border border-[#A3E635]/20'
                  } group-hover:bg-[#A3E635] group-hover:scale-105 transition-all duration-300`}>
                  {isCreating === 'free' ? (
                    <div className="w-6 h-6 border-2 border-[#A3E635]/20 border-t-[#A3E635] rounded-full animate-spin" />
                  ) : (
                    <IconFire className="w-7 h-7 text-[#A3E635] group-hover:text-[#080b10]" />
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* МОЇ ПРОГРАМИ */}
      <section className="px-4 max-w-md mx-auto w-full mt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-white/40">Мої програми</h2>
          <div className="h-px flex-1 mx-4 bg-white/[0.05]" />
          <button
            onClick={() => router.push('/programs')}
            className="text-[11px] font-bold text-[#A3E635]/70 hover:text-[#A3E635] transition-colors"
          >
            Всі програми
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {templates.length === 0 ? (
            <div className="neural-card bg-transparent rounded-2xl p-6 text-center flex flex-col items-center gap-3 border-dashed border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-white/25 text-xs">Програм ще додано</p>
            </div>
          ) : (
            templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleStartWorkoutTemplate(template)}
                disabled={isCreating === template.id}
                className="neural-card rounded-2xl px-5 py-4 flex items-center justify-between group hover:border-[#A3E635]/20 hover:bg-white/[0.04] active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#A3E635]/5 border border-[#A3E635]/10 flex items-center justify-center group-hover:bg-[#A3E635]/10 group-hover:border-[#A3E635]/20 transition-all">
                    <IconPlay className="w-3.5 h-3.5 text-[#A3E635]/60 group-hover:text-[#A3E635] transition-colors" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold text-white/40">Програма</span>
                    </div>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isCreating === template.id
                  ? 'border-[#A3E635]/30 text-[#A3E635]/50'
                  : 'border-white/[0.06] text-white/15 group-hover:border-[#A3E635]/30 group-hover:text-[#A3E635]'
                  }`}>
                  {isCreating === template.id ? (
                    <div className="w-3.5 h-3.5 border border-[#A3E635]/50 border-t-[#A3E635] rounded-full animate-spin" />
                  ) : (
                    <IconChevron className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* ОСТАННЯ АКТИВНІСТЬ */}
      {recentWorkouts.length > 0 && (
        <section className="px-4 max-w-md mx-auto w-full mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold text-white/40">Остання активність</h2>
            <div className="h-px flex-1 mx-4 bg-white/[0.05]" />
          </div>

          <div className="neural-card rounded-2xl overflow-hidden divide-y divide-white/[0.04] bg-[#080b10] border border-white/5">
            {recentWorkouts.map(workout => (
              <div key={workout.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div>
                  <span className="text-[10px] font-bold text-white/30 block mb-1">
                    {new Date(workout.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                  </span>
                  <h3 className="text-sm font-medium text-white/60">{workout.name}</h3>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRO MODAL (Bento style) */}
      {showProModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowProModal(false)} />
          <div className="relative w-full max-w-sm neural-card rounded-[2rem] overflow-hidden p-8 animate-in zoom-in duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] bg-[#22D3EE]/20 pointer-events-none" />

            <button onClick={() => setShowProModal(false)} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                ✦
              </div>

              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Neural Pro</h3>
                <p className="text-xs text-white/40 mt-2">Розблокуй повну потужність AI-тренера</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 w-full text-left">
                {[
                  { icon: '🧠', title: 'AI-плани на тиждень', sub: 'Спліт-системи під твої цілі' },
                  { icon: '⚡', title: 'Генерація тренувань', sub: 'Ще більше розумних підказок' },
                  { icon: '📊', title: 'Глибока аналітика', sub: 'Детальні графіки прогресу' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex gap-4">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-white/70">{item.title}</p>
                      <p className="text-[10px] text-white/30">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowProModal(false)
                  router.push('/profile')
                }}
                className="w-full py-4 rounded-2xl bg-[#22D3EE] text-[#080b10] font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-[0.98] transition-all"
              >
                Отримати доступ
              </button>

              <p className="text-[10px] text-white/20 font-medium">Бета-тест: активуй в профілі безкоштовно</p>
            </div>
          </div>
        </div>
      )}
      {/* AI CONFIG MODAL (Neural Coach V2) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfigModal(false)} />
          <div className="relative w-full max-w-lg bg-[#080b11] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden max-h-[90vh] flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                {isExercisePickerOpen ? (
                  <button
                    onClick={() => setIsExercisePickerOpen(false)}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center">
                    <IconSparkles className="w-5 h-5 text-[#22D3EE]" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isExercisePickerOpen ? 'Вибір вправ' : 'Neural Configurator'}
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    {isExercisePickerOpen ? `База з ${popularExercises.length}+ вправ` : 'Налаштування генерації'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  setTimeout(() => setIsExercisePickerOpen(false), 300)
                }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-8 [scrollbar-width:thin] scrollbar-color-[#22D3EE]/20">

              {!isExercisePickerOpen ? (
                <>
                  {/* Muscle Focus */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <IconMuscle className="w-4 h-4 text-[#22D3EE]" />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Фокус на м'язах</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Груди', 'Спина', 'Ноги', 'Плечі', 'Руки', 'Прес'].map(m => (
                        <button
                          key={m}
                          onClick={() => {
                            setAiConfig(p => {
                              const current = p.muscle_focus || []
                              return {
                                ...p,
                                muscle_focus: current.includes(m) ? current.filter(x => x !== m) : [...current, m]
                              }
                            })
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${aiConfig.muscle_focus.includes(m)
                            ? 'bg-[#22D3EE]/20 border-[#22D3EE]/50 text-[#22D3EE]'
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                            }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Training Style */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <IconFire className="w-4 h-4 text-[#22D3EE]" />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Стиль тренувань</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'balanced', label: 'Баланс', sub: 'Класика' },
                        { id: 'strength', label: 'Сила', sub: 'Важкі ваги' },
                        { id: 'pumping', label: 'Пампінг', sub: 'Гіпертрофія' }
                      ].map(s => (
                        <button
                          key={s.id}
                          onClick={() => setAiConfig(p => ({ ...p, style: s.id }))}
                          className={`p-3 rounded-2xl text-left border flex flex-col gap-1 transition-all ${aiConfig.style === s.id
                            ? 'bg-[#22D3EE]/10 border-[#22D3EE]/40'
                            : 'bg-white/5 border-white/5'
                            }`}
                        >
                          <span className={`text-[11px] font-bold ${aiConfig.style === s.id ? 'text-[#22D3EE]' : 'text-white/60'}`}>{s.label}</span>
                          <span className="text-[9px] text-white/20">{s.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Compact Exercise Selection Button */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <IconBolt className="w-4 h-4 text-[#22D3EE]" />
                        <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Обов'язкові вправи</span>
                      </div>
                      <span className="text-[10px] text-white/20 font-bold uppercase">{(aiConfig.selected_exercises?.length || 0)} вибрано</span>
                    </div>

                    <button
                      onClick={() => setIsExercisePickerOpen(true)}
                      className="w-full p-5 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/20 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <IconSearch className="w-5 h-5 text-[#22D3EE]" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white/80">Пошук вправ</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-tighter">Натисни щоб додати конкретні вправи</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </button>

                    {aiConfig.selected_exercises?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {aiConfig.selected_exercises.slice(0, 5).map(name => (
                          <span key={name} className="px-2.5 py-1 rounded-lg bg-[#22D3EE]/5 border border-[#22D3EE]/10 text-[9px] font-bold text-[#22D3EE]/60">
                            {name}
                          </span>
                        ))}
                        {aiConfig.selected_exercises.length > 5 && (
                          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[9px] font-bold text-white/20">
                            +{aiConfig.selected_exercises.length - 5} ще
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Equipment & Location (Quick Info) */}
                  <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                        {aiConfig.location === 'gym' ? <IconGym className="w-6 h-6 text-[#22D3EE]" /> : <IconHome className="w-6 h-6 text-[#A3E635]" />}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest leading-none">Локація / База</p>
                        <p className="text-xs text-white/40 mt-1.5 line-clamp-1">
                          {aiConfig.location === 'gym' ? 'Тренажерний зал' : 'Дім / Street'} • {aiConfig.equipment.length} одиниць
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/profile')}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] font-bold text-white/30 uppercase hover:bg-white/10"
                    >
                      Змінити
                    </button>
                  </div>

                  {/* Injuries (Pre-filled) */}
                  {aiConfig.health_tags?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold text-red-400/60 uppercase tracking-wider">Обмеження (з профілю)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {aiConfig.health_tags.map(t => (
                          <span key={t} className="px-3 py-1 rounded-full bg-red-400/5 border border-red-400/10 text-[10px] text-red-400/60 font-medium">
                            {HEALTH_LABELS[t] || t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Selected Exercise Chips (In Picker) - Scrollable Area */}
                  {aiConfig.selected_exercises?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6 max-h-[120px] overflow-y-auto pr-2 [scrollbar-width:thin] scrollbar-color-[#22D3EE]/20 custom-scrollbar">
                      {aiConfig.selected_exercises.map(name => (
                        <button
                          key={name}
                          onClick={() => setAiConfig(p => ({ ...p, selected_exercises: p.selected_exercises.filter(x => x !== name) }))}
                          className="px-3 py-1.5 rounded-full bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE] text-[10px] font-bold flex items-center gap-2 hover:bg-[#22D3EE]/30 transition-all shadow-lg shadow-cyan-900/10"
                        >
                          {name}
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Search Bar & Limit Info */}
                  <div className="relative mb-2">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <IconSearch className="w-4 h-4 text-white/20" />
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      placeholder="Пошук з 800+ вправ..."
                      className="w-full bg-white/[0.05] border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/10 focus:border-[#22D3EE]/50 outline-none transition-all shadow-xl"
                    />
                  </div>
                  <div className="flex items-center justify-between px-1 mb-4">
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider">Максимум: 15 вправ</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${aiConfig.selected_exercises?.length >= 15 ? 'text-orange-400 animate-pulse' : 'text-white/40'}`}>
                      {aiConfig.selected_exercises?.length || 0} / 15
                    </p>
                  </div>

                  {/* Search Results (In Picker) */}
                  <div
                    ref={pickerScrollRef}
                    className="space-y-2 max-h-[450px] overflow-y-auto pr-2 [scrollbar-width:thin] scrollbar-color-[#22D3EE]/10 pb-10"
                  >
                    {popularExercises
                      .filter(ex =>
                        !exerciseSearch ||
                        ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                        ex.muscle.toLowerCase().includes(exerciseSearch.toLowerCase())
                      )
                      .slice(0, 30)
                      .map(ex => {
                        const isSelected = aiConfig.selected_exercises?.includes(ex.name)
                        return (
                          <div
                            key={ex.id}
                            onClick={() => {
                              setAiConfig(p => {
                                const current = p.selected_exercises || []
                                const isSelected = current.includes(ex.name)
                                if (!isSelected && current.length >= 15) return p
                                return {
                                  ...p,
                                  selected_exercises: isSelected
                                    ? current.filter(x => x !== ex.name)
                                    : [...current, ex.name]
                                }
                              })
                            }}
                            className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group relative overflow-hidden cursor-pointer ${isSelected
                              ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30'
                              : 'bg-white/[0.02] border-white/[0.05] hover:border-white/20'
                              }`}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-[12px] font-bold mb-0.5 ${isSelected ? 'text-[#22D3EE]' : 'text-white/80'}`}>{ex.name}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    sessionStorage.setItem('ai_config_restore', JSON.stringify({
                                      aiConfig,
                                      exerciseSearch,
                                      isExercisePickerOpen: true,
                                      showConfigModal: true,
                                      scrollTop: pickerScrollRef.current?.scrollTop || 0
                                    }))
                                    router.push(`/exercises/${ex.id}`)
                                  }}
                                  className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-white/20 hover:text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-all z-10"
                                >
                                  <IconInfo className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[9px] text-white/20 uppercase font-black tracking-wider">{ex.muscle}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-[#22D3EE] border-[#22D3EE]' : 'border-white/10 group-hover:border-white/30'
                              }`}>
                              {isSelected ? (
                                <svg className="w-3.5 h-3.5 text-[#080b11]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                              )}
                            </div>
                          </div>
                        )
                      })}

                    {exerciseSearch && popularExercises.filter(ex =>
                      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                      ex.muscle.toLowerCase().includes(exerciseSearch.toLowerCase())
                    ).length === 0 && (
                        <div className="py-12 text-center">
                          <p className="text-xs text-white/20">Вправу не знайдено...</p>
                        </div>
                      )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 pb-20 sm:pb-6 border-t border-white/5">
              {isExercisePickerOpen ? (
                <button
                  onClick={() => setIsExercisePickerOpen(false)}
                  className="w-full py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                  Готово
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowConfigModal(false)
                      handleGenerateProgramAPI()
                    }}
                    disabled={isGenerating}
                    className="w-full py-4 rounded-2xl bg-[#22D3EE] text-[#080b10] font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(34,211,238,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-[#080b10] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><span>Згенерувати Neural Plan</span> <IconSparkles className="w-4 h-4" /></>
                    )}
                  </button>
                  <p className="text-center text-[9px] text-white/20 mt-4 uppercase tracking-tighter">Всі параметри буде передано в Neural Engine</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

const styleHideScrollbar = (
  <style dangerouslySetInnerHTML={{
    __html: `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `}} />
)