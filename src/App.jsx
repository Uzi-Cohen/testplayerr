import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Movies from './pages/Movies'
import TVShows from './pages/TVShows'
import Watch from './pages/Watch'
import SearchPage from './pages/SearchPage'
import { useSpatialNav } from './hooks/useSpatialNav'

// Inner component so hooks can use router context
function AppInner() {
  const navigate = useNavigate()
  useSpatialNav()

  // Handle Android TV back button (Escape or MediaStop)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === 'BrowserBack' || e.key === 'GoBack') {
        navigate(-1)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/tv" element={<TVShows />} />
        <Route path="/watch/movie/:id" element={<Watch />} />
        <Route path="/watch/tv/:id" element={<Watch />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
