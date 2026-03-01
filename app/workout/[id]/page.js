'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ExerciseSelector from '../../../components/ExerciseSelector'

const IconCheck = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

// REST TIMES для вибору
const REST_OPTIONS = [
  { label: '1 хв', value: 60 },
  { label: '1:30', value: 90 },
  { label: '2 хв', value: 120 },
  { label: '3 хв', value: 180 },
]

export default function WorkoutPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params?.id

  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [sets, setSets] = useState({})
  const [loading, setLoading] = useState(true)

  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restDuration, setRestDuration] = useState(90)
  const [showRestPicker, setShowRestPicker] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)

  // Екран завершення
  const [showFinishScreen, setShowFinishScreen] = useState(false)
  const [finishStats, setFinishStats] = useState(null)

  const timerInterval = useRef(null)
  const sessionInterval = useRef(null)
  const saveTimeouts = useRef({})

  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [isSavingNewExercise, setIsSavingNewExercise] = useState(false)
  // ExerciseSelector внутрішній стан для workout
  const [selectorSearch, setSelectorSearch] = useState('')
  const [selectorCategory, setSelectorCategory] = useState('Усі')
  const [dbExercises, setDbExercises] = useState([])
  const [isLoadingDb, setIsLoadingDb] = useState(false)

  const CATEGORIES = ['Усі', 'Груди', 'Спина', 'Ноги', 'Плечі', 'Руки', 'Прес', 'Кардіо', 'Інше']

  // Завантаження вправ для селектора
  const loadDbExercises = async () => {
    if (dbExercises.length > 0) return
    setIsLoadingDb(true)
    const { data } = await supabase.from('exercises').select('*').order('name', { ascending: true })
    setDbExercises(data || [])
    setIsLoadingDb(false)
  }

  const filteredForSelector = dbExercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(selectorSearch.toLowerCase())
    const matchCat = selectorCategory === 'Усі' ? true : ex.muscle === selectorCategory
    return matchSearch && matchCat
  })

  // Таймер сесії
  useEffect(() => {
    sessionInterval.current = setInterval(() => setSessionTime(prev => prev + 1), 1000)
    return () => clearInterval(sessionInterval.current)
  }, [])

  // Таймер відпочинку
  useEffect(() => {
    if (restTimer > 0) {
      timerInterval.current = setInterval(() => setRestTimer(prev => prev - 1), 1000)
    } else {
      setIsResting(false)
      clearInterval(timerInterval.current)
    }
    return () => clearInterval(timerInterval.current)
  }, [restTimer])

  const startRest = () => { setRestTimer(restDuration); setIsResting(true) }
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  // Завантаження даних
  useEffect(() => {
    if (!workoutId) return
    const fetchWorkoutData = async () => {
      const { data: wData } = await supabase.from('workouts').select('*').eq('id', workoutId).single()
      setWorkout(wData)
      const { data: weData } = await supabase.from('workout_exercises').select('*, exercises(name, type)').eq('workout_id', workoutId).order('order', { ascending: true })
      setExercises(weData || [])
      if (weData && weData.length > 0) {
        const { data: sData } = await supabase.from('sets').select('*').in('workout_exercise_id', weData.map(e => e.id)).order('order', { ascending: true })
        const setsObj = {}
        sData?.forEach(s => { setsObj[s.id] = s })
        setSets(setsObj)
      }
      setLoading(false)
    }
    fetchWorkoutData()
  }, [workoutId])

  const groupedBlocks = useCallback(() => {
    const blocks = []
    let currentSuperset = null
    let currentGroup = []
    exercises.forEach(ex => {
      if (ex.superset_id) {
        if (currentSuperset === ex.superset_id) { currentGroup.push(ex) }
        else { if (currentGroup.length > 0) blocks.push(currentGroup); currentSuperset = ex.superset_id; currentGroup = [ex] }
      } else {
        if (currentGroup.length > 0) { blocks.push(currentGroup); currentGroup = []; currentSuperset = null }
        blocks.push([ex])
      }
    })
    if (currentGroup.length > 0) blocks.push(currentGroup)
    return blocks
  }, [exercises])

  const handleSetChange = (setId, field, value) => {
    const typed = value === '' ? '' : Number(value)
    setSets(prev => ({ ...prev, [setId]: { ...prev[setId], [field]: typed } }))
    if (saveTimeouts.current[setId]) clearTimeout(saveTimeouts.current[setId])
    saveTimeouts.current[setId] = setTimeout(async () => {
      try { await supabase.from('sets').update({ [field]: typed }).eq('id', setId) }
      catch (e) { console.error('Помилка збереження:', e) }
      delete saveTimeouts.current[setId]
    }, 700)
  }

  const handleCompleteBlock = async (blockSets) => {
    const newStatus = !blockSets.every(s => s.is_completed)
    const setIds = blockSets.map(s => s.id)
    const updatedSets = { ...sets }
    setIds.forEach(id => { if (updatedSets[id]) updatedSets[id].is_completed = newStatus })
    setSets(updatedSets)
    await supabase.from('sets').update({ is_completed: newStatus }).in('id', setIds)
    if (newStatus) startRest()
  }

  const handleToggleSet = (setId) => {
    const newStatus = !sets[setId].is_completed
    setSets(prev => ({ ...prev, [setId]: { ...prev[setId], is_completed: newStatus } }))
    supabase.from('sets').update({ is_completed: newStatus }).eq('id', setId)
    if (newStatus) startRest()
  }

  // Додати підхід під час тренування
  const handleAddSet = async (workoutExerciseId) => {
    const exSets = Object.values(sets).filter(s => s.workout_exercise_id === workoutExerciseId)
    const maxOrder = exSets.length > 0 ? Math.max(...exSets.map(s => s.order)) : 0
    const { data: newSet } = await supabase.from('sets')
      .insert({ workout_exercise_id: workoutExerciseId, order: maxOrder + 1, weight: 0, reps: 0, time_seconds: 0, is_completed: false })
      .select().single()
    if (newSet) setSets(prev => ({ ...prev, [newSet.id]: newSet }))
  }

  const handleAddNewExercise = async (selectedEx) => {
    setIsSavingNewExercise(true)
    const currentOrder = exercises.length > 0 ? Math.max(...exercises.map(e => e.order)) + 1 : 0
    const { data: newWe } = await supabase.from('workout_exercises')
      .insert({ workout_id: workoutId, exercise_id: selectedEx.id, order: currentOrder })
      .select('*, exercises(*)').single()
    if (newWe) {
      setExercises(prev => [...prev, newWe])
      const { data: newSet } = await supabase.from('sets')
        .insert({ workout_exercise_id: newWe.id, order: 1, weight: 0, reps: 0, time_seconds: 0, is_completed: false })
        .select().single()
      if (newSet) setSets(prev => ({ ...prev, [newSet.id]: newSet }))
    }
    setIsSavingNewExercise(false)
    setIsAddingExercise(false)
    setSelectorSearch('')
    setSelectorCategory('Усі')
  }

  const handleFinishWorkout = async () => {
    clearInterval(sessionInterval.current)
    const allSets = Object.values(sets)
    const completed = allSets.filter(s => s.is_completed)
    setFinishStats({
      name: workout?.name || 'Тренування',
      time: sessionTime,
      totalSets: allSets.length,
      completedSets: completed.length,
      exercises: exercises.length,
    })
    await supabase.from('workouts').update({ status: 'completed' }).eq('id', workoutId)
    setShowFinishScreen(true)
  }

  // ============= ЕКРАН ЗАВЕРШЕННЯ =============
  if (showFinishScreen && finishStats) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[100px] bg-[#A3E635]/15 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[60px] bg-[#22D3EE]/8 pointer-events-none" />

        <div className="z-10 w-full max-w-sm flex flex-col items-center text-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Іконка успіху */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl neural-card flex items-center justify-center shadow-[0_0_50px_rgba(163,230,53,0.2)]">
              <svg className="w-12 h-12 text-[#A3E635]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 ai-badge">✦ AI</div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#A3E635] uppercase tracking-[0.3em] mb-2">Тренування завершено</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">{finishStats.name}</h1>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { value: formatTime(finishStats.time), label: 'Час' },
              { value: finishStats.completedSets, label: 'Підходів' },
              { value: finishStats.exercises, label: 'Вправ' },
            ].map(({ value, label }) => (
              <div key={label} className="neural-card rounded-2xl py-4 flex flex-col items-center gap-1">
                <span className="text-2xl font-mono font-bold text-white">{value}</span>
                <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>

          {/* AI аналіз-заглушка */}
          <div className="neural-card rounded-2xl p-4 w-full text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="ai-badge">✦ AI Аналіз</div>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">
              Відмінна сесія! ZalAI запам'ятав всі ваги та підходи. Наступного разу AI підкаже оптимальне навантаження.
            </p>
          </div>

          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-2xl bg-[#A3E635] text-[#080b10] font-bold uppercase tracking-[0.15em] text-sm hover:bg-[#b8f053] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(163,230,53,0.3)]"
          >
            На головну
          </button>
        </div>
      </main>
    )
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
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Завантаження сесії</span>
        </div>
      </div>
    )
  }

  const totalSets = Object.values(sets).length
  const completedSets = Object.values(sets).filter(s => s.is_completed).length
  const progress = totalSets > 0 ? (completedSets / totalSets) : 0

  return (
    <main className="min-h-screen text-white relative pb-36">

      {/* ХЕДЕР */}
      <header className="sticky top-0 z-20 px-4 pt-5 pb-3 bg-[#080b10]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-bold text-[#A3E635]/50 uppercase tracking-[0.3em] mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] shadow-[0_0_6px_#A3E635] animate-pulse inline-block" />
                Активна сесія
              </p>
              <h1 className="text-base font-bold text-white tracking-tight truncate max-w-[200px]">
                {workout?.name}
              </h1>
            </div>
            <div className="neural-card rounded-xl px-3 py-2 text-right">
              <p className="text-[8px] font-bold text-white/20 uppercase tracking-wider">Час</p>
              <p className="text-sm font-mono font-bold text-white/70 tabular-nums">{formatTime(sessionTime)}</p>
            </div>
          </div>

          {/* Прогрес бар */}
          <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#A3E635] to-[#22D3EE] rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-wider">Прогрес</span>
            <span className="text-[8px] font-bold text-white/30 tabular-nums">{completedSets}/{totalSets} підходів</span>
          </div>
        </div>
      </header>

      {/* ВПРАВИ */}
      <div className="px-4 flex flex-col gap-5 max-w-md mx-auto w-full mt-5">
        {groupedBlocks().map((block, blockIndex) => {
          const isSuperset = block.length > 1
          const blockExerciseIds = block.map(ex => ex.id)
          const blockSets = Object.values(sets).filter(s => blockExerciseIds.includes(s.workout_exercise_id)).sort((a, b) => a.order - b.order)
          const isBlockDone = blockSets.length > 0 && blockSets.every(s => s.is_completed)
          const blockTitle = isSuperset ? block.map(ex => ex.exercises.name).join(' + ') : block[0].exercises.name

          if (isBlockDone) {
            return (
              <button
                key={`block-${blockIndex}`}
                onClick={() => handleCompleteBlock(blockSets)}
                className="neural-card rounded-2xl px-5 py-3.5 flex items-center justify-between active:scale-[0.98] transition-all border-[#A3E635]/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#A3E635]/15 flex items-center justify-center">
                    <IconCheck className="w-3.5 h-3.5 text-[#A3E635]" />
                  </div>
                  <span className="text-sm font-medium text-white/40 line-through decoration-white/20 truncate max-w-[200px]">
                    {blockTitle}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-[#A3E635]/60 uppercase tracking-wider shrink-0">Виконано</span>
              </button>
            )
          }

          return (
            <div key={`block-${blockIndex}`} className="neural-card rounded-3xl overflow-hidden">
              {isSuperset && (
                <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
                  <div className="ai-badge" style={{ background: 'rgba(34,211,238,0.08)', borderColor: 'rgba(34,211,238,0.2)', color: '#22D3EE' }}>Суперсет</div>
                </div>
              )}

              <div className="p-5 flex flex-col gap-6">
                {block.map((ex, idx) => {
                  const exSets = blockSets.filter(s => s.workout_exercise_id === ex.id)
                  const isTimeType = ex.exercises.type === 'time'

                  return (
                    <div key={ex.id} className={idx > 0 ? 'pt-5 border-t border-white/[0.05]' : ''}>
                      {/* Назва + кнопка "все виконано" */}
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-white/80 uppercase tracking-wide">{ex.exercises.name}</h2>
                        <button
                          onClick={() => handleCompleteBlock(blockSets)}
                          className="text-[9px] font-bold text-white/20 hover:text-[#A3E635] uppercase tracking-wider transition-colors"
                        >
                          Все виконано
                        </button>
                      </div>

                      {/* Заголовки колонок */}
                      <div className={`grid gap-2 px-1 mb-2 ${isTimeType ? 'grid-cols-[36px_1fr_40px]' : 'grid-cols-[36px_1fr_1fr_40px]'}`}>
                        <div className="text-center text-[9px] font-bold text-white/35 uppercase tracking-wider">№</div>
                        <div className="text-center text-[9px] font-bold text-white/35 uppercase tracking-wider">
                          {isTimeType ? 'Секунди' : 'Кг'}
                        </div>
                        {!isTimeType && <div className="text-center text-[9px] font-bold text-white/35 uppercase tracking-wider">Повтори</div>}
                        <div />
                      </div>

                      {/* Підходи */}
                      <div className="flex flex-col gap-2">
                        {exSets.map((set) => {
                          const isDone = set.is_completed
                          return (
                            <div
                              key={set.id}
                              className={`grid gap-2 items-center rounded-xl px-1 py-1 transition-all duration-200 ${isTimeType ? 'grid-cols-[36px_1fr_40px]' : 'grid-cols-[36px_1fr_1fr_40px]'} ${isDone ? 'bg-[#A3E635]/5' : 'hover:bg-white/[0.02]'}`}
                            >
                              {/* Номер підходу */}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono transition-colors ${isDone ? 'bg-[#A3E635]/15 text-[#A3E635]' : 'bg-white/[0.04] text-white/30'}`}>
                                {String(set.order).padStart(2, '0')}
                              </div>

                              {isTimeType ? (
                                <div className={`rounded-xl border transition-all duration-200 ${isDone ? 'border-[#A3E635]/10' : 'border-white/[0.08] focus-within:border-[#A3E635]/40'}`}>
                                  <input
                                    type="number" inputMode="numeric" value={set.time_seconds || ''} placeholder="—"
                                    onChange={(e) => handleSetChange(set.id, 'time_seconds', e.target.value)}
                                    className={`w-full py-2.5 bg-transparent text-center text-lg font-mono font-bold outline-none placeholder:text-white/15 transition-colors ${isDone ? 'text-[#A3E635]/50' : 'text-white'}`}
                                  />
                                </div>
                              ) : (
                                <>
                                  <div className={`rounded-xl border transition-all duration-200 ${isDone ? 'border-[#A3E635]/10 bg-[#A3E635]/5' : 'border-white/[0.08] bg-white/[0.02] focus-within:border-[#A3E635]/40 focus-within:bg-[#A3E635]/5'}`}>
                                    <input
                                      type="number" inputMode="decimal" value={set.weight || ''} placeholder="—"
                                      onChange={(e) => handleSetChange(set.id, 'weight', e.target.value)}
                                      className={`w-full py-2.5 bg-transparent text-center text-lg font-mono font-bold outline-none placeholder:text-white/15 transition-colors ${isDone ? 'text-[#A3E635]/50' : 'text-white'}`}
                                    />
                                  </div>
                                  <div className={`rounded-xl border transition-all duration-200 ${isDone ? 'border-[#A3E635]/10 bg-[#A3E635]/5' : 'border-white/[0.08] bg-white/[0.02] focus-within:border-[#A3E635]/40 focus-within:bg-[#A3E635]/5'}`}>
                                    <input
                                      type="number" inputMode="numeric" value={set.reps || ''} placeholder="—"
                                      onChange={(e) => handleSetChange(set.id, 'reps', e.target.value)}
                                      className={`w-full py-2.5 bg-transparent text-center text-lg font-mono font-bold outline-none placeholder:text-white/15 transition-colors ${isDone ? 'text-[#A3E635]/50' : 'text-white'}`}
                                    />
                                  </div>
                                </>
                              )}

                              {/* Кнопка виконано */}
                              <button
                                onClick={() => handleToggleSet(set.id)}
                                className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all duration-200 active:scale-90 ${isDone
                                  ? 'bg-[#A3E635] border-[#A3E635] shadow-[0_0_15px_rgba(163,230,53,0.35)]'
                                  : 'bg-transparent border-white/[0.12] hover:border-[#A3E635]/50'
                                  }`}
                              >
                                <IconCheck className={`w-4 h-4 ${isDone ? 'text-[#080b10]' : 'text-white/20'}`} />
                              </button>
                            </div>
                          )
                        })}
                      </div>

                      {/* + Додати підхід */}
                      <button
                        onClick={() => handleAddSet(ex.id)}
                        className="w-full mt-3 py-2.5 border border-dashed border-white/[0.08] text-white/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:border-[#A3E635]/30 hover:text-[#A3E635]/70 transition-all flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Підхід
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Кнопки дій */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={() => { setIsAddingExercise(true); loadDbExercises() }}
            disabled={isSavingNewExercise}
            className="neural-card rounded-2xl py-4 flex items-center justify-center gap-3 group hover:border-white/15 active:scale-[0.98] transition-all"
          >
            {isSavingNewExercise ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            ) : (
              <div className="w-7 h-7 rounded-xl bg-[#A3E635]/5 border border-[#A3E635]/15 flex items-center justify-center group-hover:bg-[#A3E635]/10 transition-all">
                <svg className="w-3.5 h-3.5 text-[#A3E635]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            )}
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 transition-colors">
              {isSavingNewExercise ? 'Додається...' : 'Додати вправу'}
            </span>
          </button>

          <button
            onClick={handleFinishWorkout}
            className="rounded-2xl py-4 flex items-center justify-center gap-3 bg-white/[0.02] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04] active:scale-[0.98] transition-all group"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/25 group-hover:text-white/60 transition-colors">
              Завершити тренування
            </span>
          </button>
        </div>
      </div>

      {/* ТАЙМЕР ВІДПОЧИНКУ */}
      {isResting && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col items-center gap-2">
            {/* Вибір тривалості */}
            {showRestPicker && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {REST_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setRestDuration(opt.value); setRestTimer(opt.value); setShowRestPicker(false) }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${restDuration === opt.value ? 'bg-[#A3E635] text-[#080b10]' : 'bg-[#0d1117] border border-white/10 text-white/50 hover:border-white/30'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowRestPicker(prev => !prev)}
              className="flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-[#A3E635] text-[#080b10] shadow-[0_0_40px_rgba(163,230,53,0.4),0_8px_32px_rgba(0,0,0,0.4)] active:scale-95 transition-all"
            >
              <div className="flex flex-col items-start leading-none gap-0.5">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#080b10]/50">Відпочинок</span>
                <span className="text-xl font-mono font-black tabular-nums">{formatTime(restTimer)}</span>
              </div>
              <div className="w-px h-8 bg-[#080b10]/15" />
              <svg className="w-5 h-5 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13H5v-2h14v2z" />
              </svg>
            </button>

            {/* Пропустити */}
            <button
              onClick={() => { setRestTimer(0); setIsResting(false); setShowRestPicker(false) }}
              className="text-[9px] font-bold text-white/30 hover:text-white uppercase tracking-wider transition-colors"
            >
              Пропустити
            </button>
          </div>
        </div>
      )}

      {/* СЕЛЕКТОР ВПРАВ */}
      {isAddingExercise && (
        <ExerciseSelector
          isOpen={true}
          onClose={() => { setIsAddingExercise(false); setSelectorSearch(''); setSelectorCategory('Усі') }}
          onSelect={handleAddNewExercise}
          searchQuery={selectorSearch}
          setSearchQuery={setSelectorSearch}
          activeCategory={selectorCategory}
          setActiveCategory={setSelectorCategory}
          categories={CATEGORIES}
          filteredDbExercises={filteredForSelector}
          isLoadingExercises={isLoadingDb}
          isExactMatch={false}
        />
      )}
    </main>
  )
}