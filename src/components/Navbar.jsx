import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
      setSearchOpen(false)
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'linear-gradient(180deg, #060c18 0%, #08111f 100%)',
      borderBottom: '1px solid rgba(26, 127, 212, 0.3)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.8), 0 1px 0 rgba(26,159,255,0.15)',
    }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-3 sm:gap-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
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

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 opacity-20"
          style={{ background: 'linear-gradient(180deg, transparent, #1a9fff, transparent)' }} />

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          <NavLink to="/" active={isActive('/')}>Home</NavLink>
          <NavLink to="/movies" active={isActive('/movies')}>Movies</NavLink>
          <NavLink to="/tv" active={isActive('/tv')}>TV Shows</NavLink>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center">
          <div className={`flex items-center gap-2 rounded px-2.5 py-1.5 transition-all duration-200 ${
            searchOpen ? 'w-44 sm:w-56' : 'w-9 sm:w-auto'
          }`} style={{
            background: 'rgba(13, 22, 38, 0.9)',
            border: '1px solid rgba(26,127,212,0.25)',
            boxShadow: searchOpen ? '0 0 10px rgba(26,127,212,0.2)' : 'none',
          }}>
            <button type="button" onClick={() => setSearchOpen(o => !o)} className="shrink-0 sm:pointer-events-none">
              <svg className="w-4 h-4" style={{ color: '#7ecfff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search titles..."
              className={`bg-transparent text-sm outline-none transition-all placeholder-blue-900 text-blue-100 ${
                searchOpen ? 'w-full' : 'w-0 sm:w-32 md:w-44'
              }`}
            />
          </div>
        </form>
      </div>

      {/* Bottom glow line */}
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
      } : {
        color: '#6a8fad',
      }}
    >
      {children}
    </Link>
  )
}
