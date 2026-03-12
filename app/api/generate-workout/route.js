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
    // 1. Точний збіг
    let found = exercises.find(e => e.name.toLowerCase() === n)
    if (found) return found
    // 2. Частковий збіг (ім'я містить або містить у ньому)
    found = exercises.find(e => e.name.toLowerCase().includes(n) || n.includes(e.name.toLowerCase()))
    if (found) return found
    // 3. Перший збіг за першим словом
    const firstWord = n.split(' ')[0]
    found = exercises.find(e => e.name.toLowerCase().startsWith(firstWord))
    return found || null
}

// ─── Локалізованні назви ──────────────────────────────────────────────────────
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
const LOC_MAP = {
    gym: 'тренажерний зал',
    home: 'домашні тренування',
    street: 'вуличне тренування (вулиця, турнік)',
}

// ─── Основний обробник ────────────────────────────────────────────────────────
export async function POST(request) {
    try {
        // 1. Перевірка API ключа
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY не знайдено в .env.local' }, { status: 500 })
        }

        // 2. Отримуємо сесію
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

        // 3. Профіль юзера
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (!profile) {
            return NextResponse.json({ error: 'Профіль не знайдено. Пройди онбординг.' }, { status: 404 })
        }

        // ─── ПЕРЕВІРКА PRO СТАТУСУ ───────────────────────────────────────────
        if (!profile.is_pro) {
            return NextResponse.json({
                error: 'AI-генерація тренувань доступна тільки в Neural Pro.',
                code: 'PRO_REQUIRED'
            }, { status: 403 })
        }

        // 4. Список вправ (фільтруємо за локацією)
        const { data: allExercises } = await supabase
            .from('exercises')
            .select('id, name, muscle, type')
            .order('name', { ascending: true })

        if (!allExercises?.length) {
            return NextResponse.json({ error: 'База вправ порожня' }, { status: 500 })
        }

        // 5. Формуємо список вправ для промпту (скорочений)
        // Групуємо по м'язах для кращого контексту
        const exercisesByMuscle = {}
        allExercises.forEach(ex => {
            if (!exercisesByMuscle[ex.muscle]) exercisesByMuscle[ex.muscle] = []
            exercisesByMuscle[ex.muscle].push(ex.name)
        })
        const exerciseListText = Object.entries(exercisesByMuscle)
            .map(([muscle, names]) => `${muscle}: ${names.slice(0, 20).join(', ')}`)
            .join('\n')

        // 6. Будуємо промпт
        const goal = GOAL_MAP[profile.goal] || profile.goal || 'загальна фізична підготовка'
        const exp = EXP_MAP[profile.experience] || profile.experience || 'середній рівень'
        const loc = LOC_MAP[profile.location] || 'тренажерний зал'
        const duration = profile.duration_min || 60
        const daysPerWeek = profile.days_per_week || 3
        const healthTags = profile.health_tags?.length ? `Обмеження/травми: ${profile.health_tags.join(', ')}.` : ''
        const bodyInfo = profile.weight_kg && profile.height_cm
            ? `Вага: ${profile.weight_kg} кг, зріст: ${profile.height_cm} см.`
            : ''

        const prompt = `Ти — персональний AI-тренер. Склади ОДНЕ тренування на сьогодні.

ПРОФІЛЬ АТЛЕТА:
- Ціль: ${goal}
- Рівень: ${exp}
- Локація: ${loc}
- Тривалість тренування: ${duration} хвилин
- Тренується: ${daysPerWeek} рази на тиждень
${bodyInfo}
${healthTags}

ДОСТУПНІ ВПРАВИ (використовуй ТІЛЬКИ з цього списку, точно такі назви):
${exerciseListText}

ВИМОГИ:
1. Обери 5-7 вправ відповідно до цілі та рівня
2. Для кожної вправи вкажи кількість підходів та повторень
3. Враховуй обмеження/травми якщо є
4. Уникай одних і тих самих м'язових груп без відпочинку
5. Починай з розминки, завершуй основними вправами

ВІДПОВІДАЙ ТІЛЬКИ валідним JSON (без зайвого тексту, без \`\`\`):
{
  "workout_name": "Назва тренування",
  "focus": "Основний фокус",
  "exercises": [
    {
      "exercise_name": "Точна назва з доступних вправ",
      "sets": 3,
      "reps": 12,
      "rest_seconds": 90,
      "note": "Порада до вправи одним реченням"
    }
  ]
}`

        // 7. Викликаємо Gemini (gemini-2.0-flash-lite — безкоштовний, швидкий)
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

        if (!aiResult?.exercises?.length) {
            return NextResponse.json({ error: 'AI повернув порожній план' }, { status: 500 })
        }

        // 8. Зіставляємо вправи з БД
        const matchedExercises = []
        for (const ex of aiResult.exercises) {
            const found = findExercise(ex.exercise_name, allExercises)
            if (found) {
                matchedExercises.push({ ...ex, dbExercise: found })
            } else {
                console.warn(`Вправа не знайдена: ${ex.exercise_name}`)
            }
        }

        if (matchedExercises.length === 0) {
            return NextResponse.json({ error: 'Жодна вправа не знайдена в БД' }, { status: 500 })
        }

        // 9. Зберігаємо тренування
        const today = new Date().toISOString().split('T')[0]
        const workoutName = aiResult.workout_name || '✦ AI Тренування'

        const { data: workout, error: wErr } = await supabase
            .from('workouts')
            .insert({
                user_id: user.id,
                name: workoutName,
                date: today,
                status: 'in_progress',
                is_template: false,
            })
            .select()
            .single()

        if (wErr || !workout) {
            return NextResponse.json({ error: `Помилка збереження: ${wErr?.message}` }, { status: 500 })
        }

        // 10. BATCH INSERT — усі workout_exercises за 1 запит (замість N запитів)
        const weToInsert = matchedExercises.map((ex, i) => ({
            workout_id: workout.id,
            exercise_id: ex.dbExercise.id,
            order: i + 1,
        }))

        const { data: weRows, error: weErr } = await supabase
            .from('workout_exercises')
            .insert(weToInsert)
            .select()

        if (weErr || !weRows?.length) {
            return NextResponse.json({ error: `Помилка вправ: ${weErr?.message}` }, { status: 500 })
        }

        // 11. BATCH INSERT — усі підходи за 1 запит (замість N запитів)
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
                    reps: ex.reps || 0,
                    time_seconds: 0,
                    is_completed: false,
                })
            }
        }

        if (allSets.length > 0) {
            await supabase.from('sets').insert(allSets)
        }

        return NextResponse.json({
            workoutId: workout.id,
            workoutName,
            focus: aiResult.focus || '',
            exerciseCount: matchedExercises.length,
        })
    } catch (e) {
        console.error('generate-workout fatal:', e)
        return NextResponse.json({ error: `Серверна помилка: ${e.message}` }, { status: 500 })
    }
}
