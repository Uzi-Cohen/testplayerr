import { Link, useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Home',     path: '/' },
  { label: 'Movies',   path: '/movies' },
  { label: 'TV Shows', path: '/tv' },
  { label: 'My List',  path: '/watchlist' },
  { label: '🔍 Search', path: '/search' },
]

// surpriseFn: optional callback for the Surprise Me button (passes trending data down)
export default function Navbar({ navFocused = false, navCol = 0, onSurpriseMe }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="tv-navbar">
      {/* Logo */}
      <Link to="/" className="tv-navbar__logo">
        <span className="tv-navbar__logo-box">SK</span>
        <span className="tv-navbar__logo-text">StreamKing</span>
      </Link>

      {/* Nav links */}
      <div className="tv-navbar__links">
        {NAV_ITEMS.map((item, i) => {
          const isActive  = location.pathname === item.path
          const isFocused = navFocused && navCol === i
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={[
                'tv-navbar__link',
                isActive  ? 'tv-navbar__link--active'  : '',
                isFocused ? 'tv-navbar__link--focused' : '',
              ].join(' ')}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Surprise Me */}
      {onSurpriseMe && (
        <button className="tv-navbar__surprise" onClick={onSurpriseMe} title="Play something random">
          🎲 Surprise Me
        </button>
      )}
    </nav>
  )
}

export { NAV_ITEMS }
