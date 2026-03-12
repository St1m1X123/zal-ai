'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import ExerciseSelector from '../../components/ExerciseSelector'
import ExerciseBlock from '../../components/ExerciseBlock'
import { useApp } from '../../context/AppContext'

export default function CreateWorkoutPage() {
  const router = useRouter()
  const { user, storedExercises, setStoredExercises, setTemplates } = useApp()
  const [workoutName, setWorkoutName] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('zalai_create_workout_name')
      return saved || ''
    }
    return ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [dbExercises, setDbExercises] = useState([])
  const [isLoadingExercises, setIsLoadingExercises] = useState(true)

  useEffect(() => {
    if (storedExercises?.length > 0) {
      setDbExercises(storedExercises)
      setIsLoadingExercises(false)
    } else {
      // Фолбек якщо з якоїсь причини контекст ще пустий
      const fetchExercises = async () => {
        setIsLoadingExercises(true)
        const { data, error } = await supabase.from('exercises').select('*').order('name', { ascending: true })
        if (data) {
          setDbExercises(data)
          setStoredExercises(data)
        }
        else console.error('Помилка завантаження вправ:', error)
        setIsLoadingExercises(false)
      }
      fetchExercises()
    }
  }, [storedExercises, setStoredExercises])

  const categories = ['Усі', 'Груди', 'Спина', 'Ноги', 'Плечі', 'Руки', 'Прес', 'Кардіо', 'Розтяжка', 'Інше']
  const [isModalOpen, setIsModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('zalai_create_workout_modal_open') === 'true'
    }
    return false
  })
  const [activeExerciseId, setActiveExerciseId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('zalai_create_workout_active_id')
      return saved ? Number(saved) : null
    }
    return null
  })
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('zalai_create_workout_search') || ''
    }
    return ''
  })
  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('zalai_create_workout_category') || 'Усі'
    }
    return 'Усі'
  })
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)

  const [exercises, setExercises] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('zalai_create_workout_exercises')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch(e) { console.error('Error parsing saved create workout exercises') }
      }
    }
    return [{
      id: Date.now(), exercise_id: null, name: '', note: '', type: 'weight_reps', superset_id: null,
      sets: [{ id: Date.now() + 1, weight: '', reps: '', time_minutes: '', time_seconds: '', set_type: 'normal', note: '' }]
    }]
  })

  // --- Збереження стану в sessionStorage ---
  useEffect(() => {
    sessionStorage.setItem('zalai_create_workout_name', workoutName)
  }, [workoutName])

  useEffect(() => {
    sessionStorage.setItem('zalai_create_workout_exercises', JSON.stringify(exercises))
  }, [exercises])

  useEffect(() => {
    sessionStorage.setItem('zalai_create_workout_modal_open', isModalOpen)
    if (activeExerciseId) sessionStorage.setItem('zalai_create_workout_active_id', activeExerciseId)
    else sessionStorage.removeItem('zalai_create_workout_active_id')
    sessionStorage.setItem('zalai_create_workout_search', searchQuery)
    sessionStorage.setItem('zalai_create_workout_category', activeCategory)
  }, [isModalOpen, activeExerciseId, searchQuery, activeCategory])

  // Очищення sessionStorage при успішному збереженні
  const clearSessionStorage = () => {
    sessionStorage.removeItem('zalai_create_workout_name')
    sessionStorage.removeItem('zalai_create_workout_exercises')
    sessionStorage.removeItem('zalai_create_workout_modal_open')
    sessionStorage.removeItem('zalai_create_workout_active_id')
    sessionStorage.removeItem('zalai_create_workout_search')
    sessionStorage.removeItem('zalai_create_workout_category')
  }

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

  const handleOpenModal = (id) => { 
    setActiveExerciseId(id)
    // Не скидаємо пошук при відкритті, щоб зберегти стан якщо юзер щойно повернувся або просто закрив-відкрив
    // setSearchQuery('') ; setActiveCategory('Усі')
    setIsModalOpen(true) 
  }
  const handleSelectExercise = (dbEx) => {
    setExercises(exercises.map(ex => ex.id === activeExerciseId ? { ...ex, exercise_id: dbEx.id, name: dbEx.name, type: dbEx.type } : ex))
    setIsModalOpen(false)
  }
  const handleCreateCustomExercise = async () => {
    if (!searchQuery.trim()) return
    setIsCreatingCustom(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('exercises')
      .insert([{ name: searchQuery.trim(), type: 'weight_reps', muscle: activeCategory === 'Усі' ? 'Інше' : activeCategory, user_id: user?.id || null, created_by: user?.id || null }])
      .select().single()
    if (data) { setDbExercises(prev => [...prev, data]); handleSelectExercise(data) }
    else { console.error('Помилка:', error); alert('Не вдалося створити вправу.') }
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

  const handleAddExercise = () => {
    setExercises([...exercises, { id: Date.now(), exercise_id: null, name: '', note: '', type: 'weight_reps', superset_id: null, sets: [{ id: Date.now() + 1, weight: '', reps: '', time_minutes: '', time_seconds: '', set_type: 'normal', note: '' }] }])
  }
  const handleAddToSuperset = (block) => {
    const supersetId = block[0].superset_id || crypto.randomUUID()
    const blockIds = block.map(ex => ex.id)
    let updated = exercises.map(ex => blockIds.includes(ex.id) ? { ...ex, superset_id: supersetId } : ex)
    const lastIndex = updated.findIndex(ex => ex.id === block[block.length - 1].id)
    updated.splice(lastIndex + 1, 0, { id: Date.now(), exercise_id: null, name: '', note: '', type: 'weight_reps', superset_id: supersetId, sets: [{ id: Date.now() + 1, weight: '', reps: '', time_minutes: '', time_seconds: '', set_type: 'normal', note: '' }] })
    setExercises(updated)
  }
  const handleRemoveExercise = (id) => setExercises(exercises.filter(ex => ex.id !== id))
  const handleUpdateExercise = (id, field, value) => setExercises(exercises.map(ex => ex.id === id ? { ...ex, [field]: value } : ex))
  const handleAddSet = (exerciseId) => setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: [...ex.sets, { id: Date.now(), weight: '', reps: '', time_minutes: '', time_seconds: '', set_type: 'normal', note: '' }] } : ex))
  const handleUpdateSet = (exerciseId, setId, field, value) => setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.map(set => set.id === setId ? { ...set, [field]: value } : set) } : ex))
  const handleRemoveSet = (exerciseId, setId) => setExercises(exercises.map(ex => ex.id === exerciseId ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) } : ex))

  const handleSaveTemplate = async () => {
    if (!workoutName.trim()) { alert('Введіть назву тренування!'); return }
    if (exercises.length === 0 || !exercises[0].exercise_id) { alert('Додайте хоча б одну вправу!'); return }
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { alert('Потрібно увійти!'); return }
      const { data: workoutData, error: workoutError } = await supabase.from('workouts')
        .insert([{ name: workoutName.trim(), is_template: true, user_id: user.id, status: 'completed', date: new Date().toISOString().split('T')[0] }])
        .select().single()
      if (workoutError) throw workoutError

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i]
        if (!ex.exercise_id) continue
        const { data: weData, error: weError } = await supabase.from('workout_exercises')
          .insert([{ workout_id: workoutData.id, exercise_id: ex.exercise_id, order: i + 1, superset_id: ex.superset_id?.startsWith('super-') ? null : ex.superset_id }])
          .select().single()
        if (weError) throw weError
        const setsToInsert = ex.sets.map((set, si) => ({ workout_exercise_id: weData.id, order: si + 1, weight: Number(set.weight) || null, reps: Number(set.reps) || null, time_seconds: ((Number(set.time_minutes) || 0) * 60 + (Number(set.time_seconds) || 0)) || null, note: ex.note || null, is_completed: false }))
        if (setsToInsert.length > 0) { const { error: setsError } = await supabase.from('sets').insert(setsToInsert); if (setsError) throw setsError }
      }
      
      // Після успішного збереження в базу, оновлюємо глобальний кеш
      if (setTemplates) {
        // Ми маємо збудувати об'єкт, схожий на той, що повертає supabase .select('*, workout_exercises(*, exercises(name, type))')
        // Оскільки ми щойно створили його, можна зробити швидкий запит для отримання повної структури або просто перезавантажити сторінку
        // Але краще зробити 1 запит, щоб отримати повну структуру для кешу
        const { data: newTemplateData } = await supabase
          .from('workouts')
          .select('*, workout_exercises(id, exercises(name))')
          .eq('id', workoutData.id)
          .single()
        
        if (newTemplateData) {
          setTemplates(prev => [newTemplateData, ...prev])
        }
      }

      clearSessionStorage()
      router.push('/programs')
    } catch (error) {
      console.error('Помилка збереження:', error.message || error)
      alert(`Помилка: ${error.message || 'невідома помилка'}`)
    } finally { setIsSaving(false) }
  }

  const filteredDbExercises = dbExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'Усі' ? true : ex.muscle === activeCategory
    return matchesSearch && matchesCategory
  })
  const isExactMatch = dbExercises.some(ex => ex.name.toLowerCase() === searchQuery.trim().toLowerCase())

  return (
    <main className="min-h-screen text-white relative overflow-x-hidden">

      {/* ХЕДЕР */}
      <header className="sticky top-0 z-20 px-4 pt-5 pb-4 bg-[#080b10]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="mx-auto w-full max-w-md">
          <p className="text-[10px] font-bold text-[#A3E635]/60 uppercase tracking-[0.25em] mb-2">Нова програма</p>
          <input
            type="text"
            placeholder="Назва тренування..."
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="w-full bg-transparent text-xl font-bold tracking-tight text-white outline-none placeholder:text-white/20"
          />
        </div>
      </header>

      <div className="p-4 pb-28 flex flex-col max-w-md mx-auto w-full gap-4 mt-2">
        {groupedBlocks().map((block, blockIndex) => (
          <ExerciseBlock
            key={`block-${blockIndex}`}
            block={block}
            blockIndex={blockIndex}
            handleOpenModal={handleOpenModal}
            handleRemoveExercise={handleRemoveExercise}
            handleUpdateExercise={handleUpdateExercise}
            handleUpdateSet={handleUpdateSet}
            handleRemoveSet={handleRemoveSet}
            handleAddSet={handleAddSet}
            handleAddToSuperset={handleAddToSuperset}
          />
        ))}

        {/* Додати вправу */}
        <button
          onClick={handleAddExercise}
          className="w-full py-4 rounded-2xl neural-card text-white/30 font-bold uppercase tracking-[0.2em] text-xs hover:border-white/15 hover:text-white/60 transition-all flex items-center justify-center gap-2 group"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Додати вправу
        </button>

        {/* Зберегти */}
        <button
          onClick={handleSaveTemplate}
          disabled={isSaving}
          className={`relative w-full flex items-center justify-center gap-3 py-4 mt-2 mb-8 rounded-2xl font-bold uppercase tracking-[0.15em] text-sm overflow-hidden active:scale-[0.98] transition-all ${isSaving
            ? 'bg-white/[0.03] text-white/30 border border-white/[0.06] cursor-not-allowed'
            : 'bg-[#A3E635] text-[#080b10] hover:shadow-[0_0_40px_rgba(163,230,53,0.3)] hover:bg-[#b8f053]'
            }`}
        >
          {!isSaving && (
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_ease-in-out]" />
          )}
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {isSaving ? 'Збереження...' : 'Зберегти програму'}
        </button>
      </div>

      <ExerciseSelector
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectExercise}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={categories}
        filteredDbExercises={filteredDbExercises}
        isLoadingExercises={isLoadingExercises}
        isExactMatch={isExactMatch}
        handleCreateCustomExercise={handleCreateCustomExercise}
        isCreatingCustom={isCreatingCustom}
        user={user}
        handleDeleteCustomExercise={handleDeleteCustomExercise}
        onInfoClick={(exId) => {
          // Стан вже автоматично зберігається в sessionStorage завдяки useEffect
          router.push(`/exercises/${exId}`)
        }}
      />
    </main>
  )
}
