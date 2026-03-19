export default function Spinner({ size = 8 }) {
  return (
    <div
      className={`w-${size} h-${size} border-2 border-white/20 border-t-blue-500 rounded-full animate-spin`}
    />
  )
}
