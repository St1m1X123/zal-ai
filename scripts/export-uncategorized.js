/**
 * Експортує всі вправи категорії "Інше" у файл для Gemini.
 * Запуск: node scripts/export-uncategorized.js
 */
const fs = require('fs');
const path = require('path');

// ── Та сама логіка класифікації (копія з categorize-and-export.js) ──────────
const MUSCLE_RULES = [
    { muscle: 'Груди', keywords: ['bench press', 'chest press', 'жим лежачи', 'chest', 'груди', 'грудн', 'pec', 'flye', 'fly', 'розведення', 'кросовер', 'crossover', 'push-up', 'pushup', 'віджиман', 'dips - chest', 'cable fly', 'зведення', 'guillotine', 'svend press', 'floor press', 'close grip bench'] },
    { muscle: 'Спина', keywords: ['deadlift', 'станова', 'pull-up', 'pullup', 'chin-up', 'chin up', 'підтягуван', 'row', 'тяга', 'lat ', 'lats', 'широчайш', 'back', 'спина', 'спин', 'hyperextension', 'гіперекстензія', 'good morning', 'наклон', 'pulldown', 'pull down', 'тяга зверху', 'шраги', 'shrug', 'traps', 'трапеці', 'superman', 'човник', 'renegade', 'ренегатськ', 'rack pull', 'inverted row', 'seal row', 'atlas stone', 'камінь атласа', 'axle deadlift', 'вісь аполлона', 'clean', 'клін', 'hang clean', 'power clean', 'взяття на груди', 'swing', 'свінг', 'kettlebell swing', 'bent press'] },
    { muscle: 'Ноги', keywords: ['squat', 'присід', 'leg press', 'жим ногами', 'lunge', 'випад', 'deadlift romanian', 'румунська', 'leg curl', 'leg extension', 'calf raise', 'гомілка', 'стрибок', 'bound', 'jump', 'стрибати', 'hamstring', 'біцепс стегна', 'quad', 'квадрицепс', 'glute', 'сідниц', 'adductor', 'привідн', 'hip thrust', 'abductor', 'відвідн', 'step up', 'box jump', 'depth jump', 'calf', 'литк', 'donkey', 'sissy squat', 'pistol', 'nordic', 'hack squat', 'goblet', 'jefferson', 'knee', 'ankle', 'гомілковостопн', 'tibialis', 'diagonal bound', 'hip flexor', 'згинач стегна'] },
    { muscle: 'Плечі', keywords: ['shoulder', 'плеч', 'overhead press', 'press overhead', 'жим над головою', 'lateral raise', 'підйом через сторони', 'front raise', 'підйом перед', 'arnold', 'арнольд', 'deltoid', 'дельт', 'military press', 'seated press', 'upright row', 'тяга до підборіддя', 'face pull', 'reverse fly', 'зворотне розведення', 'jerk', 'snatch', 'ривок', 'поштовх', 'cuban press', 'кубинськ', 'windmill', 'млин з гирею', 'turkish get-up', 'підйом з гирею', 'get-up'] },
    { muscle: 'Руки', keywords: ['curl', 'згинання', 'bicep', 'біцепс', 'hammer curl', 'молоток', 'tricep', 'трицепс', 'french press', 'французький жим', 'skull crusher', 'french', 'розгинання руки', 'forearm', 'передпліч', 'wrist', "зап'ястя", 'grip', 'хват', 'dip machine', 'dips - triceps', 'kickback', 'розгинання', 'close-grip', 'вузьким хватом', 'preacher', 'парт', 'concentration curl', 'концентрован', 'reverse curl', 'zottman', 'cable curl', 'bar curl', 'bayesian'] },
    { muscle: 'Прес', keywords: ['crunch', 'скручуван', 'ab ', 'abs', ' ab', 'прес', 'sit-up', 'sit up', 'підйом тулуба', 'plank', 'планка', 'leg raise', 'підйом ніг', 'oblique', 'косий', 'russian twist', 'dead bug', 'мертвий жук', 'mountain climber', 'альпініст', 'hanging knee', 'висячи', 'roller', 'ролик для преса', 'bicycle', 'велосипед', 'tuck', 'hollow', 'v-up', 'windshield wiper', 'dragon flag', 'l-sit', 'toe touch', 'jackknife', 'heel touch', 'anti-gravity press', 'антигравітаційн'] },
    { muscle: 'Кардіо', keywords: ['run', 'біг', 'jog', 'treadmill', 'бігова доріжка', 'cycling', 'bike ', 'велосипед тренажер', 'elliptical', 'еліпсоїд', 'rowing machine', 'гребний', 'jump rope', 'скакалка', 'burpee', 'берпі', 'hiit', 'circuit', 'кроси', 'cardio', 'кардіо', 'sprint', 'спринт', 'swim', 'плаван', 'stair', 'сходинки', 'step mill', 'аеробік', 'assault bike', 'ski erg', 'rope jump', 'air bike'] },
    { muscle: 'Розтяжка', keywords: ['stretch', 'розтяжк', 'smr', 'смр', 'foam roll', 'масажн валик', 'myofascial', 'міофасціальн', 'mobility', 'мобільн', 'flexibility', 'гнучкість', 'релакс', 'relax', 'warm-up', 'warm up', 'розминк', 'cool down', 'заминк', 'yoga', 'йога', 'pilates', 'пілатес', 'self-massage', 'самомасаж', 'ankle circle', 'arm circle', 'rotation', 'shoulder circle', 'hip circle', 'neck roll', 'torso rotation', 'розтяжка', 'розтяжці', 'quad stretch', 'hip flexor stretch', 'pigeon', 'cobra', 'child pose', 'downward dog', 'cat cow', 'doorway', 'wall stretch', 'cross body'] },
];

