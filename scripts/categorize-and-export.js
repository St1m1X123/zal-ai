/**
 * ZAL-AI: Скрипт категоризації вправ
 * ====================================
 * Читає всі 30 перекладених JSON-файлів, класифікує кожну вправу
 * за м'язовою групою та типом за допомогою словника ключових слів,
 * і генерує фінальний SQL-файл для заливки в Supabase.
 *
 * Запуск: node scripts/categorize-and-export.js
 */

const fs = require('fs');
const path = require('path');

// ===========================================================
// СЛОВНИКИ КЛАСИФІКАЦІЇ
// ===========================================================

// Пріоритет: перевіряємо зверху вниз. Перший збіг — переможець.
const MUSCLE_RULES = [
    // ГРУДИ
    {
        muscle: 'Груди',
        keywords: [
            'bench press', 'chest press', 'жим лежачи', 'chest', 'груди', 'грудн',
            'pec', 'flye', 'fly', 'розведення', 'кросовер', 'crossover',
            'push-up', 'pushup', 'віджиман', 'dips - chest', 'бруси (з акцентом на груди',
            'cable fly', 'зведення', 'guillotine', 'гільйотина',
            'svend press', 'floor press', 'жим на підлозі', 'close grip bench',
        ],
    },
    // СПИНА
    {
        muscle: 'Спина',
        keywords: [
            'deadlift', 'станова', 'pull-up', 'pullup', 'chin-up', 'chin up',
            'підтягуван', 'row', 'тяга', 'lat ', 'lats',
            'широчайш', 'back', 'спина', 'спин',
            'hyperextension', 'гіперекстензія', 'good morning', 'наклон',
            'pulldown', 'pull down', 'тяга зверху', 'шраги', 'shrug',
            'traps', 'трапеці', 'superman', 'човник',
            'renegade', 'ренегатськ', 'rack pull', 'суmo', 'сумо',
            'inverted row', 'seal row', 'meadow', 'тяга стоячи',
        ],
    },
    // НОГИ
    {
        muscle: 'Ноги',
        keywords: [
            'squat', 'присід', 'leg press', 'жим ногами', 'lunge', 'випад',
            'deadlift romanian', 'румунська', 'leg curl', 'leg extension',
            'calf raise', 'гомілка', 'стрибок', 'bound', 'jump', 'стрибати',
            'hamstring', 'біцепс стегна', 'quad', 'квадрицепс',
            'glute', 'сідниц', 'adductor', 'привідн', 'hip thrust',
            'abductor', 'відвідн', 'step up', 'box jump', 'depth jump',
            'calf', 'литк', 'donkey', 'sissy squat', 'pistol',
            'nordic', 'nordic curl', 'nordic hamstring',
            'hack squat', 'goblet', 'jefferson', 'knee',
            'ankle', 'гомілковостопн', 'tibialis',
            'diagonal bound', 'діагональн стрибок',
            'hip circle', 'hip flexor', 'згинач стегна',
        ],
    },
    // ПЛЕЧІ
    {
        muscle: 'Плечі',
        keywords: [
            'shoulder', 'плеч', 'overhead press', 'press overhead', 'жим над головою',
            'lateral raise', 'підйом через сторони', 'front raise', 'підйом перед',
            'arnold', 'арнольд', 'deltoid', 'дельт', 'military press',
            'seated press', 'upright row', 'тяга до підборіддя',
            'face pull', 'reverse fly', 'зворотне розведення',
            'jerk', 'snatch', 'ривок', 'поштовх', 'cuban press', 'кубинськ',
            'alternating cable shoulder', 'poперемінний жим у кросовері',
            'lu raise', 'lu extension',
        ],
    },
    // РУКИ (Біцепс + Трицепс + Передпліччя)
    {
        muscle: 'Руки',
        keywords: [
            'curl', 'згинання', 'bicep', 'біцепс', 'hammer curl', 'молоток',
            'tricep', 'трицепс', 'french press', 'французький жим',
            'skull crusher', 'french', 'розгинання руки',
            'forearm', 'передпліч', 'wrist', "зап'ястя", 'grip', 'хват',
            'dip machine', 'dips - triceps', 'kickback', 'розгинання',
            'close-grip', 'вузьким хватом', 'preacher', 'парт',
            'concentration curl', 'концентрован', 'reverse curl',
            'zottman', 'cable curl', 'bar curl', 'bayesian',
        ],
    },
    // ПРЕС
    {
        muscle: 'Прес',
        keywords: [
            'crunch', 'скручуван', 'ab ', 'abs', ' ab', 'прес',
            'sit-up', 'sit up', 'підйом тулуба', 'plank', 'планка',
            'leg raise', 'підйом ніг', 'oblique', 'косий', 'russian twist',
            'dead bug', 'мертвий жук', 'mountain climber', 'альпініст',
            'hanging knee', 'висячи', 'roller', 'ролик для преса',
            'bicycle', 'велосипед', 'tuck', 'hollow', 'v-up',
            'windshield wiper', 'dragon flag', 'hollow body',
            'l-sit', 'toe touch', 'jackknife', 'heel touch',
            'anti-gravity press', 'антигравітаційн',
        ],
    },
    // КАРДІО
    {
        muscle: 'Кардіо',
        keywords: [
            'run', 'біг', 'jog', 'treadmill', 'бігова доріжка',
            'cycling', 'bike ', 'велосипед тренажер', 'elliptical', 'еліпсоїд',
            'rowing machine', 'гребний', 'jump rope', 'скакалка',
            'burpee', 'берпі', 'hiit', 'circuit', 'кроси',
            'cardio', 'кардіо', 'sprint', 'спринт', 'swim', 'плаван',
            'stair', 'сходинки', 'step mill', 'аеробік',
            'assault bike', 'ski erg', 'rope jump', 'air bike',
        ],
    },
    // ФУНКЦІОНАЛЬНИЙ / СИЛОВИЙ СПОРТ (гирі, strongman)
    {
        muscle: 'Спина',
        keywords: [
            'atlas stone', 'камінь атласа', 'axle deadlift', 'вісь аполлона',
            'atlas stone trainer', 'тренажер для каменів',
        ],
    },
    {
        muscle: 'Плечі',
        keywords: [
            'kettlebell windmill', 'млин з гирею', 'windmill',
            'turkish get-up', 'підйом з гирею', 'get-up',
        ],
    },
    {
        muscle: 'Спина',
        keywords: [
            'clean', 'клін', 'hang clean', 'power clean', 'взяття на груди',
        ],
    },
    {
        muscle: 'Спина',
        keywords: [
            'swing', 'свінг', 'kettlebell swing', 'mahler', 'bent press',
        ],
    },
    // ШИЯ
    {
        muscle: 'Інше',
        keywords: [
            'neck', 'шия', 'шиї', 'cervical',
        ],
    },
    // РОЗТЯЖКА
    {
        muscle: 'Розтяжка',
        keywords: [
            'stretch', 'розтяжк', 'smr', 'смр', 'foam roll', 'масажн валик',
            'myofascial', 'міофасціальн', 'mobility', 'мобільн',
            'flexibility', 'гнучкість', 'релакс', 'relax',
            'warm-up', 'warm up', 'розминк', 'cool down', 'заминк',
            'yoga', 'йога', 'pilates', 'пілатес',
            'self-massage', 'самомасаж',
            // Суглобові вправи
            'ankle circle', 'arm circle', 'obертання', 'rotation', 'shoulder circle',
            'hip circle', 'neck roll', 'torso rotation',
            // Все де є "розтяжка" в перекладі
            'розтяжка', 'розтяжці',
            // Quad stretch, hip flexor stretch, etc.
            'quad stretch', 'hip flexor stretch', 'pigeon', 'cobra',
            'child pose', 'downward dog', 'cat cow', 'lunge stretch',
            'doorway', 'wall stretch', 'cross body',
        ],
    },
];

