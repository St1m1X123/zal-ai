-- 1. Створюємо таблицю programs
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    goal TEXT,
    days_per_week INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Додаємо RLS для programs
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own programs"
    ON programs FOR ALL
    USING (auth.uid() = user_id);

-- 3. Додаємо зв'язок у таблицю workouts
-- (Щоб тренування знали, до якої програми вони належать)
ALTER TABLE workouts ADD COLUMN program_id UUID REFERENCES programs(id) ON DELETE CASCADE;

-- 4. Створюємо індекси для швидкодії
CREATE INDEX idx_programs_user_id ON programs(user_id);
CREATE INDEX idx_workouts_program_id ON workouts(program_id);
