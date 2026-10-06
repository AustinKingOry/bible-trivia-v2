'use client'

interface FieldProps {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ label, hint, required, children }: FieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {hint && <p className="text-[10px] text-muted-foreground/70 mb-2">{hint}</p>}
      {children}
    </div>
  )
}

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string
  onChange: (value: string) => void
}

export function Input({ value, onChange, ...props }: InputProps) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden transition-all"
      style={{
        background: 'color-mix(in oklab, var(--foreground) 6%, transparent)',
        border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)',
        fontFamily: 'var(--font-body)',
      }}
      onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
      onBlur={(e) => (e.target.style.borderColor = 'color-mix(in oklab, var(--primary) 20%, transparent)')}
      {...props}
    />
  )
}
 
interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  value: string
  onChange: (value: string) => void
}

export function Textarea({ value, onChange, ...props }: TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-lg text-sm text-foreground outline-hidden transition-all resize-none"
      style={{
        background: 'color-mix(in oklab, var(--foreground) 6%, transparent)',
        border: '1px solid color-mix(in oklab, var(--primary) 20%, transparent)',
        fontFamily: 'var(--font-body)',
        minHeight: '80px',
      }}
      onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
      onBlur={(e) => (e.target.style.borderColor = 'color-mix(in oklab, var(--primary) 20%, transparent)')}
      {...props}
    />
  )
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: 'color-mix(in oklab, var(--primary) 15%, transparent)' }} />
      <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</span>
      <div className="flex-1 h-px" style={{ background: 'color-mix(in oklab, var(--primary) 15%, transparent)' }} />
    </div>
  )
}