// Тип вправи
const TYPE_RULES = [
    // ЧАС (виконуються на витривалість по секундах)
    {
        type: 'time',
        keywords: [
            'plank', 'планка', 'crucifix', 'розп\'яття', 'утримання',
            'hold', 'isometric', 'static', 'статич',
            'wall sit', 'bridge hold', 'superman hold',
            'cardio', 'кардіо', 'run', 'біг', 'cycling', 'bike',
            'elliptical', 'rowing machine', 'jump rope', 'скакалка',
            'treadmill', 'stair', 'swim', 'плаван', 'sprint',
            'hiit', 'circuit', 'аеробік',
        ],
    },
    // ВЛАСНА ВАГА (без навантаження, рахуються повтори)
    {
        type: 'bodyweight',
        keywords: [
            'push-up', 'pull-up', 'dip', 'chin-up', 'muscle up',
            'burpee', 'берпі', 'крок', 'walking', 'jumping jack',
            'mountain climber', 'high knee', 'leg raise',
            'sit-up', 'crunch', 'скручуван', 'air squat', 'повітряний присід',
            'bodyweight', 'без ваги', 'lunge', 'випад',
            'віджиман', 'підтягуван', 'bridge', 'shoulder bridge',
            'plank', 'планка', 'superman', 'dead bug', 'мертвий жук',
            'bird dog', 'hollow', 'tuck', 'handstand',
            'розтяжка', 'stretch', 'смр', 'smr', 'foam roll',
            'masaj', 'масаж', 'міофасціальний', 'myofascial',
            'mobility', 'warm', 'разминк', 'warm-up', 'cool',
        ],
    },
    // Усе інше — вага (штанга/гантелі/блок)
];

