export default function Spinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full animate-spin"
        style={{
          border: '2px solid rgba(26,127,212,0.15)',
          borderTop: '2px solid #1a9fff',
          boxShadow: '0 0 12px rgba(26,159,255,0.4)',
        }}
      />
      <p className="font-display text-xs uppercase tracking-widest" style={{ color: '#2a4a6a' }}>Loading...</p>
    </div>
  )
}