function classify(ex) {
    const combined = ex.id.toLowerCase().replace(/_/g, ' ') + ' ' + (ex.name || '').toLowerCase();
    for (const r of MUSCLE_RULES) {
        if (r.keywords.some(kw => combined.includes(kw.toLowerCase()))) return r.muscle;
    }
    return 'Інше';
}

// ── Читаємо всі батчі ────────────────────────────────────────────────────────
const batchDir = path.join(__dirname, 'translated');
let all = [];
for (let i = 1; i <= 30; i++) {
    const f = path.join(batchDir, `batch-${String(i).padStart(2, '0')}.json`);
    if (fs.existsSync(f)) all = all.concat(JSON.parse(fs.readFileSync(f, 'utf-8')));
}

const others = all.filter(ex => classify(ex) === 'Інше');

// ── Формат для Gemini: простий список ────────────────────────────────────────
const geminiPrompt = `У мене є список фітнес-вправ. Для кожної вправи визнач категорію м'язової групи.
Доступні категорії: Груди, Спина, Ноги, Плечі, Руки, Прес, Кардіо, Розтяжка, Інше (тільки для шиї, балансу).

Поверни ТІЛЬКИ JSON масив об'єктів у форматі:
[{"name": "назва вправи", "muscle": "категорія"}, ...]

Вправи для класифікації:
${others.map(ex => `- ${ex.name} (id: ${ex.id})`).join('\n')}
`;

// ── Зберігаємо два файли ─────────────────────────────────────────────────────
// 1. Промпт для Gemini (текстовий)
fs.writeFileSync(
    path.join(__dirname, 'for-gemini-classify.txt'),
    geminiPrompt,
    'utf-8'
);

// 2. JSON зі структурою (для автоматичної обробки відповіді)
fs.writeFileSync(
    path.join(__dirname, 'uncategorized-exercises.json'),
    JSON.stringify(others.map(ex => ({ id: ex.id, name: ex.name })), null, 2),
    'utf-8'
);

console.log(`\n✅ Готово! Знайдено ${others.length} некатегоризованих вправ.\n`);
console.log('📄 Файли збережено:');
console.log('   scripts/for-gemini-classify.txt  ← скинь це в Gemini');
console.log('   scripts/uncategorized-exercises.json  ← для обробки відповіді\n');
console.log('📋 Список "Інше" вправ:');
others.forEach(ex => console.log(`   [${ex.id}] ${ex.name}`));
