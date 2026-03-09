/**
 * ZalAI — Експорт назв вправ для ручного перекладу
 *
 * Запуск: node scripts/export-for-translation.js
 *
 * Що робить:
 *  1. Завантажує вправи з free-exercise-db
 *  2. Зберігає у scripts/to-translate.json (id + name + instructions)
 *  3. Виводить інструкцію: як пастити до іншого AI та що з відповіддю робити
 */

const fs = require('fs')
const path = require('path')

async function main() {
    console.log('📥 Завантаження вправ з GitHub...')
    const res = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json')
    const exercises = await res.json()
    console.log(`✅ Завантажено ${exercises.length} вправ\n`)

    // Зберігаємо мінімальну структуру: id, назва, інструкції
    const forTranslation = exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        instructions: ex.instructions || [],
    }))

    // ─── Зберігаємо повний файл ──────────────────────────────────────────────
    const fullPath = path.join(__dirname, 'to-translate-full.json')
    fs.writeFileSync(fullPath, JSON.stringify(forTranslation, null, 2), 'utf-8')
    console.log(`💾 Повний файл збережено: scripts/to-translate-full.json`)

    // ─── Ділимо на батчі по 30 (зручно для вставки в ChatGPT/Claude) ─────────
    const BATCH = 30
    const batches = []
    for (let i = 0; i < forTranslation.length; i += BATCH) {
        batches.push(forTranslation.slice(i, i + BATCH))
    }

    // Зберігаємо кожен батч в окремий файл
    const batchDir = path.join(__dirname, 'translation-batches')
    if (!fs.existsSync(batchDir)) fs.mkdirSync(batchDir)

    batches.forEach((batch, idx) => {
        const batchPath = path.join(batchDir, `batch-${String(idx + 1).padStart(2, '0')}.json`)
        fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8')
    })

    console.log(`📦 Розбито на ${batches.length} батчів по ${BATCH} вправ`)
    console.log(`   Збережено в: scripts/translation-batches/\n`)

    // ─── Виводимо промпт для AI ───────────────────────────────────────────────
    console.log('═'.repeat(60))
    console.log('\n📋 ПРОМПТ ДЛЯ AI (копіюй і вставляй перед кожним батчем):\n')
    console.log('═'.repeat(60))
    console.log(`
Ти перекладач фітнес-контенту. Переведи масив вправ з англійської на УКРАЇНСЬКУ мову.

ПРАВИЛА:
- Назви вправ: технічна спортивна термінологія
- Інструкції: зрозуміла покрокова українська  
- Поверни ТІЛЬКИ валідний JSON масив, без коментарів, без markdown

Формат відповіді:
[
  {
    "id": "оригінальний id без змін",
    "name_ua": "переклад назви",
    "instructions_ua": ["крок 1", "крок 2", ...]
  }
]

Ось масив для перекладу:
[ВСТАВЛЯЙ СЮДИ ВМІСТ ФАЙЛІВ batch-01.json, batch-02.json тощо]
`)
    console.log('═'.repeat(60))
    console.log(`
НАСТУПНИЙ КРОК:
1. Відкрий scripts/translation-batches/batch-01.json
2. Скопіюй його вміст в ChatGPT/Claude з промптом вище
3. Отриману відповідь збережи як scripts/translated/batch-01.json
4. Повтори для batch-02, batch-03... (всього ${batches.length} файлів)
5. Потім запустимо: node scripts/apply-translations.js
`)
}

main().catch(err => {
    console.error('💥', err.message)
    process.exit(1)
})
