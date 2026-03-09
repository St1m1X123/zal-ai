/**
 * ZalAI — Повний реімпорт вправ з перекладами і зображеннями
 *
 * Запуск: node scripts/re-import-all.js
 *
 * Що робить:
 *  1. Завантажує оригінальний exercises.json з GitHub (для images та english name)
 *  2. Читає всі файли з scripts/translated/ (твої переклади)
 *  3. Видаляє всі глобальні вправи (user_id IS NULL)
 *  4. Вставляє 873 вправи з:
 *     - Українською назвою та інструкціями (з твоїх перекладів)
 *     - Зображенням через jsDelivr CDN (статичне JPG, але краще ніж нічого)
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

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─── Маппінг груп м'язів EN → UA ────────────────────────────────────────────
const MUSCLE_MAP = {
    'back': 'Спина', 'cardio': 'Кардіо', 'chest': 'Груди',
    'lower arms': 'Руки', 'lower legs': 'Ноги', 'neck': 'Інше',
    'shoulders': 'Плечі', 'upper arms': 'Руки', 'upper legs': 'Ноги', 'waist': 'Прес',
}

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

// ─── Правильний спосіб отримати URL зображення ──────────────────────────────
// free-exercise-db використовує поле `images` (масив JPG шляхів)
// НЕ `gifUrl` — це була моя помилка в попередніх скриптах
function getImageUrl(exercise) {
    if (!exercise.images || exercise.images.length === 0) return null
    const imagePath = exercise.images[0] // Перше зображення (статичний JPG)
    return `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${imagePath}`
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
    console.log('╔══════════════════════════════════════════════╗')
    console.log('║  ZalAI — Повний реімпорт з перекладами       ║')
    console.log('╚══════════════════════════════════════════════╝\n')

    // ─── 1. Завантажуємо оригінальні дані ───────────────────────────────────
    console.log('📥 Завантаження exercises.json з GitHub...')
    const res = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json')
    if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`)
    const originalExercises = await res.json()
    console.log(`✅ Завантажено ${originalExercises.length} оригінальних вправ`)

    // Створюємо lookup по id: { exerciseId → originalData }
    const originalById = {}
    for (const ex of originalExercises) {
        originalById[ex.id] = ex
    }

    // ─── 2. Читаємо переклади ────────────────────────────────────────────────
    const translatedDir = path.join(__dirname, 'translated')
    if (!fs.existsSync(translatedDir)) {
        console.error('❌ Папка scripts/translated/ не знайдена!')
        process.exit(1)
    }

    const files = fs.readdirSync(translatedDir).filter(f => f.endsWith('.json')).sort()
    console.log(`📁 Знайдено ${files.length} файлів з перекладами`)

    // Об'єднуємо всі переклади в один lookup: { id → {name_ua, instructions_ua} }
    const translationsById = {}
    let totalTranslated = 0
    for (const file of files) {
        const filePath = path.join(translatedDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const items = JSON.parse(content)
        for (const item of items) {
            translationsById[item.id] = {
                name: item.name,          // Українська назва
                instructions: item.instructions, // Українські інструкції
            }
            totalTranslated++
        }
    }
    console.log(`✅ Завантажено ${totalTranslated} перекладів\n`)

    // ─── 3. Видаляємо всі глобальні вправи ──────────────────────────────────
    console.log('🗑️  Видалення старих глобальних вправ...')
    const { error: deleteError } = await supabase
        .from('exercises')
        .delete()
        .is('user_id', null)

    if (deleteError) {
        console.error('❌ Помилка видалення:', deleteError.message)
        process.exit(1)
    }
    console.log('✅ Старі вправи видалені\n')

    // ─── 4. Будуємо масив для вставки ────────────────────────────────────────
    console.log('🔧 Підготовка даних...')
    const toInsert = []
    let noTranslation = 0

    for (const ex of originalExercises) {
        const translation = translationsById[ex.id]
        const hasTranslation = translation && translation.name

        if (!hasTranslation) noTranslation++

        toInsert.push({
            user_id: null,
            name: hasTranslation ? translation.name : ex.name, // UA або EN fallback
            type: getType(ex),
            muscle: MUSCLE_MAP[ex.bodyPart] || 'Інше',
            description: null,
            instructions: hasTranslation ? translation.instructions :
                (ex.instructions?.length ? ex.instructions : null),
            tips: null,
            gif_url: getImageUrl(ex), // Правильно: images[0] через jsDelivr CDN
            secondary_muscles: (ex.secondaryMuscles || []).map(m => SECONDARY_MAP[m] || m),
        })
    }

    console.log(`✅ Підготовлено ${toInsert.length} вправ`)
    if (noTranslation > 0) {
        console.log(`⚠️  ${noTranslation} вправ без перекладу (використано англійський оригінал)`)
    }

    // ─── 5. Вставляємо пачками по 100 ────────────────────────────────────────
    console.log('\n📦 Вставка в базу даних...')
    let totalInserted = 0
    let totalErrors = 0
    const BATCH = 100

    for (let i = 0; i < toInsert.length; i += BATCH) {
        const batch = toInsert.slice(i, i + BATCH)
        process.stdout.write(`  Вставка ${i + 1}-${Math.min(i + BATCH, toInsert.length)}... `)

        const { error } = await supabase.from('exercises').insert(batch)
        if (error) {
            console.log(`❌ ${error.message}`)
            totalErrors++
        } else {
            console.log(`✅ +${batch.length}`)
            totalInserted += batch.length
        }
    }

    console.log('\n╔══════════════════════════════════════════╗')
    console.log(`║  ✅ Вставлено: ${String(totalInserted).padEnd(27)}║`)
    console.log(`║  ❌ Помилок:  ${String(totalErrors).padEnd(27)}║`)
    console.log(`║  📷 Зображення: JPG з jsDelivr CDN      ║`)
    console.log('║  🎉 Реімпорт завершено!                  ║')
    console.log('╚══════════════════════════════════════════╝')
}

main().catch(err => {
    console.error('\n💥 Критична помилка:', err.message)
    process.exit(1)
})