// ===========================================================
// КАРДІО-СПЕЦИФІКА: Секунди чи повтори?
// ===========================================================
// Для кардіо: деякі рахуються в секундах, деякі в повторах
const CARDIO_BY_REPS = [
    'burpee', 'берпі', 'jumping jack', 'jump rope', 'скакалка',
    'high knee', 'mountain climber', 'альпініст', 'box jump',
];

// ===========================================================
// ЛОГІКА КЛАСИФІКАЦІЇ
// ===========================================================

function classify(exercise) {
    const nameEn = exercise.id.toLowerCase().replace(/_/g, ' ');
    const nameUk = (exercise.name || '').toLowerCase();
    const combined = nameEn + ' ' + nameUk;

    // --- М'язова група ---
    let muscle = 'Інше';
    for (const rule of MUSCLE_RULES) {
        if (rule.keywords.some(kw => combined.includes(kw.toLowerCase()))) {
            muscle = rule.muscle;
            break;
        }
    }

    // --- Тип ---
    let type = 'weight'; // default
    // Спочатку перевіряємо TIME
    if (TYPE_RULES[0].keywords.some(kw => combined.includes(kw.toLowerCase()))) {
        type = 'time';
    }
    // Потім — BODYWEIGHT (для кардіо типу "з повторами" повертаємо bodyweight)
    else if (TYPE_RULES[1].keywords.some(kw => combined.includes(kw.toLowerCase()))) {
        type = 'bodyweight';
    }

    // Особливий випадок: кардіо на повтори
    if (muscle === 'Кардіо' && CARDIO_BY_REPS.some(kw => combined.includes(kw))) {
        type = 'bodyweight';
    }

    return { muscle, type };
}

// ===========================================================
// ГОЛОВНА ЛОГІКА
// ===========================================================

const batchDir = path.join(__dirname, 'translated');
const outputFile = path.join(__dirname, 'update_exercises.sql');

let allExercises = [];

// Читаємо всі 30 файлів
for (let i = 1; i <= 30; i++) {
    const fileName = `batch-${String(i).padStart(2, '0')}.json`;
    const filePath = path.join(batchDir, fileName);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Файл не знайдено: ${fileName}`);
        continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    allExercises = allExercises.concat(data);
}

console.log(`✅ Завантажено ${allExercises.length} вправ з ${path.basename(batchDir)}/`);

// Класифікуємо + будуємо SQL
const lines = [];
lines.push('-- ============================================================');
lines.push('-- ZAL-AI: Оновлення м\'язових груп та типів для всіх вправ');
lines.push(`-- Згенеровано: ${new Date().toISOString()}`);
lines.push(`-- Всього вправ: ${allExercises.length}`);
lines.push('-- ============================================================');
lines.push('');
lines.push('BEGIN;');
lines.push('');

const stats = {};

for (const ex of allExercises) {
    const { muscle, type } = classify(ex);

    // Шукаємо по українській назві (колонка name оновлена перекладом)
    const safeName = (ex.name || ex.id).replace(/'/g, "''");

    // НЕ оновлюємо instructions — вони вже є в базі
    lines.push(
        `UPDATE exercises SET muscle = '${muscle}', type = '${type}' WHERE name = '${safeName}' AND user_id IS NULL;`
    );

    stats[muscle] = (stats[muscle] || 0) + 1;
}

lines.push('');
lines.push('COMMIT;');
lines.push('');
lines.push('-- === СТАТИСТИКА ===');
for (const [m, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    lines.push(`-- ${m}: ${count} вправ`);
}

fs.writeFileSync(outputFile, lines.join('\n'), 'utf-8');

console.log('');
console.log('📊 СТАТИСТИКА КАТЕГОРІЙ:');
for (const [muscle, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.round(count / 10));
    console.log(`   ${muscle.padEnd(12)} ${String(count).padStart(4)} ${bar}`);
}
console.log('');
console.log(`✅ SQL-файл готовий: scripts/update_exercises.sql`);
console.log('');
console.log('👉 Що робити далі:');
console.log('   1. Відкрий https://supabase.com → SQL Editor');
console.log('   2. Вставте весь вміст файлу update_exercises.sql');
console.log('   3. Натисніть "Run"');
