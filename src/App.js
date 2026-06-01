import React, { useState, useEffect } from 'react';
import './App.css';

const MOVIES_PER_PAGE = 12;

// Helper: parse date string like "30/10/95" into a localized date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // months are 0-indexed
  let year = parseInt(parts[2]);
  // Assume 2-digit years: 00-29 => 2000s, 30-99 => 1900s
  if (year < 100) {
    year = year < 30 ? 2000 + year : 1900 + year;
  }
  const date = new Date(year, month, day);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Star rating display (simple text stars)
function renderStars(vote) {
  const stars = Math.round(vote) / 2; // convert 0-10 to 0-5
  const full = Math.floor(stars);
  const half = stars % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// Color class based on rating
function ratingClass(vote) {
  if (vote >= 7) return 'rating-high';
  if (vote >= 5) return 'rating-mid';
  return 'rating-low';
}

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('none');
  const [currentPage, setCurrentPage] = useState(1);

  // Escape key to go back from detail view
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && selectedMovie) {
        setSelectedMovie(null);
        window.scrollTo(0, 0);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMovie]);

  // Fetch all movies on load
  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch('/api/movies');
        const payload = await response.json();
        setMovies(payload.data);
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      }
      setLoading(false);
    }
    fetchMovies();
  }, []);

  // Filter and sort movies
  let filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (sortOrder === 'high') {
    filtered = [...filtered].sort((a, b) => b.vote_average - a.vote_average);
  } else if (sortOrder === 'low') {
    filtered = [...filtered].sort((a, b) => a.vote_average - b.vote_average);
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / MOVIES_PER_PAGE);
  const startIndex = (currentPage - 1) * MOVIES_PER_PAGE;
  const paginatedMovies = filtered.slice(startIndex, startIndex + MOVIES_PER_PAGE);

  // Reset to page 1 when search or sort changes
  function handleSearchChange(e) {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }
  function handleSortChange(e) {
    setSortOrder(e.target.value);
    setCurrentPage(1);
  }

  // When a movie card is clicked, fetch its details
  async function handleMovieClick(id) {
    try {
      const response = await fetch('/api/movies/' + id);
      const payload = await response.json();
      setSelectedMovie(payload.data);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Failed to fetch movie details:', err);
    }
  }

  // Go back to list
  function handleBack() {
    setSelectedMovie(null);
    window.scrollTo(0, 0);
  }

  // ---- DETAIL VIEW ----
  if (selectedMovie) {
    const movie = selectedMovie;
    return (
      <div className="App">
        <div className="detail-page">
          <button className="back-button" onClick={handleBack}>
            ← Back to Movies
          </button>
          <div className="detail-card">
            <h1 className="detail-title">{movie.title}</h1>
            {movie.tagline && (
              <p className="detail-tagline">"{movie.tagline}"</p>
            )}
            <div className="detail-meta">
              <span className="detail-badge">
                ⭐ {movie.vote_average} / 10
              </span>
              <span className="detail-badge">
                🗳️ {movie.vote_count} votes
              </span>
              <span className="detail-badge">
                ⏱️ {movie.runtime} minutes
              </span>
              <span className="detail-badge">
                📅 {formatDate(movie.release_date)}
              </span>
              <span className="detail-badge">
                📌 {movie.status}
              </span>
            </div>
            <div className="detail-section">
              <h3>Overview</h3>
              <p>{movie.overview || 'No overview available.'}</p>
            </div>
            <div className="detail-section">
              <h3>Additional Details</h3>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <td><strong>Original Title</strong></td>
                    <td>{movie.original_title}</td>
                  </tr>
                  <tr>
                    <td><strong>Release Date</strong></td>
                    <td>{formatDate(movie.release_date)}</td>
                  </tr>
                  <tr>
                    <td><strong>Runtime</strong></td>
                    <td>{movie.runtime} minutes</td>
                  </tr>
                  <tr>
                    <td><strong>Status</strong></td>
                    <td>{movie.status}</td>
                  </tr>
                  <tr>
                    <td><strong>Vote Average</strong></td>
                    <td>{movie.vote_average} / 10</td>
                  </tr>
                  <tr>
                    <td><strong>Vote Count</strong></td>
                    <td>{movie.vote_count}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- LIST VIEW ----
  return (
    <div className="App">
      <header className="app-header">
        <h1>🎬 Movie Browser</h1>
        <p className="app-subtitle">
          Browse our collection of {movies.length} movies
        </p>
        <div className="controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search movies by title..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select
            className="sort-select"
            value={sortOrder}
            onChange={handleSortChange}
          >
            <option value="none">Sort by</option>
            <option value="high">Rating: High → Low</option>
            <option value="low">Rating: Low → High</option>
          </select>
        </div>
      </header>

      {loading ? (
        <p className="loading">Loading movies...</p>
      ) : filtered.length === 0 ? (
        <p className="loading">No movies found for "{searchTerm}"</p>
      ) : (
        <>
          <div className="movie-grid">
            {paginatedMovies.map((movie) => (
              <div
                key={movie.id}
                className="movie-card"
                onClick={() => handleMovieClick(movie.id)}
              >
                <h2 className="movie-title">{movie.title}</h2>
                <p className="movie-tagline">
                  {movie.tagline || 'No tagline available'}
                </p>
                <div className="movie-rating">
                  <span className="stars">{renderStars(movie.vote_average)}</span>
                  <span className={'rating-number ' + ratingClass(movie.vote_average)}>
                    {movie.vote_average} / 10
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="results-count">
            Showing {startIndex + 1}–{Math.min(startIndex + MOVIES_PER_PAGE, filtered.length)} of {filtered.length} movies
          </p>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(currentPage - 1); window.scrollTo(0, 0); }}
              >
                ← Prev
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => { setCurrentPage(currentPage + 1); window.scrollTo(0, 0); }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
