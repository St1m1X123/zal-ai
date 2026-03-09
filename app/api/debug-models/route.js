import { NextResponse } from 'next/server'

export async function GET() {
    const key = process.env.GEMINI_API_KEY
    if (!key) return NextResponse.json({ error: 'No GEMINI_API_KEY' })

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=50`
    )
    const data = await res.json()

    // Show only model names
    const models = data.models?.map(m => m.name) || []
    return NextResponse.json({ models, raw: data })
}
