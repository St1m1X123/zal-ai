'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext()

export function AppProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [storedExercises, setStoredExercises] = useState([])
    const [templates, setTemplates] = useState([])
    const [programs, setPrograms] = useState([])
    const [recentWorkouts, setRecentWorkouts] = useState([])
    const [activityDays, setActivityDays] = useState(new Set())
    const [activityMap, setActivityMap] = useState({})
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, totalSets: 0, streak: 0 })
    const [prs, setPRs] = useState([])
    const [streakWeeks, setStreakWeeks] = useState(0)
    const [activeWorkoutsCache, setActiveWorkoutsCache] = useState({})

    const hasFetched = useRef(false)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user || null)
            if (!session?.user) setLoading(false)
        }
        checkUser()

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null)
            if (!session?.user) {
                setProfile(null)
                setLoading(false)
            }
        })
        return () => { authListener.subscription.unsubscribe() }
    }, [])

    useEffect(() => {
        if (!user || hasFetched.current) return

        const fetchData = async () => {
            hasFetched.current = true
            setLoading(true)

            try {
                const [
                    { data: exData },
                    { data: profData },
                    { data: templData },
                    { data: progData },
                    { data: historyData },
                    { data: actData }
                ] = await Promise.all([
                    supabase.from('exercises').select('*').order('name', { ascending: true }),
                    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
                    supabase.from('workouts')
                        .select(`*, workout_exercises(*, exercises(name, type), sets(*))`)
                        .eq('is_template', true)
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false }),
                    supabase.from('programs')
                        .select('*, workouts(*, workout_exercises(id, exercises(name)))')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false }),
                    supabase.from('workouts').select('*').eq('is_template', false).eq('status', 'completed').eq('user_id', user.id).order('date', { ascending: false }).limit(3),
                    supabase.from('workouts').select('date').eq('is_template', false).eq('status', 'completed').eq('user_id', user.id).gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                ])

                setStoredExercises(exData || [])
                setProfile(profData)
                setTemplates(templData || [])
                
                let loadedPrograms = progData || []
                loadedPrograms.forEach(p => {
                    p.workouts?.sort((a, b) => a.id.localeCompare(b.id))
                })
                setPrograms(loadedPrograms)

                setRecentWorkouts(historyData || [])
                setActivityDays(new Set(actData?.map(w => w.date) || []))

                // --- Детальна статистика для профілю (Раніше була в profile/page.js) ---
                const { data: allWorkouts } = await supabase.from('workouts')
                    .select('id, date, status')
                    .eq('user_id', user.id).eq('is_template', false).eq('status', 'completed')
                    .order('date', { ascending: false })

                if (allWorkouts?.length > 0) {
                    const now = new Date()
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                    const thisMonth = allWorkouts.filter(w => w.date >= monthStart).length

                    const map = {}
                    allWorkouts.forEach(w => { map[w.date] = (map[w.date] || 0) + 1 })
                    setActivityMap(map)

                    // Total sets
                    const workoutIds = allWorkouts.map(w => w.id)
                    let totalSetsCount = 0
                    const { data: weDataForStats } = await supabase.from('workout_exercises').select('id').in('workout_id', workoutIds)
                    if (weDataForStats?.length > 0) {
                        const { count: setsCount } = await supabase.from('sets').select('id', { count: 'exact', head: true })
                            .in('workout_exercise_id', weDataForStats.map(w => w.id)).eq('is_completed', true)
                        totalSetsCount = setsCount || 0
                    }

                    // Daily Streak (на відміну від тижневого streakWeeks)
                    let dailyStreak = 0
                    const dates = [...new Set(allWorkouts.map(w => w.date))].sort().reverse()
                    const today = new Date().toISOString().split('T')[0]
                    let check = today
                    for (const d of dates) {
                        if (d === check) {
                            dailyStreak++;
                            const prev = new Date(check); prev.setDate(prev.getDate() - 1)
                            check = prev.toISOString().split('T')[0]
                        } else break
                    }

                    setStats({ total: allWorkouts.length, thisMonth, totalSets: totalSetsCount, streak: dailyStreak })

                    // PRs
                    if (weDataForStats?.length > 0) {
                        const { data: allWEs } = await supabase
                            .from('workout_exercises').select('id, exercise_id, exercises(name, muscle)').in('workout_id', workoutIds)
                        const { data: prSets } = await supabase
                            .from('sets').select('weight, workout_exercise_id').in('workout_exercise_id', weDataForStats.map(we => we.id)).eq('is_completed', true).gt('weight', 0)

                        const prMap = {}
                        prSets?.forEach(s => {
                            const we = allWEs?.find(we => we.id === s.workout_exercise_id)
                            if (!we) return
                            const { exercise_id, exercises: ex } = we
                            if (!prMap[exercise_id] || s.weight > prMap[exercise_id].weight) {
                                prMap[exercise_id] = { name: ex.name, muscle: ex.muscle, weight: s.weight }
                            }
                        })
                        setPRs(Object.values(prMap).sort((a, b) => b.weight - a.weight).slice(0, 8))
                    }
                }

                // Calculate Weekly Streak (streakWeeks)
                if (allWorkouts?.length > 0) {
                    const getWeekNumber = (d) => {
                        const date = new Date(d)
                        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
                        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
                        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7) + (date.getUTCFullYear() * 100)
                    }
                    const weeks = [...new Set(allWorkouts.map(w => getWeekNumber(w.date)))].sort((a, b) => b - a)
                    const currentWeek = getWeekNumber(new Date())
                    let sw = 0
                    if (weeks.includes(currentWeek) || weeks.includes(currentWeek - 1)) {
                        sw = 1
                        let expectedWeek = weeks[0]
                        for (let i = 1; i < weeks.length; i++) {
                            if (weeks[i] === expectedWeek - 1) { sw++; expectedWeek-- }
                            else break
                        }
                    }
                    setStreakWeeks(sw)
                }
            } catch (e) {
                console.error('Error fetching global data:', e)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user])

    const value = {
        user,
        profile,
        loading,
        storedExercises,
        setStoredExercises,
        templates,
        programs,
        setPrograms,
        recentWorkouts,
        activityDays,
        activityMap,
        stats,
        prs,
        streakWeeks,
        activeWorkoutsCache,
        setActiveWorkoutsCache,
        setProfile,
        setRecentWorkouts,
        setActivityDays,
        setActivityMap,
        setStats,
        setPRs
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
    const context = useContext(AppContext)
    if (!context) throw new Error('useApp must be used within AppProvider')
    return context
}
