import { NextResponse } from 'next/server'
import { createServerClient, dbToQuestion } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    const supabase = createServerClient()
    let query = supabase
      .from('questions')
      .select('*')
      .is('deleted_at', null)
      .neq('source', 'seed')
      .order('created_at', { ascending: true })

    if (since) {
      query = query.gt('updated_at', parseInt(since))
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      questions: (data ?? []).map(dbToQuestion),
      count: data?.length ?? 0,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { questions } = body as { questions: ReturnType<typeof dbToQuestion>[] }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'questions array required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { questionToDb } = await import('@/lib/supabase')
    const rows = questions.map(questionToDb)

    const { error } = await supabase
      .from('questions')
      .upsert(rows as any, { onConflict: 'id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, count: rows.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const supabase = createServerClient()
    const { error } = await supabase
      .from('questions')
      .update({ deleted_at: Date.now() } as never)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
