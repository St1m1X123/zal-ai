import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// ─── Server Supabase клієнт ───────────────────────────────────────────────────
async function createSupabase() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(toSet) {
                    try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
                    catch { /* read-only context */ }
                },
            },
        }
    )
}

// ─── Нечіткий пошук вправи в БД ──────────────────────────────────────────────
function findExercise(name, exercises) {
    const n = name.toLowerCase().trim()
    let found = exercises.find(e => e.name.toLowerCase() === n)
    if (found) return found
    found = exercises.find(e => e.name.toLowerCase().includes(n) || n.includes(e.name.toLowerCase()))
    if (found) return found
    const firstWord = n.split(' ')[0]
    found = exercises.find(e => e.name.toLowerCase().startsWith(firstWord))
    return found || null
}

const GOAL_MAP = {
    weight_loss: 'схуднення і жироспалювання (силово-кардіо мікс)',
    muscle_gain: "набір м'язової маси та гіпертрофія",
    recomposition: "рекомпозиція тіла (одночасно зменшити жир та набрати м'язи)",
    maintenance: 'підтримка форми та загальний фітнес',
}

const EXP_MAP = {
    beginner: 'початківець (менше 6 місяців)',
    intermediate: 'середній рівень (6 місяців – 2 роки)',
    advanced: 'досвідчений (більше 2 років)',
}

