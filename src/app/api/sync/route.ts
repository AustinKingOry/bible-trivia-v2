import { NextResponse } from 'next/server'
import {
  createServerClient,
  questionToDb,       dbToQuestion,
  sessionToDb,
  teamToDb,
  roundToDb,
  activityToDb,
  categorySettingsToDb, dbToCategorySettings,
} from '@/lib/supabase'
import type { Question, Session, Team, Round, Activity, CategorySettings } from '@/types'

// ─── Auth helper ──────────────────────────────────────────────────────────────

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

// ─── Request body ─────────────────────────────────────────────────────────────

interface SyncRequestBody {
  questions?:        Question[]
  sessions?:         Session[]
  teams?:            Team[]
  rounds?:           Round[]
  activities?:       Activity[]
  categorySettings?: CategorySettings[]
  lastPulledAt?:     number
}

// ─── POST /api/sync ───────────────────────────────────────────────────────────
// Full bidirectional sync:
//   PUSH → upsert all dirty records sent from the client
//   PULL → return any records updated since lastPulledAt
//
// Requires authentication. All rows are tagged with user_id on write.

export async function POST(request: Request) {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body: SyncRequestBody = await request.json()
    const supabase = createServerClient()
    const errors:   string[] = []

    // ── Generic push helper ────────────────────────────────────────────────
    const pushTable = async (table: string, rows: unknown[]): Promise<void> => {
      if (!rows.length) return
      const { error } = await supabase.from(table as any).upsert(rows as any, { onConflict: 'id' })
      if (error) errors.push(`${table}: ${error.message}`)
    }

    // ── PUSH all dirty records (parallel) ──────────────────────────────────
    await Promise.all([
      pushTable('questions',
        (body.questions ?? []).map((q)  => questionToDb(q, userId))),

      pushTable('sessions',
        (body.sessions  ?? []).map((s)  => sessionToDb(s, userId))),

      pushTable('teams',
        (body.teams     ?? []).map((t)  => teamToDb(t, userId))),

      pushTable('rounds',
        (body.rounds    ?? []).map((r)  => roundToDb(r, userId))),

      pushTable('activities',
        (body.activities ?? []).map((a) => activityToDb(a, userId))),

      pushTable('category_settings',
        (body.categorySettings ?? []).map((cs) => categorySettingsToDb(cs, userId))),
    ])

    // ── PULL questions (own + public) ──────────────────────────────────────
    let pulledQuestions: Question[] = []
    {
      let q = supabase
        .from('questions')
        .select('*')
        .is('deleted_at', null)
        .neq('source', 'seed')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: true })

      if (body.lastPulledAt) {
        q = q.gt('updated_at', body.lastPulledAt) as any
      }

      const { data, error } = await q
      if (error) errors.push(`pull questions: ${error.message}`)
      else pulledQuestions = (data ?? []).map(dbToQuestion)
    }

    // ── PULL category_settings (own only) ──────────────────────────────────
    let pulledCategorySettings: CategorySettings[] = []
    {
      let q = (supabase.from as any)('category_settings')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (body.lastPulledAt) {
        q = q.gt('updated_at', body.lastPulledAt)
      }

      const { data, error } = await q
      if (error) errors.push(`pull category_settings: ${error.message}`)
      else pulledCategorySettings = (data ?? []).map(dbToCategorySettings)
    }

    return NextResponse.json({
      ok:      errors.length === 0,
      errors,
      syncedAt: Date.now(),
      pulled: {
        questions:        pulledQuestions,
        categorySettings: pulledCategorySettings,
      },
      counts: {
        pushed: {
          questions:        body.questions?.length        ?? 0,
          sessions:         body.sessions?.length         ?? 0,
          teams:            body.teams?.length            ?? 0,
          rounds:           body.rounds?.length           ?? 0,
          activities:       body.activities?.length       ?? 0,
          categorySettings: body.categorySettings?.length ?? 0,
        },
        pulled: {
          questions:        pulledQuestions.length,
          categorySettings: pulledCategorySettings.length,
        },
      },
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}