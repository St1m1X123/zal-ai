# 🏋️‍♂️ ZalAI: PWA-трекер тренувань з AI-естетикою

**Поточна версія:** 3.0 — Neural Athlete Pro (GitHub Secured)
**Головна фішка (v3):** AI-генерація повноцінних програм. Додаток не просто трекер, а кишеньковий тренер, який складає плани на тиждень, враховуючи цілі та історію занять.

---

## 🤝 Правила розробки (Конституція проєкту)
1. **Правило 50/50:** Жоден рядок коду не пишеться без обопільного затвердження. Спочатку логіка — потім код.
2. **Якість важливіша за швидкість:** Якщо є рішення складніше, але правильніше — обираємо його.
3. **Обов'язки ШІ:** Критикувати ідеї, пропонувати найкращі альтернативи.
4. **UX мобільності:** Завжди пам'ятати, що користувач у залі, в нього пітні руки і мало часу. Кнопки мають бути великими, а дії — швидкими.
5. **Безпека лімітів:** Всі AI-функції повинні бути захищені білим списком (Whitelist), щоб уникнути перевитрат на GitHub.

---

## 🎨 Дизайн-система "Neural Athlete Pro" (v3.0)

| Параметр | Значення |
|---|---|
| **Стиль** | Ultra-Premium dark, glassmorphism, Neural-glow |
| **Фон** | `#080b10` + animated shadow orbs + dot grid |
| **Акцент 1 (Lime)** | `#A3E635` — Сила, прогрес, виконання |
| **Акцент 2 (Cyan)** | `#22D3EE` — AI-функції, суперсети, аналітика |
| **Текст** | White (opacity: 90/60/40), Lime (для PR), Cyan (для AI) |
| **Шрифт** | Space Grotesk (UI), JetBrains Mono (Цифри) |

### Ключові UX-рішення v3
- **Nested Exercise Picker** — пошук вправ розгортається всередині модалки конфігуратора (не перевантажує форму).
- **Info Icon (i)** — прямий перехід до сторінки вправи без втрати стану конфігуратора.
- **State Persistence** — використання `sessionStorage` + `hasFetched` ref для безперебійного відновлення вибору при навігації.
- **Secret Dev Mode** — 5 кліків на версію в профілі відкривають адмін-тумблер Pro-статусу.

---

## 🗄 Структура Бази Даних (Supabase)

### 1. `profiles`
* `gender`, `age`, `height_cm`, `weight_kg`, `goal`, `experience`, `location`, `equipment`, `days_per_week`, `duration_min`, `health_tags`, `health_notes`, `is_pro` [NEW].

### 2. `exercises` (800+ вправ)
* `id`, `name`, `type` (`weight`, `bodyweight`, `time`), `muscle`, `muscle_group`, `instructions`, `gif_url`.

### 3. `programs`
* `id`, `user_id`, `name`, `goal`, `days_per_week`.

### 4. `workouts`
* `program_id`, `is_template`, `status` (`in_progress`, `completed`), `date`.

---

## 📁 Структура файлів

```
/
├── app/
│   ├── api/
│   │   ├── generate-program/   ← [SECURE] Генерація програм + Whitelist check
│   │   ├── generate-workout/   ← [SECURE] Генерація тренування + Whitelist check
│   │   └── debug-models/       ← Інструмент перевірки LLM моделей
│   ├── onboarding/             ← Покрокова анкета (BMI, цілі, інвентар)
│   ├── programs/               ← Керування програмами та AI-планами
│   ├── exercises/[id]/         ← Деталі вправи: техніка + PR сторінка
│   ├── workout/[id]/           ← Бойовий екран (Timer, Sets, Deletion)
│   ├── create-workout/         ← Конструктор вільного тренування
│   ├── template/[id]/          ← Редактор та перегляд шаблонів
│   ├── auth/                   ← OAuth callback та логіка авторизації
│   ├── profile/                ← Картка атлета (Heat-map, PRs, Secret Mode)
│   ├── page.js                 ← Головна: Dashboard + Neural Configurator
│   └── layout.js               ← Fonts, Global Styles, Navbar
├── lib/
│   └── supabase.js             ← Ініціалізація та налаштування клієнта DB
├── .env.example                ← Шаблон з інструкціями по безпеці та Whitelist
├── PROJECT_MAP.md              ← Цей файл (Source of Truth)
└── [Configs]                   ← tailwind.config, package.json
```

---

## 🛡 Безпека та Whitelist
Для захисту API від несанкціонованого використання на GitHub впроваджено:
- **Environment Whitelist**: Змінна `ADMIN_EMAILS` у `.env.local` містить список дозволених пошт.
- **Server Guard**: Кожен запит до AI перевіряється на відповідність email користувача списку адмінів.

---

## 🗺 Дорожня карта (Roadmap)

- [x] **v3.0:** AI-програми, Onboarding, Exercise Detail Pages
- [x] **v3.1:** GitHub Security Layer, State Recovery, Nested Picker
- [ ] **v3.5:** PWA Offline-mode, Push-сповіщення
- [ ] **v4.0:** AI-Vision (аналіз техніки через камеру)
