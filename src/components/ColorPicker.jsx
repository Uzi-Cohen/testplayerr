import { PRESET_COLORS } from '../utils/vidking'

export default function ColorPicker({ color, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Player Color</p>
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map(preset => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            title={preset.name}
            className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
              color === preset.value ? 'border-white scale-110' : 'border-transparent'
            }`}
            style={{ background: `#${preset.value}` }}
          />
        ))}
        <label className="w-7 h-7 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer hover:border-white/60 transition-colors overflow-hidden">
          <input
            type="color"
            value={`#${color}`}
            onChange={e => onChange(e.target.value.replace('#', ''))}
            className="opacity-0 absolute"
          />
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </label>
      </div>
    </div>
  )
}
