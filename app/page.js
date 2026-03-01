'use client'

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
const IconPlay = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
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

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState([])
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [activityDays, setActivityDays] = useState(new Set())
  const [isCreating, setIsCreating] = useState(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }
    checkUser()
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })
    return () => { authListener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const { data: templatesData } = await supabase
        .from('workouts').select('*').eq('is_template', true).eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(3)
      setTemplates(templatesData || [])

      const { data: historyData } = await supabase
        .from('workouts').select('*').eq('is_template', false).eq('status', 'completed')
        .eq('user_id', user.id).order('date', { ascending: false }).limit(3)
      setRecentWorkouts(historyData || [])

      const { data: activityData } = await supabase
        .from('workouts').select('date').eq('is_template', false).eq('status', 'completed')
        .eq('user_id', user.id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      setActivityDays(new Set(activityData?.map(w => w.date) || []))
    }
    fetchData()
  }, [user])

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

  // --- ЕКРАН ЗАВАНТАЖЕННЯ ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center">
            <IconBolt className="w-5 h-5 text-[#A3E635] animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Ініціалізація</span>
        </div>
      </div>
    )
  }

  // --- ЛЕНДІНГ (не авторизовано) ---
  if (!user) {
    return (
      <main className="min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Hero glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] bg-[#A3E635]/10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] bg-[#22D3EE]/8 pointer-events-none" />

        <div className="z-10 w-full max-w-sm flex flex-col items-center text-center gap-8">
          {/* Лого */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-[22px] neural-card flex items-center justify-center shadow-[0_0_40px_rgba(163,230,53,0.15)]">
                <IconBolt className="w-9 h-9 text-[#A3E635]" />
              </div>
              {/* AI Badge */}
              <div className="absolute -top-2 -right-2 ai-badge">
                <span className="text-[#22D3EE]">✦</span> AI
              </div>
            </div>

            <div className="mt-2">
              <h1 className="text-5xl font-bold tracking-tight text-white">
                Zal<span className="text-[#A3E635]">AI</span>
              </h1>
              <p className="text-white/30 text-xs uppercase tracking-[0.3em] font-medium mt-2">
                Розумний трекер тренувань
              </p>
            </div>
          </div>

          {/* Опис */}
          <div className="neural-card rounded-2xl p-5 w-full text-left">
            <p className="text-white/50 text-sm leading-relaxed">
              Мінімум кліків у залі. Додаток сам пам'ятає твої ваги та підходи — просто тисни <span className="text-[#A3E635] font-semibold">«Виконано»</span> і ростеш.
            </p>
          </div>

          {/* Кнопка входу */}
          <button
            onClick={handleLogin}
            className="relative w-full py-4 rounded-2xl bg-white text-[#080b10] font-bold text-sm overflow-hidden group active:scale-[0.98] transition-all shadow-[0_4px_30px_rgba(255,255,255,0.1)]"
          >
            {/* Shimmer */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#A3E635]/20 to-transparent group-hover:animate-[shimmer_1.5s_ease-in-out]" />
            <span className="relative flex items-center justify-center gap-3">
              <IconGoogle />
              Увійти через Google
            </span>
          </button>

          <p className="text-white/15 text-[10px] uppercase tracking-widest">
            ZalAI · Версія 2.0
          </p>
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

      {/* ХЕДЕР */}
      <header className="sticky top-0 z-20 px-4 pt-5 pb-4">
        <div className="mx-auto w-full max-w-md flex justify-between items-center">
          {/* Аватар + ім'я */}
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-9 h-9 rounded-full border border-white/10"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#A3E635]/10 border border-[#A3E635]/20 flex items-center justify-center text-[#A3E635] font-bold text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-medium">Привіт,</p>
              <p className="text-sm font-semibold text-white/80 leading-none mt-0.5">{firstName}</p>
            </div>
          </div>

          {/* Активність — 7 крапок */}
          <div className="flex items-center gap-1.5">
            {last7Days.map((date) => {
              const isActive = activityDays.has(date)
              return (
                <div
                  key={date}
                  className={`rounded-full transition-all ${isActive
                    ? 'w-2 h-2 bg-[#A3E635] shadow-[0_0_8px_rgba(163,230,53,0.8)]'
                    : 'w-1.5 h-1.5 bg-white/8'
                    }`}
                />
              )
            })}
          </div>
        </div>
      </header>

      <div className="px-4 flex flex-col max-w-md mx-auto w-full gap-6">

        {/* HERO — СТАРТ ТРЕНУВАННЯ */}
        <section>
          <button
            onClick={handleStartFreeWorkout}
            disabled={isCreating === 'free'}
            className="relative w-full hero-card rounded-[28px] p-7 text-left active:scale-[0.98] transition-all duration-200 group overflow-hidden"
          >
            {/* Neural паттерн */}
            <NeuralPattern />

            {/* Lime glow у кутку */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] bg-[#A3E635]/10 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col gap-3">
                {/* AI Badge */}
                <div className="ai-badge w-fit">
                  <span>✦</span> AI Режим
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight leading-none">
                    Розпочати
                  </h2>
                  <h2 className="text-2xl font-bold text-[#A3E635] tracking-tight leading-none">
                    тренування
                  </h2>
                </div>

                <p className="text-white/30 text-xs font-medium">
                  Вільна сесія · без шаблону
                </p>
              </div>

              {/* Кнопка play */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isCreating === 'free'
                ? 'bg-[#A3E635]/20 border border-[#A3E635]/30'
                : 'bg-[#A3E635] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(163,230,53,0.5)]'
                }`}>
                {isCreating === 'free' ? (
                  <div className="w-5 h-5 border-2 border-[#A3E635] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IconPlay className="w-6 h-6 text-[#080b10] ml-0.5" />
                )}
              </div>
            </div>
          </button>
        </section>

        {/* МОЇ ПРОГРАМИ */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.25em]">Мої програми</h2>
            <div className="h-px flex-1 mx-4 bg-white/[0.05]" />
            <button
              onClick={() => router.push('/programs')}
              className="text-[10px] font-semibold text-[#22D3EE]/60 hover:text-[#22D3EE] transition-colors uppercase tracking-wider"
            >
              Всі
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {templates.length === 0 ? (
              <div className="neural-card rounded-2xl p-6 text-center flex flex-col items-center gap-3 border-dashed border-white/[0.06]">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-white/25 text-xs">Програм ще немає</p>
                <button
                  onClick={() => router.push('/programs')}
                  className="px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#A3E635]/20 text-[#A3E635]/60 hover:text-[#A3E635] hover:border-[#A3E635]/40 transition-all"
                >
                  Створити програму
                </button>
              </div>
            ) : (
              templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleStartWorkout(template)}
                  disabled={isCreating === template.id}
                  className="neural-card rounded-2xl px-5 py-4 flex items-center justify-between group hover:border-[#A3E635]/20 hover:bg-white/[0.04] active:scale-[0.98] transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#A3E635]/5 border border-[#A3E635]/10 flex items-center justify-center group-hover:bg-[#A3E635]/10 group-hover:border-[#A3E635]/20 transition-all">
                      <IconBolt className="w-4 h-4 text-[#A3E635]/60 group-hover:text-[#A3E635] transition-colors" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-[#A3E635]/30 group-hover:bg-[#A3E635] transition-colors" />
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Готово до старту</span>
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
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-[11px] font-bold text-white/30 uppercase tracking-[0.25em]">Остання активність</h2>
              <div className="h-px flex-1 mx-4 bg-white/[0.05]" />
            </div>

            <div className="neural-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
              {recentWorkouts.map(workout => (
                <div key={workout.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] block mb-1">
                      {new Date(workout.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                    </span>
                    <h3 className="text-sm font-medium text-white/60">{workout.name}</h3>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A3E635]/20 shadow-[0_0_6px_rgba(163,230,53,0.3)]" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}