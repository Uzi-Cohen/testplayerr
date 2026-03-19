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
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs sm:text-sm">SK</div>
          <span className="font-bold text-base hidden sm:block">StreamKing</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <NavLink to="/" active={isActive('/')}>Home</NavLink>
          <NavLink to="/movies" active={isActive('/movies')}>Movies</NavLink>
          <NavLink to="/tv" active={isActive('/tv')}>TV</NavLink>
        </div>

        <div className="flex-1" />

        {/* Search — expands on mobile when tapped */}
        <form onSubmit={handleSearch} className="flex items-center">
          {/* Mobile: icon toggles input */}
          <div className={`flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 transition-all ${
            searchOpen ? 'w-44 sm:w-56' : 'w-9 sm:w-auto'
          }`}>
            <button
              type="button"
              onClick={() => setSearchOpen(o => !o)}
              className="shrink-0 sm:pointer-events-none"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search..."
              className={`bg-transparent text-sm outline-none placeholder-gray-500 transition-all ${
                searchOpen ? 'w-full' : 'w-0 sm:w-36 md:w-48'
              }`}
            />
          </div>
        </form>
      </div>
    </nav>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
        active
          ? 'bg-white/15 text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </Link>
  )
}
