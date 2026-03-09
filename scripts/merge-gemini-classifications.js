/**
 * Читає Gemini-класифікацію з for-gemini-classify.txt
 * і додає SQL UPDATE рядки до update_exercises.sql
 *
 * Запуск: node scripts/merge-gemini-classifications.js
 */
const fs = require('fs');
const path = require('path');

const geminiFile = path.join(__dirname, 'for-gemini-classify.txt');
const sqlFile = path.join(__dirname, 'update_exercises.sql');

// Читаємо і парсимо Gemini-відповідь
let raw = fs.readFileSync(geminiFile, 'utf-8').trim();

// Прибираємо можливий markdown ```json ... ```
raw = raw.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();
// Прибираємо крапку в кінці якщо є (Gemini іноді додає)
raw = raw.replace(/\.$/, '').trim();

let classified;
try {
    classified = JSON.parse(raw);
} catch (e) {
    console.error('❌ Не вдалося розпарсити JSON з for-gemini-classify.txt');
    console.error('   Перевір що там чистий JSON-масив');
    console.error(e.message);
    process.exit(1);
}

console.log(`✅ Прочитано ${classified.length} вправ з Gemini-класифікації`);

// Генеруємо SQL рядки
const newLines = [
    '',
    '-- === Класифікація Gemini для залишкових вправ ===',
];

const stats = {};
for (const item of classified) {
    const safeName = (item.name || '').replace(/'/g, "''");
    const muscle = item.muscle || 'Інше';
    // Для кардіо — тип time, для Розтяжки — bodyweight, інакше weight
    let type = 'weight';
    if (muscle === 'Кардіо') type = 'time';
    else if (muscle === 'Розтяжка') type = 'bodyweight';

    newLines.push(
        `UPDATE exercises SET muscle = '${muscle}', type = '${type}' WHERE name = '${safeName}' AND user_id IS NULL;`
    );

    stats[muscle] = (stats[muscle] || 0) + 1;
}

// Дописуємо до існуючого SQL файлу
fs.appendFileSync(sqlFile, newLines.join('\n') + '\n', 'utf-8');

console.log('\n📊 Розподіл Gemini:');
for (const [m, c] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${m.padEnd(14)} ${c}`);
}
console.log(`\n✅ ${newLines.length - 2} рядків додано до scripts/update_exercises.sql`);
console.log('\n👉 Тепер заливай update_exercises.sql у Supabase SQL Editor!');
