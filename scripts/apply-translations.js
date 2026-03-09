/**
 * ZalAI — Застосування перекладів до бази даних
 *
 * Запуск: node scripts/apply-translations.js
 *
 * Передумова: папка scripts/translated/ з файлами batch-01.json, batch-02.json...
 * Кожен файл має вигляд:
 *  [{ "id": "...", "name_ua": "...", "instructions_ua": ["...", "..."] }]
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

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

async function main() {
    console.log('╔══════════════════════════════════════════╗')
    console.log('║  ZalAI — Застосування перекладів до БД   ║')
    console.log('╚══════════════════════════════════════════╝\n')

    const translatedDir = path.join(__dirname, 'translated')
    if (!fs.existsSync(translatedDir)) {
        console.error('❌ Папka scripts/translated/ не знайдена!')
        console.log('   Створи її і поклади туди перекладені JSON файли.')
        process.exit(1)
    }

    const files = fs.readdirSync(translatedDir).filter(f => f.endsWith('.json')).sort()
    if (files.length === 0) {
        console.error('❌ В папці scripts/translated/ немає JSON файлів!')
        process.exit(1)
    }

    console.log(`📁 Знайдено ${files.length} файлів для застосування\n`)

    let totalUpdated = 0
    let totalErrors = 0

    for (const file of files) {
        const filePath = path.join(translatedDir, file)
        process.stdout.write(`📄 ${file}... `)

        try {
            const content = fs.readFileSync(filePath, 'utf-8')
            const translations = JSON.parse(content)

            let fileUpdated = 0
            for (const item of translations) {
                // Шукаємо вправу за оригінальним id з free-exercise-db
                // (зберігаємо original_id в description або шукаємо по назві)
                // Найпростіший варіант: UPDATE по колонці де зберігся id
                // Поки що у нас name=англійська, тому оновлюємо по name:
                const { error } = await supabase
                    .from('exercises')
                    .update({
                        name: item.name_ua,
                        instructions: item.instructions_ua,
                    })
                    .eq('name', item.name_en || item.id) // name_en або original id
                    .is('user_id', null) // тільки глобальні

                if (!error) fileUpdated++
            }

            console.log(`✅ Оновлено ${fileUpdated}/${translations.length}`)
            totalUpdated += fileUpdated
        } catch (e) {
            console.log(`❌ ${e.message}`)
            totalErrors++
        }
    }

    console.log('\n╔══════════════════════════════════╗')
    console.log(`║  ✅ Оновлено: ${String(totalUpdated).padEnd(19)}║`)
    console.log(`║  ❌ Помилок: ${String(totalErrors).padEnd(20)}║`)
    console.log('╚══════════════════════════════════╝')
}

main().catch(err => {
    console.error('\n💥 Критична помилка:', err.message)
    process.exit(1)
})
