import { Link, useLocation } from 'react-router-dom'
import SearchAutocomplete from './SearchAutocomplete'

export default function Navbar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'linear-gradient(180deg, #060c18 0%, #08111f 100%)',
      borderBottom: '1px solid rgba(26, 127, 212, 0.3)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.8), 0 1px 0 rgba(26,159,255,0.15)',
    }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-14 flex items-center gap-3 sm:gap-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded flex items-center justify-center font-display font-bold text-xs"
            style={{
              background: 'linear-gradient(135deg, #1a7fd4, #0d4a8a)',
              boxShadow: '0 0 14px rgba(26,127,212,0.7)',
              border: '1px solid rgba(100,180,255,0.3)',
            }}>
            SK
          </div>
          <span className="font-display font-bold text-base uppercase tracking-widest hidden sm:block"
            style={{ textShadow: '0 0 12px rgba(126,207,255,0.5)', color: '#c8e8ff' }}>
            StreamKing
          </span>
        </Link>

        <div className="hidden sm:block w-px h-6 opacity-20"
          style={{ background: 'linear-gradient(180deg, transparent, #1a9fff, transparent)' }} />

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          <NavLink to="/" active={isActive('/')}>Home</NavLink>
          <NavLink to="/movies" active={isActive('/movies')}>Movies</NavLink>
          <NavLink to="/tv" active={isActive('/tv')}>TV Shows</NavLink>
        </div>

        <div className="flex-1" />

        {/* Live autocomplete search */}
        <SearchAutocomplete />
      </div>

      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(26,159,255,0.4) 40%, rgba(26,159,255,0.4) 60%, transparent 100%)' }} />
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 rounded text-xs sm:text-sm font-display uppercase tracking-wider transition-all duration-200"
      style={active ? {
        color: '#7ecfff',
        background: 'rgba(26,127,212,0.2)',
        textShadow: '0 0 10px rgba(126,207,255,0.7)',
        boxShadow: '0 0 8px rgba(26,127,212,0.2)',
      } : { color: '#6a8fad' }}
    >
      {children}
    </Link>
  )
}
