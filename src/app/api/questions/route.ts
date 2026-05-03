import { NextResponse } from 'next/server'
import {
  createServerClient,
  questionToDb,
  dbToQuestion,
} from '@/lib/supabase'
import type { Question } from '@/types'

// ─── Auth helper ──────────────────────────────────────────────────────────────
// Verifies the Bearer token from the Authorization header and returns the userId.
// Returns null if the token is missing or invalid.

async function getUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    return data.user.id
  } catch {
    return null
  }
}

// ─── GET /api/questions ───────────────────────────────────────────────────────
// Returns all non-deleted custom questions belonging to the authenticated user.
// Supports ?since=<unix_ms> for incremental pulls.
// Public (unauthenticated) reads return only questions with no user_id (shared bank).

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const since  = searchParams.get('since')
    const userId = await getUserId(request)

    const supabase = createServerClient()

    let query = supabase
      .from('questions')
      .select('*')
      .is('deleted_at', null)
      .neq('source', 'seed')
      .order('created_at', { ascending: true })

    if (userId) {
      // Authenticated: return this user's questions
      query = query.eq('user_id', userId) as any
    } else {
      // Unauthenticated: return only shared/public questions (user_id = null)
      query = query.is('user_id', null) as any
    }

    if (since) {
      query = query.gt('updated_at', parseInt(since)) as any
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      questions: (data ?? []).map(dbToQuestion),
      count:     data?.length ?? 0,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ─── POST /api/questions ──────────────────────────────────────────────────────
// Upserts an array of questions. Requires authentication.
// Body: { questions: Question[] }

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { questions } = body as { questions: Question[] }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'questions array required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const rows = questions.map((q) => questionToDb(q, userId))

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

// ─── DELETE /api/questions?id=<id> ────────────────────────────────────────────
// Soft-deletes a question. Only the owning user may delete their question.

export async function DELETE(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Only soft-delete rows owned by this user (RLS also enforces this)
    const { error } = await supabase
      .from('questions')
      .update({ deleted_at: Date.now() } as never)
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}