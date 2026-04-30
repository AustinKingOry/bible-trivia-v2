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
      <label className="block text-[11px] font-semibold tracking-widest text-[#9BA8C4] uppercase mb-1.5">
        {label} {required && <span className="text-[#FF8A80]">*</span>}
      </label>
      {hint && <p className="text-[10px] text-[#9BA8C4]/70 mb-2">{hint}</p>}
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
      className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none transition-all"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(245,200,66,0.2)',
        fontFamily: 'var(--font-body)',
      }}
      onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
      onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.2)')}
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
      className="w-full px-3 py-2.5 rounded-lg text-sm text-[#F0EDD8] outline-none transition-all resize-none"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(245,200,66,0.2)',
        fontFamily: 'var(--font-body)',
        minHeight: '80px',
      }}
      onFocus={(e) => (e.target.style.borderColor = '#F5C842')}
      onBlur={(e) => (e.target.style.borderColor = 'rgba(245,200,66,0.2)')}
      {...props}
    />
  )
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: 'rgba(245,200,66,0.15)' }} />
      <span className="text-[10px] font-bold tracking-widest text-[#9BA8C4] uppercase">{label}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(245,200,66,0.15)' }} />
    </div>
  )
}
