/**
 * ZalAI — Скрипт імпорту вправ з free-exercise-db
 *
 * Запуск: node scripts/import-exercises.js
 *
 * Оптимізована стратегія:
 *  - Перекладаємо ТІЛЬКИ назву вправи (мінімум токенів)
 *  - Інструкції зберігаємо в оригіналі (англійська ~ зрозуміла у фітнесі)
 *  - Чанк: 5 назв за раз → ~30 токенів вхід, дуже малий ризик 429
 *  - ~175 чанків × 2 сек = ~6 хвилин
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// ─── Читаємо .env.local ──────────────────────────────────────────────────────
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env.local')
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const idx = trimmed.indexOf('=')
        if (idx < 0) continue
        const key = trimmed.slice(0, idx).trim()
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) process.env[key] = val
    }
}
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GEMINI_KEY = process.env.GEMINI_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_KEY) {
    console.error('❌ Відсутні змінні оточення. Перевір .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ─── Маппінг груп м'язів EN → UA ────────────────────────────────────────────
const MUSCLE_MAP = {
    'back': 'Спина',
    'cardio': 'Кардіо',
    'chest': 'Груди',
    'lower arms': 'Руки',
    'lower legs': 'Ноги',
    'neck': 'Інше',
    'shoulders': 'Плечі',
    'upper arms': 'Руки',
    'upper legs': 'Ноги',
    'waist': 'Прес',
}

// ─── Маппінг другорядних м'язів EN → UA ─────────────────────────────────────
const SECONDARY_MAP = {
    'biceps': 'Біцепс', 'triceps': 'Трицепс', 'pectorals': 'Грудні',
    'lats': 'Широкий м\'яз спини', 'deltoids': 'Дельти',
    'quadriceps': 'Квадрицепс', 'hamstrings': 'Задня поверхня стегна',
    'glutes': 'Сідниці', 'calves': 'Литки', 'abs': 'Прес',
    'forearms': 'Передпліччя', 'traps': 'Трапеція',
    'rhomboids': 'Ромбовидні', 'obliques': 'Косі м\'язи',
    'lower back': 'Нижня спина', 'upper back': 'Верхня спина',
    'serratus anterior': 'Зубчастий м\'яз', 'hip flexors': 'Згиначі стегна',
    'adductors': 'Привідні м\'язи', 'abductors': 'Відвідні м\'язи',
    'soleus': 'Камбалоподібний', 'tibialis anterior': 'Гомілковий м\'яз',
    'spine': 'Хребет', 'cardiovascular system': 'Серцево-судинна система',
    'rotator cuff': 'Ротаторна манжета',
}

function getType(exercise) {
    if (exercise.bodyPart === 'cardio') return 'time'
    if (exercise.equipment === 'body weight') return 'bodyweight'
    return 'weight_reps'
}

function toJsDelivr(rawUrl) {
    if (!rawUrl) return null
    // GitHub CDN → jsDelivr (швидкий глобальний CDN)
    return rawUrl.replace(
        'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/',
        'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/'
    )
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Переклад тільки НАЗВ через Gemini (мінімум токенів) ─────────────────────
async function translateNames(names, attempt = 1) {
    const prompt = `Перекладач фітнес-термінів. Переклади назви вправ на УКРАЇНСЬКУ мову.
Поверни ТІЛЬКИ JSON масив рядків, без markdown, без коментарів.

Вхід: ${JSON.stringify(names)}
Вихід (той самий порядок):${JSON.stringify(names.map(() => '...'))}`

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2048,
                    // Вимикаємо "думання" — нам потрібна чиста відповідь JSON
                    thinkingConfig: { thinkingBudget: 0 },
                },
            }),
        }
    )

    if (res.status === 429) {
        if (attempt <= 5) {
            const wait = attempt * 10000 // 10, 20, 30, 40, 50 сек
            process.stdout.write(` [429, чекаємо ${wait / 1000}с]`)
            await sleep(wait)
            return translateNames(names, attempt + 1)
        }
        throw new Error('429: вичерпано ліміт спроб')
    }

    if (!res.ok) {
        const body = await res.text()
        throw new Error(`Gemini ${res.status}: ${body.slice(0, 100)}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    const clean = text.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').replace(/\n?```$/i, '').trim()
    const translated = JSON.parse(clean)

    // Валідація: має бути масив тієї самої довжини
    if (!Array.isArray(translated) || translated.length !== names.length) {
        throw new Error(`Невалідна відповідь Gemini (очікувалось ${names.length}, отримано ${translated?.length})`)
    }
    return translated
}

// ─── Головна функція ─────────────────────────────────────────────────────────
async function main() {
    console.log('╔══════════════════════════════════════════╗')
    console.log('║  ZalAI — Миттєвий імпорт (без Gemini)    ║')
    console.log('╚══════════════════════════════════════════╝\n')

    // 1. Завантажуємо
    console.log('📥 Завантаження вправ з GitHub...')
    const res = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const exercises = await res.json()
    console.log(`✅ Завантажено ${exercises.length} вправ\n`)

    let totalInserted = 0
    let totalErrors = 0

    // Будемо вставляти великими пачками (по 100) для швидкості
    const BATCH_SIZE = 100
    for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
        const chunk = exercises.slice(i, i + BATCH_SIZE)
        process.stdout.write(`Вставка ${i + 1}-${Math.min(i + BATCH_SIZE, exercises.length)}... `)

        try {
            const toInsert = chunk.map(ex => ({
                user_id: null,
                name: ex.name, // Залишаємо англійською!
                type: getType(ex),
                muscle: MUSCLE_MAP[ex.bodyPart] || 'Інше',
                description: null,
                instructions: ex.instructions?.length ? ex.instructions : null,
                tips: null,
                gif_url: toJsDelivr(ex.gifUrl),
                secondary_muscles: (ex.secondaryMuscles || []).map(m => SECONDARY_MAP[m] || m),
            }))

            // Відфільтровуємо те що вже є (щоб не було ON CONFLICT помилки)
            const namesToInsert = toInsert.map(x => x.name)
            const { data: existing } = await supabase
                .from('exercises')
                .select('name')
                .in('name', namesToInsert)

            const existingNames = new Set((existing || []).map(e => e.name))
            const newExercises = toInsert.filter(ex => !existingNames.has(ex.name))

            if (newExercises.length === 0) {
                console.log(`⏩ Пропущено`)
                continue
            }

            const { error } = await supabase.from('exercises').insert(newExercises)

            if (error) {
                console.log(`❌ ${error.message}`)
                totalErrors++
            } else {
                console.log(`✅ +${newExercises.length}`)
                totalInserted += newExercises.length
            }
        } catch (e) {
            console.log(`❌ ${e.message}`)
            totalErrors++
        }
    }

    console.log('\n╔══════════════════════════════════╗')
    console.log(`║  ✅ Вставлено: ${String(totalInserted).padEnd(18)}║`)
    console.log(`║  🎉 Імпорт бази завершено!       ║`)
    console.log('╚══════════════════════════════════╝')
    console.log('\n💡 ПРИМІТКА: Назви залишились англійською.')
    console.log('Пізніше напишемо скрипт або UI-інструмент для фонового перекладу.')
}

main().catch(err => {
    console.error('\n💥 Критична помилка:', err.message)
    process.exit(1)
})
