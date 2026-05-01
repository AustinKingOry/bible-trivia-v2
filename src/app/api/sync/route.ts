import { NextResponse } from 'next/server'
import { createServerClient, questionToDb, sessionToDb, teamToDb, roundToDb, activityToDb, dbToQuestion } from '@/lib/supabase'
import type { Question, Session, Team, Round, Activity } from '@/types'

interface SyncRequestBody {
  questions?:  Question[]
  sessions?:   Session[]
  teams?:      Team[]
  rounds?:     Round[]
  activities?: Activity[]
  lastPulledAt?: number
}

export async function POST(request: Request) {
  try {
    const body: SyncRequestBody = await request.json()
    const supabase = createServerClient()
    const errors: string[] = []

    // ── PUSH ─────────────────────────────────────────────────────────────────
    const pushTable = async <T>(
      table: string,
      rows: T[]
    ): Promise<void> => {
      if (!rows.length) return
      const { error } = await supabase.from(table as any).upsert(rows as any, { onConflict: 'id' })
      if (error) errors.push(`${table}: ${error.message}`)
    }

    await Promise.all([
      pushTable('questions',  (body.questions  ?? []).map(questionToDb)),
      pushTable('sessions',   (body.sessions   ?? []).map(sessionToDb)),
      pushTable('teams',      (body.teams      ?? []).map(teamToDb)),
      pushTable('rounds',     (body.rounds     ?? []).map(roundToDb)),
      pushTable('activities', (body.activities ?? []).map(activityToDb)),
    ])

    // ── PULL questions ────────────────────────────────────────────────────────
    let pulled: Question[] = []
    let pullQuery = supabase
      .from('questions')
      .select('*')
      .is('deleted_at', null)
      .neq('source', 'seed')
      .order('created_at', { ascending: true })

    if (body.lastPulledAt) {
      pullQuery = pullQuery.gt('updated_at', body.lastPulledAt)
    }

    const { data: pullData, error: pullError } = await pullQuery
    if (pullError) {
      errors.push(`pull: ${pullError.message}`)
    } else {
      pulled = (pullData ?? []).map(dbToQuestion)
    }

    return NextResponse.json({
      ok: errors.length === 0,
      errors,
      pulled,
      syncedAt: Date.now(),
      counts: {
        questions:  body.questions?.length  ?? 0,
        sessions:   body.sessions?.length   ?? 0,
        teams:      body.teams?.length      ?? 0,
        rounds:     body.rounds?.length     ?? 0,
        activities: body.activities?.length ?? 0,
        pulled:     pulled.length,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
