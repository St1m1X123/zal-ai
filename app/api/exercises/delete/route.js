import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const userId = searchParams.get('userId')

        if (!id || !userId) {
            return NextResponse.json({ error: 'Missing exercise ID or user ID' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (!supabaseServiceKey) {
             return NextResponse.json({ error: 'Server configuration error: missing service key' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Verify ownership
        const { data: exercise, error: fetchError } = await supabase
            .from('exercises')
            .select('created_by')
            .eq('id', id)
            .single()

        if (fetchError || !exercise) {
            return NextResponse.json({ error: 'Вправу не знайдено або вже видалено' }, { status: 404 })
        }

        if (exercise.created_by !== userId && exercise.created_by !== null) {
            return NextResponse.json({ error: 'Ви можете видаляти лише свої власні вправи' }, { status: 403 })
        }

        // 2. Delete the exercise securely bypassing RLS
        const { error: deleteError } = await supabase
            .from('exercises')
            .delete()
            .eq('id', id)

        if (deleteError) {
             if (deleteError.message.includes('violates foreign key constraint') || deleteError.message.includes('foreign key')) {
                 return NextResponse.json({ error: 'Ця вправа вже збережена у ваших тренуваннях або шаблонах. Для видалення спочатку приберіть її звідти.' }, { status: 400 })
             }
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (e) {
        return NextResponse.json({ error: e.message || 'Невідома помилка' }, { status: 500 })
    }
}
