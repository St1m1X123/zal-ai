'use client'

import { supabase } from '../../../lib/supabase'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ExerciseSelector from '../../../components/ExerciseSelector'
import { useApp } from '../../../context/AppContext'

const IconCheck = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const IconTimer = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconTimerOff = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M12 8v4l1.5 1.5M21 12a9 9 0 01-1.378 4.777M19.07 4.93A9 9 0 0012 3a9.003 9.003 0 00-7.391 3.868M5.106 18.894A9 9 0 0012 21a8.996 8.996 0 005.894-2.106" />
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
  const { 
    storedExercises, 
    setStoredExercises, 
    activeWorkoutsCache, 
    setActiveWorkoutsCache,
    setRecentWorkouts,
    setActivityDays,
    setStats 
  } = useApp()

  const [user, setUser] = useState(null)
  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [sets, setSets] = useState({})
  const [prevStats, setPrevStats] = useState({}) // { exercise_id: { weight, reps, time, date } }
  const [loading, setLoading] = useState(true)

  // Auto-timer State
  const [autoRestEnabled, setAutoRestEnabled] = useState(true)
  const [showAutoRestToast, setShowAutoRestToast] = useState(false)

  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restDuration, setRestDuration] = useState(90)
  const [showRestPicker, setShowRestPicker] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)

  const [showFinishScreen, setShowFinishScreen] = useState(false)
  const [finishStats, setFinishStats] = useState(null)
  const [newPRs, setNewPRs] = useState([])

  const timerInterval = useRef(null)
  const sessionInterval = useRef(null)
  const saveTimeouts = useRef({})

  const [isAddingExercise, setIsAddingExercise] = useState(false)
  const [isSavingNewExercise, setIsSavingNewExercise] = useState(false)
  // ExerciseSelector внутрішній стан
  const [selectorSearch, setSelectorSearch] = useState('')
  const [selectorCategory, setSelectorCategory] = useState('Усі')
  const [dbExercises, setDbExercises] = useState([])
  const [isLoadingDb, setIsLoadingDb] = useState(false)
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)

  // Підтягуємо зі збереженого
  useEffect(() => {
    if (storedExercises?.length > 0) {
      setDbExercises(storedExercises)
    }
  }, [storedExercises])

  const CATEGORIES = ['Усі', 'Груди', 'Спина', 'Ноги', 'Плечі', 'Руки', 'Прес', 'Кардіо', 'Розтяжка', 'Інше']

  // Відновлюємо налаштування таймера з localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zalai_auto_rest')
    if (saved !== null) {
      setAutoRestEnabled(saved === 'true')
    }
  }, [])

  const toggleAutoRest = () => {
    const nextVal = !autoRestEnabled
    setAutoRestEnabled(nextVal)
    localStorage.setItem('zalai_auto_rest', String(nextVal))
    setShowAutoRestToast(true)
    setTimeout(() => setShowAutoRestToast(false), 2000)
  }

  const loadDbExercises = async () => {
    // В нас вже є дані з AppContext, нічого не вантажимо додатково, 
    // хіба що список пустий
    if (dbExercises.length === 0 && storedExercises.length === 0) {
      setIsLoadingDb(true)
      const { data } = await supabase.from('exercises').select('*').order('name', { ascending: true })
      if(data) {
          setDbExercises(data)
          setStoredExercises(data)
      }
      setIsLoadingDb(false)
    } else if (storedExercises.length > 0 && dbExercises.length === 0) {
        setDbExercises(storedExercises)
    }
  }

  const filteredForSelector = dbExercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(selectorSearch.toLowerCase())
    const matchCat = selectorCategory === 'Усі' ? true : ex.muscle === selectorCategory
    return matchSearch && matchCat
  })

  // Таймер сесії
  useEffect(() => {
    if (!workoutId) return
    const startKey = `zalai_session_start_${workoutId}`
    let startTime = localStorage.getItem(startKey)
    if (!startTime) {
      startTime = Date.now()
      localStorage.setItem(startKey, startTime.toString())
    } else {
      startTime = parseInt(startTime, 10)
    }

    setSessionTime(Math.floor((Date.now() - startTime) / 1000))

    sessionInterval.current = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(sessionInterval.current)
  }, [workoutId])

  // Ініціалізація таймера відпочинку при завантаженні (якщо він вже йшов)
  useEffect(() => {
    if (!workoutId) return
    const restEndStr = localStorage.getItem(`zalai_rest_end_${workoutId}`)
    if (restEndStr) {
      const remaining = Math.floor((parseInt(restEndStr, 10) - Date.now()) / 1000)
      if (remaining > 0) {
        setRestTimer(remaining)
        setIsResting(true)
      } else {
        localStorage.removeItem(`zalai_rest_end_${workoutId}`)
      }
    }
  }, [workoutId])

  // Таймер відпочинку
  useEffect(() => {
    if (restTimer > 0) {
      timerInterval.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false)
            clearInterval(timerInterval.current)
            if (workoutId) localStorage.removeItem(`zalai_rest_end_${workoutId}`)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setIsResting(false)
      clearInterval(timerInterval.current)
    }
    return () => clearInterval(timerInterval.current)
  }, [restTimer, workoutId])

  const startRest = () => {
    if (!autoRestEnabled || !workoutId) return
    const endMs = Date.now() + restDuration * 1000
    localStorage.setItem(`zalai_rest_end_${workoutId}`, endMs.toString())
    setRestTimer(restDuration)
    setIsResting(true)
  }

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  // Завантаження даних
  useEffect(() => {
    if (!workoutId) return

    const fetchWorkoutData = async () => {
      // 1. Get user session first
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user
      setUser(currentUser)

      // 2. Check cache first for instant load!
      let weData = []
      let exerciseIds = []
      
      if (activeWorkoutsCache && activeWorkoutsCache[workoutId]) {
        const cached = activeWorkoutsCache[workoutId]
        setWorkout(cached.workout)
        setExercises(cached.exercises || [])
        setSets(cached.sets || {})
        exerciseIds = weData?.map(e => e.exercise_id) || []
        setLoading(false) // Миттєве відображення з кешу
      } else {
        // Оптимізований запит 3-в-1 (Тренування + Вправи + Підходи)
        const { data: wData, error } = await supabase
          .from('workouts')
          .select(`
            *, 
            workout_exercises(*, exercises(name, type), sets(*))
          `)
          .eq('id', workoutId)
          .single()
        
        if (wData) {
          // Розбираємо структуру назад у стан
          const { workout_exercises, ...workoutInfo } = wData
          setWorkout(workoutInfo)
          
          if (workout_exercises && workout_exercises.length > 0) {
            // Сортуємо вправи за order
            workout_exercises.sort((a,b) => a.order - b.order)
            
            // Виймаємо sets і видаляємо їх з workout_exercises
            const setsObj = {}
            const preparedExercises = workout_exercises.map(we => {
              const { sets, ...weInfo } = we
              if (sets && sets.length > 0) {
                sets.sort((a,b) => a.order - b.order).forEach(s => { setsObj[s.id] = s })
              }
              return weInfo
            })

            setExercises(preparedExercises)
            setSets(setsObj)
            weData = preparedExercises
            exerciseIds = preparedExercises.map(e => e.exercise_id)

            // Зберігаємо в кеш для наступних повернень (якщо юзер вийде і зайде знов)
            setActiveWorkoutsCache(prev => ({
              ...prev, 
              [workoutId]: { workout: workoutInfo, exercises: preparedExercises, sets: setsObj }
            }))
          } else {
             setExercises([])
             setSets({})
          }
        }
        setLoading(false) // Відображаємо UI одразу після завантаження основних даних
      }

      // 3. Fetch previous stats for these exercises в фоні
      if (currentUser && exerciseIds.length > 0) {
        try {
          // Шукаємо всі попередні завершені тренування користувача
          const { data: prevWorkouts } = await supabase
            .from('workouts')
            .select('id, date')
            .eq('user_id', currentUser.id)
            .eq('status', 'completed')
            .eq('is_template', false)
            .neq('id', workoutId)
            .order('date', { ascending: false })
            .limit(10) // Шукаємо тільки в останніх 10 тренуваннях для швидості

          if (prevWorkouts?.length > 0) {
            const prevWorkoutIds = prevWorkouts.map(w => w.id)

            const { data: prevWEs } = await supabase
              .from('workout_exercises')
              .select('id, exercise_id, workout_id')
              .in('workout_id', prevWorkoutIds)
              .in('exercise_id', exerciseIds)

            if (prevWEs?.length > 0) {
              const prevWeIds = prevWEs.map(we => we.id)

              const { data: prevSetData } = await supabase
                .from('sets')
                .select('weight, reps, time_seconds, workout_exercise_id')
                .in('workout_exercise_id', prevWeIds)
                .eq('is_completed', true)

              // Групуємо статистику
              // Знаходимо найкращий сет (макс вага/час) для кожної вправи в останньому тренуванні
              const statsMap = {}

              exerciseIds.forEach(exId => {
                // Відсортувати workout_exercises для цієї вправи за датою (через workoutIds)
                const wesForEx = prevWEs.filter(we => we.exercise_id === exId)
                if (!wesForEx.length) return

                // Знайти найновіший workout (спиремось на порядок prevWorkouts)
                let latestWe = null
                for (const pw of prevWorkouts) {
                  const match = wesForEx.find(we => we.workout_id === pw.id)
                  if (match) { latestWe = match; break }
                }

                if (latestWe) {
                  // Знайти всі сети для цього workout_exercise
                  const exSets = prevSetData?.filter(s => s.workout_exercise_id === latestWe.id) || []
                  if (exSets.length > 0) {
                    // Знайти "найкращий" сет
                    // Для ваги - макс вага, потім макс повтори
                    // Для часу - макс час
                    const bestSet = exSets.reduce((best, cur) => {
                      if (!best) return cur;
                      if ((cur.weight || 0) > (best.weight || 0)) return cur;
                      if ((cur.weight || 0) === (best.weight || 0) && (cur.reps || 0) > (best.reps || 0)) return cur;
                      if ((cur.time_seconds || 0) > (best.time_seconds || 0)) return cur;
                      return best;
                    }, null)

                    if (bestSet) {
                      statsMap[exId] = {
                        weight: bestSet.weight,
                        reps: bestSet.reps,
                        time: bestSet.time_seconds,
                        date: prevWorkouts.find(w => w.id === latestWe.workout_id)?.date
                      }
                    }
                  }
                }
              })
              setPrevStats(statsMap)
            }
          }
        } catch (e) { console.error('Error fetching prev stats:', e) }
      }
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

  // Видалити підхід
  const handleDeleteSet = async (setId) => {
    if (Object.values(sets).length <= 1) return // Не видаляємо останній підхід на всьому екрані
    const { error } = await supabase.from('sets').delete().eq('id', setId)
    if (!error) {
      setSets(prev => {
        const next = { ...prev }
        delete next[setId]
        return next
      })
    }
  }

  const handleAddNewExercise = async (dbEx) => {
    setIsSavingNewExercise(true)
    setIsAddingExercise(false)
    try {
      // 1. Створюємо запис у workout_exercises
      const newOrder = exercises.length + 1
      const { data: weData, error: weError } = await supabase.from('workout_exercises')
        .insert([{ workout_id: workoutId, exercise_id: dbEx.id, order: newOrder }])
        .select('*, exercises(name, type)').single()

      if (weError) throw weError

      // 2. Додаємо порожній підхід
      const { data: setData, error: setError } = await supabase.from('sets')
        .insert([{ workout_exercise_id: weData.id, order: 1, is_completed: false }])
        .select().single()

      if (setError) throw setError

      setExercises(prev => [...prev, weData])
      setSets(prev => ({ ...prev, [setData.id]: setData }))
    } catch (e) {
      console.error(e)
      alert("Не вдалося додати вправу")
    } finally {
      setIsSavingNewExercise(false)
    }
    setSelectorSearch('')
    setSelectorCategory('Усі')
  }

  const handleCreateCustomExercise = async () => {
    if (!selectorSearch.trim()) return
    setIsCreatingCustom(true)
    const { data, error } = await supabase.from('exercises')
      .insert([{ name: selectorSearch.trim(), type: 'weight_reps', muscle: selectorCategory === 'Усі' ? 'Інше' : selectorCategory, user_id: user?.id || null, created_by: user?.id || null }])
      .select().single()
    if (data) {
      setDbExercises(prev => [...prev, data])
      handleAddNewExercise(data)
    }
    else { console.error('Помилка:', error); alert('Не вдалося створити вправу') }
    setIsCreatingCustom(false)
  }

  const handleDeleteCustomExercise = async (id) => {
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (error) {
      console.error('Помилка видалення:', error)
      alert('Не вдалося видалити вправу. Можливо, вона вже використовується у ваших тренуваннях.')
    } else {
      setDbExercises(prev => prev.filter(ex => ex.id !== id))
    }
  }

  const handleFinishWorkout = async () => {
    clearInterval(sessionInterval.current)
    const allSets = Object.values(sets)
    const completed = allSets.filter(s => s.is_completed)

    // ── Визначення нових рекордів ──
    const prList = []
    try {
      const userId = user?.id
      if (userId) {
        const exerciseIds = [...new Set(exercises.map(ex => ex.exercise_id))]

        const { data: prevWorkouts } = await supabase
          .from('workouts').select('id')
          .eq('user_id', userId).neq('id', workoutId)
          .eq('is_template', false).eq('status', 'completed')

        if (prevWorkouts?.length > 0) {
          const { data: prevWEs } = await supabase
            .from('workout_exercises').select('id, exercise_id')
            .in('workout_id', prevWorkouts.map(w => w.id))
            .in('exercise_id', exerciseIds)

          if (prevWEs?.length > 0) {
            const { data: prevSetData } = await supabase
              .from('sets').select('weight, workout_exercise_id')
              .in('workout_exercise_id', prevWEs.map(we => we.id))
              .eq('is_completed', true).gt('weight', 0)

            const prevMax = {}
            prevSetData?.forEach(s => {
              const we = prevWEs.find(w => w.id === s.workout_exercise_id)
              if (we) prevMax[we.exercise_id] = Math.max(prevMax[we.exercise_id] || 0, s.weight || 0)
            })

            exercises.forEach(ex => {
              const exSets = completed.filter(s => s.workout_exercise_id === ex.id && (s.weight || 0) > 0)
              if (!exSets.length) return
              const curMax = Math.max(...exSets.map(s => s.weight || 0))
              const oldMax = prevMax[ex.exercise_id] || 0
              if (curMax > oldMax) {
                prList.push({
                  name: ex.exercises.name,
                  weight: curMax,
                  prev: oldMax,
                  isFirst: oldMax === 0,
                })
              }
            })
          }
        }
      }
    } catch (e) { console.error('PR detection:', e) }

    setFinishStats({
      name: workout?.name || 'Тренування',
      time: sessionTime,
      totalSets: allSets.length,
      completedSets: completed.length,
      exercises: exercises.length,
    })
    setNewPRs(prList)
    await supabase.from('workouts').update({ status: 'completed' }).eq('id', workoutId)
    
    // Очищаємо localStorage при завершенні
    if (workoutId) {
      localStorage.removeItem(`zalai_session_start_${workoutId}`)
      localStorage.removeItem(`zalai_rest_end_${workoutId}`)
    }
    
    // Оновлюємо глобальний кеш так що дашборд відразу відображає прогрес
    const todayStr = new Date().toISOString().split('T')[0]
    
    if (setActivityDays) {
      setActivityDays(prev => {
        const next = new Set(prev)
        next.add(todayStr)
        return next
      })
    }
    
    if (setRecentWorkouts) {
      setRecentWorkouts(prev => [
        { id: workoutId, name: workout?.name || 'Тренування', date: new Date().toISOString() },
        ...prev
      ].slice(0, 3)) // Тримаємо останні 3
    }
    
    if (setStats) {
      setStats(prev => ({
        ...prev,
        total: (prev?.total || 0) + 1,
        thisMonth: (prev?.thisMonth || 0) + 1,
        totalSets: (prev?.totalSets || 0) + completed.length
      }))
    }
    
    setShowFinishScreen(true)
  }

  // ============= ЕКРАН ЗАВЕРШЕННЯ =============
  if (showFinishScreen && finishStats) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start p-6 relative overflow-hidden pb-12">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[100px] bg-[#A3E635]/15 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[60px] bg-[#22D3EE]/8 pointer-events-none" />

        <div className="z-10 w-full max-w-sm flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-12">
          {/* Іконка успіху */}
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl neural-card flex items-center justify-center shadow-[0_0_50px_rgba(163,230,53,0.2)]">
              <svg className="w-12 h-12 text-[#A3E635]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 ai-badge">❖ AI</div>
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

          {/* Трофеї — нові рекорди */}
          {newPRs.length > 0 && (
            <div className="w-full text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-white font-bold text-base">Нові рекорди!</p>
                  <p className="text-white/30 text-xs">{newPRs.length === 1 ? 'Один новий' : `${newPRs.length} нових`} особистих рекорди</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {newPRs.map((pr, i) => (
                  <div key={i} className="rounded-2xl px-4 py-3 flex items-center justify-between"
                    style={{ background: 'rgba(163,230,53,0.07)', border: '1px solid rgba(163,230,53,0.2)' }}>
                    <div>
                      <p className="text-white text-sm font-bold">{pr.name}</p>
                      <p className="text-white/30 text-xs mt-0.5">
                        {pr.isFirst ? 'Уперше за цю вправу!' : `Було: ${pr.prev} кг`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-xl" style={{ color: '#A3E635' }}>{pr.weight} кг</p>
                      {!pr.isFirst && (
                        <p className="text-xs font-bold" style={{ color: '#A3E635' }}>+{(pr.weight - pr.prev).toFixed(1)} кг ↗</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI аналіз */}
          <div className="neural-card rounded-2xl p-4 w-full text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="ai-badge">❖ AI Аналіз</div>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">
              {newPRs.length > 0
                ? `Неймовірно! Ти побив ${newPRs.length > 1 ? `${newPRs.length} рекорди` : 'рекорд'} за цю сесію. ZalAI запамʼятає цей прогрес і піднятиме планку наступного разу.`
                : 'Відмінна сесія! ZalAI запамʼятає всі ваги та підходи. Наступного разу AI підкаже оптимальне навантаження.'}
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

      {/* Auto timer toast indicator */}
      {showAutoRestToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="bg-[#080b10]/95 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-2xl">
            {autoRestEnabled ? (
              <IconTimer className="w-4 h-4 text-[#A3E635]" />
            ) : (
              <IconTimerOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-[11px] font-bold text-white uppercase tracking-widest">
              {'Авто-таймер ' + (autoRestEnabled ? 'увімкнено' : 'вимкнено')}
            </span>
          </div>
        </div>
      )}

      {/* ХЕДЕР */}
      <header className="sticky top-0 z-20 px-4 pt-5 pb-3 bg-[#080b10]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-[9px] font-bold text-[#A3E635]/50 uppercase tracking-[0.3em] mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] shadow-[0_0_6px_#A3E635] animate-pulse inline-block" />
                Активна сесія
              </p>
              <h1 className="text-base font-bold text-white tracking-tight">
                {workout?.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAutoRest}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${autoRestEnabled ? 'bg-[#A3E635]/15 text-[#A3E635]' : 'bg-red-500/10 text-red-400'}`}
              >
                {autoRestEnabled ? <IconTimer className="w-4 h-4" /> : <IconTimerOff className="w-4 h-4" />}
              </button>
              <div className="neural-card rounded-xl px-3 py-2 text-right">
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-wider">Час</p>
                <p className="text-sm font-mono font-bold text-white/70 tabular-nums">{formatTime(sessionTime)}</p>
              </div>
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
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#A3E635]/15 flex items-center justify-center shrink-0">
                    <IconCheck className="w-3.5 h-3.5 text-[#A3E635]" />
                  </div>
                  <span className="text-sm font-medium text-white/40 line-through decoration-white/20">
                    {blockTitle}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-[#A3E635]/60 uppercase tracking-wider shrink-0 ml-3">Виконано</span>
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
                  const exPrevStats = prevStats[ex.exercise_id]

                  return (
                    <div key={ex.id} className={idx > 0 ? 'pt-5 border-t border-white/[0.05]' : ''}>
                      {/* Назва + кнопка "все виконано" */}
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 group/title">
                            <h2 className="text-sm font-bold text-white/80 uppercase tracking-wide leading-snug">{ex.exercises.name}</h2>
                            <Link
                              href={`/exercises/${ex.exercise_id}`}
                              className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-[#22D3EE] hover:border-[#22D3EE]/30 transition-all shrink-0 ml-2"
                              title="Дізнатися більше"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                              </svg>
                            </Link>
                          </div>

                          {/* Попередній рекорд для цієї вправи */}
                          {exPrevStats && (
                            <p className="text-[10px] font-medium text-white/30 mt-1 flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-[#A3E635]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              Минулого разу: {
                                isTimeType
                                  ? `${formatTime(exPrevStats.time || 0)}`
                                  : `${exPrevStats.weight || 0}кг × ${exPrevStats.reps || 0}`
                              }
                              <span className="text-[8px] opacity-40 ml-1">
                                ({new Date(exPrevStats.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })})
                              </span>
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleCompleteBlock(blockSets)}
                          className="text-[9px] font-bold text-white/20 hover:text-[#A3E635] uppercase tracking-wider transition-colors shrink-0 pt-0.5"
                        >
                          Все виконано
                        </button>
                      </div>

                      {/* Заголовки колонок */}
                      <div className={`grid gap-2 px-1 mb-2 ${isTimeType ? 'grid-cols-[36px_1fr_1fr_40px_32px]' : 'grid-cols-[36px_1fr_1fr_40px_32px]'}`}>
                        <div className="text-center text-[9px] font-bold text-white/35 uppercase tracking-wider">#</div>
                        <div className="text-center text-[9px] font-bold text-white/35 uppercase tracking-wider">
                          {isTimeType ? 'Хв' : 'Кг'}
                        </div>
                        <div className="text-center text-[9px] font-bold text-white/35 uppercase tracking-wider">
                          {isTimeType ? 'Сек' : 'Повт'}
                        </div>
                        <div />
                        <div />
                      </div>

                      {/* Підходи */}
                      <div className="flex flex-col gap-2">
                        {exSets.map((set) => {
                          const isDone = set.is_completed
                          return (
                            <div
                              key={set.id}
                              className={`grid gap-2 items-center rounded-xl px-1 py-1 transition-all duration-200 grid-cols-[36px_1fr_1fr_40px_32px] ${isDone ? 'bg-[#A3E635]/5' : 'hover:bg-white/[0.02]'} group/set`}
                            >
                              {/* Номер підходу */}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono transition-colors ${isDone ? 'bg-[#A3E635]/15 text-[#A3E635]' : 'bg-white/[0.04] text-white/30'}`}>
                                {set.order}
                              </div>

                              {isTimeType ? (
                                <>
                                  {/* Хвилини */}
                                  <div className={`relative rounded-xl border transition-all duration-200 ${isDone ? 'border-[#A3E635]/10 bg-[#A3E635]/5' : 'border-white/[0.08] bg-white/[0.02] focus-within:border-[#22D3EE]/50 focus-within:bg-[#22D3EE]/5'}`}>
                                    <input
                                      type="number" inputMode="numeric"
                                      value={set.time_seconds ? Math.floor(set.time_seconds / 60) : ''}
                                      placeholder="—"
                                      onChange={(e) => {
                                        const mins = Number(e.target.value) || 0
                                        const secs = set.time_seconds ? set.time_seconds % 60 : 0
                                        handleSetChange(set.id, 'time_seconds', mins * 60 + secs)
                                      }}
                                      className={`w-full py-3.5 bg-transparent text-center text-xl font-mono font-bold outline-none placeholder:text-white/15 transition-colors ${isDone ? 'text-[#A3E635]/50' : 'text-white'}`}
                                    />
                                  </div>
                                  {/* Секунди */}
                                  <div className={`relative rounded-xl border transition-all duration-200 ${isDone ? 'border-[#A3E635]/10 bg-[#A3E635]/5' : 'border-white/[0.08] bg-white/[0.02] focus-within:border-[#22D3EE]/50 focus-within:bg-[#22D3EE]/5'}`}>
                                    <input
                                      type="number" inputMode="numeric"
                                      value={set.time_seconds ? set.time_seconds % 60 : ''}
                                      placeholder="—"
                                      onChange={(e) => {
                                        const secs = Math.min(59, Number(e.target.value) || 0)
                                        const mins = set.time_seconds ? Math.floor(set.time_seconds / 60) : 0
                                        handleSetChange(set.id, 'time_seconds', mins * 60 + secs)
                                      }}
                                      className={`w-full py-3.5 bg-transparent text-center text-xl font-mono font-bold outline-none placeholder:text-white/15 transition-colors ${isDone ? 'text-[#A3E635]/50' : 'text-white'}`}
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Вага */}
                                  <div className={`relative rounded-xl border transition-all duration-200 ${isDone ? 'border-[#A3E635]/10 bg-[#A3E635]/5' : 'border-white/[0.08] bg-white/[0.02] focus-within:border-[#A3E635]/40 focus-within:bg-[#A3E635]/5'}`}>
                                    <input
                                      type="number" inputMode="decimal" value={set.weight || ''} placeholder="—"
                                      onChange={(e) => handleSetChange(set.id, 'weight', e.target.value)}
                                      className={`w-full py-3.5 bg-transparent text-center text-xl font-mono font-bold outline-none placeholder:text-white/15 transition-colors ${isDone ? 'text-[#A3E635]/50' : 'text-white'}`}
                                    />
                                  </div>
                                  {/* Повтори */}
                                  <div className={`relative rounded-xl border transition-all duration-200 ${isDone ? 'border-[#A3E635]/10 bg-[#A3E635]/5' : 'border-white/[0.08] bg-white/[0.02] focus-within:border-[#A3E635]/40 focus-within:bg-[#A3E635]/5'}`}>
                                    <input
                                      type="number" inputMode="numeric" value={set.reps || ''} placeholder="—"
                                      onChange={(e) => handleSetChange(set.id, 'reps', e.target.value)}
                                      className={`w-full py-3.5 bg-transparent text-center text-xl font-mono font-bold outline-none placeholder:text-white/15 transition-colors ${isDone ? 'text-[#A3E635]/50' : 'text-white'}`}
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

                              {/* Кнопка видалення */}
                              <button
                                onClick={() => handleDeleteSet(set.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-500/60 hover:bg-red-500/5 transition-all"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
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
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col items-center gap-2">
            {/* Вибір тривалості */}
            {showRestPicker && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {REST_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { 
                      setRestDuration(opt.value); 
                      setRestTimer(opt.value); 
                      setShowRestPicker(false);
                      if (workoutId) localStorage.setItem(`zalai_rest_end_${workoutId}`, (Date.now() + opt.value * 1000).toString())
                    }}
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
              onClick={() => { 
                setRestTimer(0); 
                setIsResting(false); 
                setShowRestPicker(false);
                if (workoutId) localStorage.removeItem(`zalai_rest_end_${workoutId}`) 
              }}
              className="text-[9px] font-bold text-white/30 hover:text-white uppercase tracking-wider transition-colors bg-[#080b10] px-4 py-1.5 rounded-full border border-white/[0.05]"
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
          handleCreateCustomExercise={handleCreateCustomExercise}
          isCreatingCustom={isCreatingCustom}
          user={user}
          handleDeleteCustomExercise={handleDeleteCustomExercise}
        />
      )}
    </main>
  )
}