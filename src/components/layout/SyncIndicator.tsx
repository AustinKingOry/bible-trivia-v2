'use client'

import { useSync } from '@/hooks/useSync'

export function SyncIndicator() {
  const { status, lastSyncedAt, dirtyCount, syncNow, isConfigured } = useSync()

  if (!isConfigured) {
    return (
      <div className="px-3 py-2.5 mx-2 mb-2 rounded-lg hidden lg:block"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="text-[9px] text-[#9BA8C4] uppercase tracking-widest mb-1 font-semibold">Cloud Sync</div>
        <div className="text-[10px] text-[#9BA8C4]">Not configured</div>
        <div className="text-[9px] text-[#4A5568] mt-0.5">Add Supabase keys to .env.local</div>
      </div>
    )
  }

  const statusConfig = {
    idle:    { dot: '#9BA8C4', label: 'Ready',    pulse: false },
    syncing: { dot: '#F5C842', label: 'Syncing…', pulse: true  },
    ok:      { dot: '#6DFFAA', label: 'Synced',   pulse: false },
    error:   { dot: '#FF8A80', label: 'Error',    pulse: false },
  }[status]

  const timeLabel = (() => {
    if (!lastSyncedAt) return 'Never synced'
    const diff = Math.floor((Date.now() - lastSyncedAt) / 1000)
    if (diff < 10)  return 'Just now'
    if (diff < 60)  return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })()

  return (
    <div className="px-2 pb-3 hidden lg:block">
      <div className="px-3 py-2.5 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[9px] text-[#9BA8C4] uppercase tracking-widest font-semibold">Cloud Sync</div>
          <button
            onClick={() => syncNow()}
            disabled={status === 'syncing'}
            className="text-[9px] font-semibold transition-colors disabled:opacity-40"
            style={{ color: '#F5C842' }}
            title="Sync now"
          >
            {status === 'syncing' ? '…' : '↑↓'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: statusConfig.dot,
              boxShadow: statusConfig.pulse ? `0 0 6px ${statusConfig.dot}` : undefined,
              animation: statusConfig.pulse ? 'pulse 1s ease-in-out infinite' : undefined,
            }}
          />
          <span className="text-[10px] font-semibold" style={{ color: statusConfig.dot }}>
            {statusConfig.label}
          </span>
        </div>

        <div className="text-[9px] text-[#4A5568]">{timeLabel}</div>

        {dirtyCount > 0 && (
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[9px] text-[#F5C842]">
              {dirtyCount} pending
            </span>
            <button
              onClick={() => syncNow()}
              disabled={status === 'syncing'}
              className="text-[9px] px-1.5 py-0.5 rounded font-semibold transition-all disabled:opacity-40"
              style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842' }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(245,200,66,0.28)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(245,200,66,0.15)')}
            >
              Sync now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-1 text-[9px] text-[#FF8A80]">
            Check console · <button className="underline" onClick={() => syncNow()}>retry</button>
          </div>
        )}
      </div>
    </div>
  )
}