// ─── Основний обробник ────────────────────────────────────────────────────────
export async function POST(request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY не знайдено в .env.local' }, { status: 500 })
        }

        const body = await request.json().catch(() => ({}))
        const supabase = await createSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 })
        }

        // ─── ПЕРЕВІРКА WHITELIST (WHITELIST SECURITY) ──────────────────────
        const admins = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : []
        if (admins.length > 0 && !admins.includes(user.email.toLowerCase())) {
            return NextResponse.json({
                error: 'Твій email не в списку дозволених для AI-генерації.',
                code: 'WHITELIST_REQUIRED'
            }, { status: 403 })
        }

        // 1. Профіль юзера для бекапу та перевірки Pro
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        // ─── ПЕРЕВІРКА PRO СТАТУСУ ───────────────────────────────────────────
        if (!profile?.is_pro) {
            return NextResponse.json({
                error: 'AI-генерація доступна тільки в Neural Pro.',
                code: 'PRO_REQUIRED'
            }, { status: 403 })
        }

        // 2. Список вправ 
        const { data: allExercises } = await supabase
            .from('exercises')
            .select('id, name, muscle, type')
            .order('name', { ascending: true })

        if (!allExercises?.length) {
            return NextResponse.json({ error: 'База вправ порожня' }, { status: 500 })
        }

        // 3. Групуємо по м'язах (для промпту)
        const exercisesByMuscle = {}
        allExercises.forEach(ex => {
            if (!exercisesByMuscle[ex.muscle]) exercisesByMuscle[ex.muscle] = []
            exercisesByMuscle[ex.muscle].push(ex.name)
        })
        const exerciseListText = Object.entries(exercisesByMuscle)
            .map(([muscle, names]) => `${muscle}: ${names.slice(0, 12).join(', ')}`)
            .join('\n')

        // 4. Параметри генерації (з body.config або fallback на профілі)
        const config = body.config || {}

        const rawGoal = config.goal || body.goal || profile?.goal || 'загальна фізична підготовка'
        const goal = GOAL_MAP[rawGoal] || rawGoal

        const rawLevel = config.experience || body.level || profile?.experience || 'середній рівень'
        const exp = EXP_MAP[rawLevel] || rawLevel

        const daysPerWeek = Number(config.days_per_week || body.days_per_week) || profile?.days_per_week || 3

        const location = config.location || profile?.location || 'gym'
        const equipment = config.equipment || profile?.equipment || []
        const muscleFocus = config.muscle_focus || []
        const style = config.style || 'balanced'
        const duration = config.duration || profile?.duration_min || 60
        const healthTags = config.health_tags || profile?.health_tags || []
        const selectedExercises = config.selected_exercises || []

        // Останні тренування (щоб AI знав що уникати або як балансувати)
        const { data: recentWorkouts } = await supabase
            .from('workouts')
            .select('name, date')
            .eq('user_id', user.id)
            .eq('is_template', false)
            .order('date', { ascending: false })
            .limit(3)

        let recentContext = ''
        if (recentWorkouts?.length) {
            recentContext = `ОСТАННІ ТРЕНУВАННЯ КОРИСТУВАЧА:\n` + recentWorkouts.map(w => `- ${w.date}: ${w.name}`).join('\n')
        }

        const prompt = `Ти — експертний AI-фітнес-тренер. Створи структурну тижневу програму тренувань.

ПРОФІЛЬ АТЛЕТА:
- Ціль: ${goal}
- Рівень піготовки: ${exp}
- Кількість тренувань на тиждень: ${daysPerWeek}
- Локація: ${location === 'gym' ? 'Тренажерний зал' : 'Дім / Вулиця'}
- Доступне обладнання: ${equipment.length > 0 ? equipment.join(', ') : 'Власна вага'}
- Фокус (пріоритетні групи): ${muscleFocus.length > 0 ? muscleFocus.join(', ') : 'Всі групи м\'язів порівну'}
- Стиль тренування: ${style === 'strength' ? 'Силовий (низькі повторення, великі ваги)' : style === 'pumping' ? 'Пампінг (висока інтенсивність, гіпертрофія)' : 'Збалансований'}
- Тривалість одного тренування: ~${duration} хвилин
- Травми/Обмеження: ${healthTags.length > 0 ? healthTags.join(', ') : 'Немає відомих обмежень'}
- ОБОВ'ЯЗКОВІ ВПРАВИ (включи їх у програму): ${selectedExercises.length > 0 ? selectedExercises.join(', ') : 'На розсуд AI'}

${recentContext}

ДОСТУПНІ ВПРАВИ В БАЗІ (використовуй ТОЧНО ці назви, інакше система їх не знайде):
${exerciseListText}

ВИМОГИ:
1. Створи програму, яка складається рівно з ${daysPerWeek} тренувальних днів.
2. Травми: Якщо є травма (наприклад, коліна), НЕ додавай вправи, що дають на них пряме навантаження (наприклад, замість стрибків — кроки).
3. Обладнання: Використовуй ТІЛЬКИ те обладнання, що вказано. Якщо вказано "Власна вага", не пропонуй жим гантелей.
4. Фокус: Якщо вказано м'язи у фокусі, додай на 1-2 вправи більше на ці групи в кожному відповідному дні.
5. Пріоритет вправ: Якщо користувач вказав "ОБОВ'ЯЗКОВІ ВПРАВИ", обов'язково розподіли їх по відповідних днях програми.
6. Для кожного дня підбери 5-7 вправ. Вправи ОБОВ'ЯЗКОВО вибирай тільки з наданого списку. Роби баланс м'язових груп.
4. Вкажи кількість підходів (sets). Для силових вправ вказуй повторення (reps), для вправ на час (планка, кардіо) вказуй тривалість (duration_seconds).
5. Вкажи час відпочинку (rest_seconds).

ВІДПОВІДАЙ ТІЛЬКИ валідним JSON (без Markdown-форматування, поверни лише чистий JSON):
{
  "program_name": "Назва програми (напр: 3-денний спліт для набору маси)",
  "program_goal": "Короткий опис фокусу цієї програми",
  "workouts": [
    {
      "day_number": 1,
      "name": "День 1: Назва фокусу",
      "focus": "М'язи, які тренуються",
      "exercises": [
        {
          "exercise_name": "Точна назва вправи з бази",
          "sets": 3,
          "reps": 12,
          "duration_seconds": 0,
          "rest_seconds": 90
        }
      ]
    }
  ]
}`

        // 5. Виклик Gemini 2.5 Flash
        let aiResult
        try {
            const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.7 },
                    }),
                }
            )
            if (!geminiRes.ok) {
                const errBody = await geminiRes.text()
                throw new Error(`Gemini HTTP ${geminiRes.status}: ${errBody}`)
            }
            const geminiData = await geminiRes.json()
            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
            if (!text) throw new Error('Gemini повернув порожній текст')
            const clean = text.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim()
            aiResult = JSON.parse(clean)
        } catch (e) {
            console.error('Gemini error:', e)
            return NextResponse.json({ error: `Помилка AI: ${e.message}` }, { status: 500 })
        }

        if (!aiResult?.workouts?.length) {
            return NextResponse.json({ error: 'AI не сформував тренування' }, { status: 500 })
        }

        // 6. Створюємо Програму в БД
        const { data: program, error: pErr } = await supabase
            .from('programs')
            .insert({
                user_id: user.id,
                name: aiResult.program_name || 'AI Програма',
                goal: aiResult.program_goal || goal,
                days_per_week: daysPerWeek
            })
            .select()
            .single()

        if (pErr || !program) {
            return NextResponse.json({ error: `Помилка створення програми: ${pErr?.message}` }, { status: 500 })
        }

        // 7. Зберігаємо всі тренування, вправи та підходи
        let totalWorkoutsSaved = 0

        for (const w of aiResult.workouts) {
            // Фільтруємо/мапимо вправи
            const matchedExercises = Object.values(w.exercises).reduce((acc, ex) => {
                const found = findExercise(ex.exercise_name, allExercises)
                if (found) acc.push({ ...ex, dbExercise: found })
                return acc
            }, [])

            if (matchedExercises.length === 0) continue // Пропускаємо день без підходящих вправ

            // Створюємо шаблонне тренування, прикріплене до програми
            const { data: workout, error: wErr } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    program_id: program.id,
                    name: w.name || `День ${w.day_number}`,
                    date: new Date().toISOString().split('T')[0], // Дата створення
                    status: 'completed', // Шаблонні тренування не показуються як активні
                    is_template: true, // ВАЖЛИВО! Це шаблон, а не реальне тренування
                })
                .select()
                .single()

            if (wErr || !workout) continue

            // Додаємо вправи (batch)
            const weToInsert = matchedExercises.map((ex, i) => ({
                workout_id: workout.id,
                exercise_id: ex.dbExercise.id,
                order: i + 1,
            }))

            const { data: weRows, error: weErr } = await supabase
                .from('workout_exercises')
                .insert(weToInsert)
                .select()

            if (!weErr && weRows?.length) {
                // Додаємо підходи (batch)
                const allSets = []
                for (let i = 0; i < matchedExercises.length; i++) {
                    const ex = matchedExercises[i]
                    const we = weRows[i]
                    if (!we) continue
                    for (let si = 0; si < (ex.sets || 3); si++) {
                        allSets.push({
                            workout_exercise_id: we.id,
                            order: si + 1,
                            weight: 0,
                            reps: ex.dbExercise.type === 'time' ? 0 : (ex.reps || 0),
                            time_seconds: ex.dbExercise.type === 'time' ? (ex.duration_seconds || 60) : 0,
                            is_completed: false,
                        })
                    }
                }
                if (allSets.length > 0) {
                    await supabase.from('sets').insert(allSets)
                }
            }

            totalWorkoutsSaved++
        }

        return NextResponse.json({
            success: true,
            programId: program.id,
            programName: program.name,
            workoutsSaved: totalWorkoutsSaved
        })

    } catch (e) {
        console.error('generate-program fatal:', e)
        return NextResponse.json({ error: `Серверна помилка: ${e.message}` }, { status: 500 })
    }
}
