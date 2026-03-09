// Швидкий дебаг-скрипт: показує всі вправи категорії "Інше"
// Запуск: node scripts/debug-other.js

const fs = require('fs');
const path = require('path');

const batchDir = path.join(__dirname, 'translated');
let all = [];
for (let i = 1; i <= 30; i++) {
    const f = path.join(batchDir, `batch-${String(i).padStart(2, '0')}.json`);
    if (fs.existsSync(f)) all = all.concat(JSON.parse(fs.readFileSync(f, 'utf-8')));
}

// Самі правила — копія з основного скрипта
const MUSCLE_RULES = [
    { muscle: 'Груди', keywords: ['bench press', 'жим лежачи', 'chest', 'груди', 'грудн', 'pec', 'flye', 'fly', 'розведення', 'кросовер', 'crossover', 'push-up', 'віджиман', 'dips - chest', 'cable fly', 'зведення'] },
    { muscle: 'Спина', keywords: ['deadlift', 'станова', 'pull-up', 'підтягуван', 'row', 'тяга', 'lat', 'широчайш', 'back', 'спина', 'спин', 'hyperextension', 'гіперекстензія', 'good morning', 'наклон', 'pulldown', 'тяга зверху', 'шраги', 'shrug', 'traps', 'трапеці', 'superman', 'човник'] },
    { muscle: 'Ноги', keywords: ['squat', 'присід', 'leg press', 'жим ногами', 'lunge', 'випад', 'deadlift romanian', 'румунська', 'leg curl', 'leg extension', 'calf', 'гомілка', 'стрибок', 'bound', 'jump', 'стрибати', 'hamstring', 'біцепс стегна', 'quad', 'квадрицепс', 'glute', 'сідниц', 'adductor', 'привідн', 'hip thrust', 'abductor', 'відвідн', 'step up', 'скакалк', 'box jump'] },
    { muscle: 'Плечі', keywords: ['shoulder', 'плеч', 'press overhead', 'жим над головою', 'lateral raise', 'підйом через сторони', 'front raise', 'підйом перед', 'arnold', 'арнольд', 'deltoid', 'дельт', 'military press', 'seated press', 'upright row', 'тяга до підборіддя', 'face pull', 'reverse fly', 'зворотне розведення', 'jerk', 'snatch', 'ривок', 'поштовх', 'cuban press', 'кубинськ'] },
    { muscle: 'Руки', keywords: ['curl', 'згинання', 'bicep', 'біцепс', 'hammer curl', 'молоток', 'tricep', 'трицепс', 'french press', 'французький жим', 'skull crusher', 'extension', 'розгинання руки', 'forearm', 'передпліч', 'wrist', "зап'ястя", 'grip', 'хват', 'dip machine', 'dips - triceps', 'kickback', 'close-grip', 'вузьким хватом'] },
    { muscle: 'Прес', keywords: ['crunch', 'скручуван', 'ab ', 'abs', ' ab', 'прес', 'sit-up', 'підйом тулуба', 'plank', 'планка', 'leg raise', 'підйом ніг', 'oblique', 'косий', 'russian twist', 'dead bug', 'мертвий жук', 'mountain climber', 'альпініст', 'hanging knee', 'висячи', 'roller', 'ролик для преса', 'bicycle', 'велосипед', 'tuck', 'hollow'] },
    { muscle: 'Кардіо', keywords: ['run', 'біг', 'jog', 'treadmill', 'бігова доріжка', 'cycling', 'bike', 'велосипед тренажер', 'elliptical', 'еліпсоїд', 'rowing machine', 'гребний', 'jump rope', 'скакалка', 'burpee', 'берпі', 'hiit', 'circuit', 'кроси', 'cardio', 'кардіо', 'sprint', 'спринт', 'swim', 'плаван', 'stair', 'сходинки', 'step mill', 'аеробік'] },
    { muscle: 'Розтяжка', keywords: ['stretch', 'розтяжк', 'smr', 'смр', 'foam roll', 'масажн валик', 'myofascial', 'міофасціальн', 'mobility', 'мобільн', 'flexibility', 'гнучкість', 'релакс', 'relax', 'warm-up', 'warm up', 'розминк', 'cool down', 'заминк', 'yoga', 'йога', 'pilates', 'пілатес', 'self-massage', 'самомасаж'] },
];

function classify(ex) {
    const combined = ex.id.toLowerCase().replace(/_/g, ' ') + ' ' + (ex.name || '').toLowerCase();
    for (const r of MUSCLE_RULES) {
        if (r.keywords.some(kw => combined.includes(kw.toLowerCase()))) return r.muscle;
    }
    return 'Інше';
}

const others = all.filter(ex => classify(ex) === 'Інше');
console.log(`\n🔍 Вправи категорії "Інше" (${others.length}):\n`);
others.forEach(ex => console.log(`  [${ex.id}]  ${ex.name}`));
