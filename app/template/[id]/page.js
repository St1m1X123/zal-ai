'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import ExerciseSelector from '../../../components/ExerciseSelector'
import ExerciseBlock from '../../../components/ExerciseBlock'
import { useApp } from '../../../context/AppContext'

export default function EditTemplatePage() {
    const router = useRouter()
    const { user, storedExercises, setStoredExercises, templates, setTemplates, setPrograms } = useApp()
    const params = useParams()
    const templateId = params?.id

    const [workoutName, setWorkoutName] = useState(() => {
        if (typeof window !== 'undefined' && templateId) {
            const saved = sessionStorage.getItem(`zalai_edit_template_name_${templateId}`)
            return saved || ''
        }
        return ''
    })
    const [isSaving, setIsSaving] = useState(false)
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(true)

    const [dbExercises, setDbExercises] = useState([])
    const [isLoadingDb, setIsLoadingDb] = useState(true)

    const [isModalOpen, setIsModalOpen] = useState(() => {
        if (typeof window !== 'undefined' && templateId) {
            return sessionStorage.getItem(`zalai_edit_template_modal_open_${templateId}`) === 'true'
        }
        return false
    })
    const [activeExerciseId, setActiveExerciseId] = useState(() => {
        if (typeof window !== 'undefined' && templateId) {
            const saved = sessionStorage.getItem(`zalai_edit_template_active_id_${templateId}`)
            return saved ? Number(saved) : null
        }
        return null
    })
    const [searchQuery, setSearchQuery] = useState(() => {
        if (typeof window !== 'undefined' && templateId) {
            return sessionStorage.getItem(`zalai_edit_template_search_${templateId}`) || ''
        }
        return ''
    })
    const [activeCategory, setActiveCategory] = useState(() => {
        if (typeof window !== 'undefined' && templateId) {
            return sessionStorage.getItem(`zalai_edit_template_category_${templateId}`) || 'Усі'
        }
        return 'Усі'
    })
    const [isCreatingCustom, setIsCreatingCustom] = useState(false)

    const [exercises, setExercises] = useState(() => {
        if (typeof window !== 'undefined' && templateId) {
            const saved = sessionStorage.getItem(`zalai_edit_template_exercises_${templateId}`)
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch(e) { console.error('Error parsing saved edit template exercises') }
            }
        }
        return []
    })

    // --- Збереження стану в sessionStorage ---
    useEffect(() => {
        if (templateId && workoutName !== '') {
            sessionStorage.setItem(`zalai_edit_template_name_${templateId}`, workoutName)
        }
    }, [workoutName, templateId])

    useEffect(() => {
        if (templateId && exercises.length > 0) {
            sessionStorage.setItem(`zalai_edit_template_exercises_${templateId}`, JSON.stringify(exercises))
        }
    }, [exercises, templateId])

    useEffect(() => {
        if (templateId) {
            sessionStorage.setItem(`zalai_edit_template_modal_open_${templateId}`, isModalOpen)
            if (activeExerciseId) sessionStorage.setItem(`zalai_edit_template_active_id_${templateId}`, activeExerciseId)
            else sessionStorage.removeItem(`zalai_edit_template_active_id_${templateId}`)
            sessionStorage.setItem(`zalai_edit_template_search_${templateId}`, searchQuery)
            sessionStorage.setItem(`zalai_edit_template_category_${templateId}`, activeCategory)
        }
    }, [isModalOpen, activeExerciseId, searchQuery, activeCategory, templateId])

    const clearSessionStorage = () => {
        if (!templateId) return
        sessionStorage.removeItem(`zalai_edit_template_name_${templateId}`)
        sessionStorage.removeItem(`zalai_edit_template_exercises_${templateId}`)
        sessionStorage.removeItem(`zalai_edit_template_modal_open_${templateId}`)
        sessionStorage.removeItem(`zalai_edit_template_active_id_${templateId}`)
        sessionStorage.removeItem(`zalai_edit_template_search_${templateId}`)
        sessionStorage.removeItem(`zalai_edit_template_category_${templateId}`)
    }

    const categories = ['Усі', 'Груди', 'Спина', 'Ноги', 'Плечі', 'Руки', 'Прес', 'Кардіо', 'Розтяжка', 'Інше']

    // Load DB exercises
    useEffect(() => {
        if (storedExercises?.length > 0) {
            setDbExercises(storedExercises)
            setIsLoadingDb(false)
        } else {
            // Фолбек
            const fetchExercises = async () => {
                setIsLoadingDb(true)
                const { data, error } = await supabase.from('exercises').select('*').order('name', { ascending: true })
                if (data) {
                    setDbExercises(data)
                    setStoredExercises(data)
                }
                setIsLoadingDb(false)
            }
            fetchExercises()
        }
    }, [storedExercises, setStoredExercises])

    // Load existing template data
    useEffect(() => {
        if (!templateId) return

        const loadTemplate = async () => {
            setIsLoadingTemplate(true)

            // Перевіряємо, чи є відновлений стан (ми його вже завантажили в useState, просто перевіряємо, чи треба скіпати DB)
            if (typeof window !== 'undefined' && sessionStorage.getItem(`zalai_edit_template_exercises_${templateId}`)) {
                setIsLoadingTemplate(false)
                return
            }

            // Спочатку перевіряємо, чи є цей шаблон вже в кеші AppContext
            const cachedTemplate = templates?.find(t => t.id === templateId)
            
            if (cachedTemplate && cachedTemplate.workout_exercises) {
                setWorkoutName(cachedTemplate.name)
                
                if (cachedTemplate.workout_exercises.length > 0) {
                    const loadedExercises = cachedTemplate.workout_exercises.sort((a,b) => a.order - b.order).map(we => {
                        const setsForWe = we.sets?.sort((a,b) => a.order - b.order) || []
                        return {
                            id: we.id,
                            exercise_id: we.exercise_id,
                            name: we.exercises?.name,
                            type: we.exercises?.type,
                            superset_id: we.superset_id,
                            note: we.note || '',
                            sets: setsForWe.length > 0 ? setsForWe.map(s => ({
                                id: s.id,
                                weight: s.weight || '',
                                reps: s.reps || '',
                                time_minutes: s.time_seconds ? Math.floor(s.time_seconds / 60) : '',
                                time_seconds: s.time_seconds ? s.time_seconds % 60 : '',
                                set_type: 'normal',
                                note: s.note || ''
                            })) : [{ id: Date.now() + Math.random(), weight: '', reps: '', time_minutes: '', time_seconds: '', set_type: 'normal', note: '' }]
                        }
                    })
                    setExercises(loadedExercises)
                } else {
                    setExercises([{ id: Date.now(), exercise_id: null, name: '', note: '', type: 'weight_reps', superset_id: null, sets: [{ id: Date.now() + 1, weight: '', reps: '', time_minutes: '', time_seconds: '', set_type: 'normal', note: '' }] }])
                }
                setIsLoadingTemplate(false)
                return
            }

            // Фолбек: Завантаження з бази, якщо немає в кеші (прямий лінк, перезавантаження сторінки)
            // 1. Fetch workout name
            const { data: wData } = await supabase.from('workouts').select('*').eq('id', templateId).single()
            if (wData) setWorkoutName(wData.name)

            // 2. Fetch workout exercises
            const { data: weData } = await supabase.from('workout_exercises').select('*, exercises(name, type)').eq('workout_id', templateId).order('order', { ascending: true })

            if (weData && weData.length > 0) {
                // 3. Fetch sets
                const { data: sData } = await supabase.from('sets').select('*').in('workout_exercise_id', weData.map(e => e.id)).order('order', { ascending: true })

                const loadedExercises = weData.map((we, index) => {
                    const setsForWe = sData?.filter(s => s.workout_exercise_id === we.id) || []

                    return {
                        id: we.id,
                        exercise_id: we.exercise_id,
                        name: we.exercises?.name,
                        type: we.exercises?.type,
                        superset_id: we.superset_id,
                        note: we.note || '',
                        sets: setsForWe.length > 0 ? setsForWe.map(s => ({
                            id: s.id,
                            weight: s.weight || '',
                            reps: s.reps || '',
                            time_minutes: s.time_seconds ? Math.floor(s.time_seconds / 60) : '',
                            time_seconds: s.time_seconds ? s.time_seconds % 60 : '',
                            set_type: 'normal',
                            note: s.note || ''
                        })) : [{ id: Date.now() + Math.random(), weight: '', reps: '', time_minutes: '', time_seconds: '', set_type: 'normal', note: '' }]
                    }
                })
                setExercises(loadedExercises)
            } else {
                // порожній шаблон
                setExercises([{ id: Date.now(), exercise_id: null, name: '', note: '', type: 'weight_reps', superset_id: null, sets: [{ id: Date.now() + 1, weight: '', reps: '', time_minutes: '', time_seconds: '', set_type: 'normal', note: '' }] }])
            }

            setIsLoadingTemplate(false)
        }

        loadTemplate()
    }, [templateId, templates])

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

    const handleSaveTemplate = async (shouldRedirect = true) => {
        if (!workoutName.trim()) { alert('Введіть назву тренування!'); return }
        if (exercises.length === 0 || !exercises[0].exercise_id) { alert('Додайте хоча б одну вправу!'); return }
        setIsSaving(true)

        try {
            // 1. Update workout name
            const { error: wError } = await supabase.from('workouts')
                .update({ name: workoutName.trim() })
                .eq('id', templateId)
            if (wError) throw wError

            // 2. We delete existing workout_exercises for this workout (which cascades and deletes sets OR we delete sets first if no cascade)
            // To be strictly safe, we delete sets linked to existing workout_exercises first
            const { data: existingWe } = await supabase.from('workout_exercises').select('id').eq('workout_id', templateId)
            if (existingWe && existingWe.length > 0) {
                await supabase.from('sets').delete().in('workout_exercise_id', existingWe.map(we => we.id))
                await supabase.from('workout_exercises').delete().eq('workout_id', templateId)
            }

            // 3. Insert new exercises and sets
            for (let i = 0; i < exercises.length; i++) {
                const ex = exercises[i]
                if (!ex.exercise_id) continue
                const { data: weData, error: weError } = await supabase.from('workout_exercises')
                    .insert([{ workout_id: templateId, exercise_id: ex.exercise_id, order: i + 1, superset_id: ex.superset_id?.startsWith('super-') ? null : ex.superset_id }])
                    .select().single()
                if (weError) throw weError

                const setsToInsert = ex.sets.map((set, si) => ({
                    workout_exercise_id: weData.id,
                    order: si + 1,
                    weight: Number(set.weight) || null,
                    reps: Number(set.reps) || null,
                    time_seconds: ((Number(set.time_minutes) || 0) * 60 + (Number(set.time_seconds) || 0)) || null,
                    note: ex.note || null,
                    is_completed: false
                }))
                if (setsToInsert.length > 0) {
                    const { error: setsError } = await supabase.from('sets').insert(setsToInsert)
                    if (setsError) throw setsError
                }
            }
            
            // Після успішного оновлення в базі, оновлюємо глобальний кеш
            if (setTemplates || setPrograms) {
                const { data: updatedWorkout } = await supabase
                    .from('workouts')
                    .select('*, workout_exercises(id, exercises(name))')
                    .eq('id', templateId)
                    .single()
                
                if (updatedWorkout) {
                    if (updatedWorkout.program_id && setPrograms) {
                        setPrograms(prev => prev.map(p => {
                            if (p.id === updatedWorkout.program_id) {
                                return {
                                    ...p,
                                    workouts: p.workouts?.map(w => w.id === templateId ? updatedWorkout : w)
                                }
                            }
                            return p
                        }))
                    } else if (setTemplates) {
                        setTemplates(prev => {
                            const idx = prev.findIndex(t => t.id === templateId)
                            if (idx > -1) {
                                const newArr = [...prev]
                                newArr[idx] = updatedWorkout
                                return newArr
                            }
                            return [updatedWorkout, ...prev]
                        })
                    }
                }
            }
            
            clearSessionStorage()

            if (shouldRedirect) router.push('/programs')
            return true
        } catch (error) {
            console.error('Помилка збереження:', error.message || error)
            alert(`Помилка: ${error.message || 'невідома помилка'}`)
            return false
        } finally { setIsSaving(false) }
    }

    const handleStartWorkout = async () => {
        // Save template first, then start
        const success = await handleSaveTemplate(false)
        if (success === false) return // handleSaveTemplate can return false if validation fails
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { data: newWorkoutId, error } = await supabase.rpc('start_workout_from_template', {
                p_template_id: templateId, p_user_id: user.id, p_workout_name: workoutName.trim()
            })
            if (error) throw error
            router.push(`/workout/${newWorkoutId}`)
        } catch (error) {
            console.error(error)
            alert('Не вдалося запустити тренування.')
        }
    }

    const filteredDbExercises = dbExercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = activeCategory === 'Усі' ? true : ex.muscle === activeCategory
        return matchesSearch && matchesCategory
    })
    const isExactMatch = dbExercises.some(ex => ex.name.toLowerCase() === searchQuery.trim().toLowerCase())

    if (isLoadingTemplate) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Завантаження шаблону...
            </div>
        )
    }

    return (
        <main className="min-h-screen text-white relative">
            {/* ХЕДЕР */}
            <header className="sticky top-0 z-30 px-4 py-3 bg-[#080b10]/90 backdrop-blur-xl border-b border-white/[0.05]">
                <div className="mx-auto w-full max-w-md flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="shrink-0 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <input
                        type="text"
                        placeholder="Назва тренування..."
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        className="flex-1 bg-transparent text-lg font-bold tracking-tight text-white outline-none placeholder:text-white/20 min-w-0"
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
                    className="w-full py-4 rounded-2xl neural-card text-white/40 font-bold tracking-wider text-xs hover:border-white/15 hover:text-white/80 transition-all flex items-center justify-center gap-2 group"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Додати вправу
                </button>

                {/* Три кнопки: Зберегти, Почати та Закрити */}
                <div className="flex flex-col gap-3 mt-2 mb-12">
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 px-4 py-4 rounded-2xl font-bold tracking-wider text-xs border border-white/10 text-white/60 hover:bg-white/5 transition-all"
                        >
                            ЗАКРИТИ
                        </button>

                        <button
                            onClick={handleSaveTemplate}
                            disabled={isSaving}
                            className={`flex-1 flex items-center justify-center py-4 rounded-2xl font-bold tracking-wider text-xs transition-all ${isSaving
                                ? 'bg-white/[0.03] text-white/30 border border-white/[0.06] cursor-not-allowed'
                                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                }`}
                        >
                            {isSaving ? 'Збереження...' : 'Зберегти'}
                        </button>
                    </div>

                    <button
                        onClick={handleStartWorkout}
                        disabled={isSaving}
                        className={`w-full flex items-center justify-center gap-2 py-5 rounded-2xl font-bold tracking-[0.2em] text-sm overflow-hidden active:scale-[0.98] transition-all ${isSaving
                            ? 'bg-[#A3E635]/30 text-[#080b10] cursor-not-allowed'
                            : 'bg-[#A3E635] text-[#080b10] hover:shadow-[0_0_40px_rgba(163,230,53,0.3)] hover:bg-[#b8f053]'
                            }`}
                    >
                        ПОЧАТИ ТРЕНУВАННЯ
                        <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                </div>
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
                isLoadingExercises={isLoadingDb}
                isExactMatch={isExactMatch}
                handleCreateCustomExercise={handleCreateCustomExercise}
                isCreatingCustom={isCreatingCustom}
                user={user}
                handleDeleteCustomExercise={handleDeleteCustomExercise}
                onInfoClick={(exId) => {
                    router.push(`/exercises/${exId}`)
                }}
            />
        </main>
    )
}
