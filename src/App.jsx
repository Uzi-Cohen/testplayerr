import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import TVShows from './pages/TVShows'
import Watch from './pages/Watch'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/movies"        element={<Movies />} />
          <Route path="/tv"            element={<TVShows />} />
          <Route path="/watch/movie/:id" element={<Watch />} />
          <Route path="/watch/tv/:id"    element={<Watch />} />
          <Route path="/search"        element={<SearchPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
