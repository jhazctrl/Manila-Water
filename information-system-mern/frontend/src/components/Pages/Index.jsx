/**
 * Index.jsx – Public landing page (main dashboard/landing)
 * Structure: header → hero → advisories. No footer.
 * Handles loading, empty, and error states; clean layout and data binding.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../css/s_index.css';

const Index = () => {
  const [advisories, setAdvisories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAdvisories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/advisories/public');
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setAdvisories(res.data.data);
      } else {
        setAdvisories([]);
      }
    } catch (err) {
      console.error('Failed to load advisories:', err);
      setError(err?.message || 'Failed to load advisories.');
      setAdvisories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvisories();
  }, [fetchAdvisories]);

  const filtered = advisories.filter(
    (a) =>
      (a.street_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.brgy_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.advisory_description || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date, time) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formatted = `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      if (time) {
        const [h, m] = String(time).split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${formatted}, ${String(h12).padStart(2, '0')}:${m || '00'} ${ampm}`;
      }
      return formatted;
    } catch {
      return String(date);
    }
  };

  return (
    <div className="index-page">
      <header className="index-header">
        <div
          className="index-header__logo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onKeyDown={(e) => e.key === 'Enter' && window.scrollTo({ top: 0, behavior: 'smooth' })}
          role="button"
          tabIndex={0}
          aria-label="Scroll to top"
        >
          <img src="/img/logo_sampaloc.png" alt="Sampaloc" className="index-header__img" />
          <img src="/img/logo_mnlwater.png" alt="Manila Water" className="index-header__img" />
          <div className="index-header__brand">
            <h1>MANILA WATER</h1>
            <p>CARE IN EVERY DROP</p>
          </div>
        </div>
        <div className="index-header__actions">
          <button type="button" className="index-header__btn index-header__btn--secondary" onClick={() => navigate('/login')}>
            Log In
          </button>
          <button type="button" className="index-header__btn index-header__btn--primary" onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>
      </header>

      <main className="index-main">
        <section className="index-hero" aria-label="Hero">
          <div className="index-hero__bg">
            <img src="/img/bg_homepage.jpg" alt="" />
            <span className="index-hero__overlay" aria-hidden />
          </div>
          <div className="index-hero__content">
            <img src="/img/logo_main.png" alt="Manila Water" className="index-hero__logo" />
          </div>
        </section>

        <section className="index-advisories" aria-label="Water interruption advisories">
          <h2 className="index-advisories__title">WATER INTERRUPTION ADVISORIES</h2>

          <div className="index-advisories__search">
            <span className="index-advisories__search-icon" aria-hidden>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Type in Barangay / Address for report check"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="index-advisories__search-input"
              aria-label="Search advisories"
            />
          </div>

          <div className="index-advisories__table-wrap">
            <div className="index-advisories__table-scroll">
              <table className="index-advisories__table">
                <thead>
                  <tr>
                    <th>TYPE</th>
                    <th>DESCRIPTION</th>
                    <th>START</th>
                    <th>END</th>
                    <th>LOCATION</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="index-advisories__empty">
                        Loading advisories…
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={6} className="index-advisories__empty index-advisories__empty--error">
                        {error}
                        <button type="button" className="index-advisories__retry" onClick={fetchAdvisories}>
                          Try again
                        </button>
                      </td>
                    </tr>
                  )}
                  {!loading && !error && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="index-advisories__empty">
                        No advisories found matching your search.
                      </td>
                    </tr>
                  )}
                  {!loading && !error && filtered.length > 0 &&
                    filtered.map((adv, idx) => (
                      <tr key={adv.advisory_id || adv._id || idx}>
                        <td>{adv.advisory_type || 'Water Quality'}</td>
                        <td className="index-advisories__desc" title={adv.advisory_description}>
                          {adv.advisory_description}
                        </td>
                        <td className="index-advisories__date">{formatDate(adv.start_date, adv.start_time)}</td>
                        <td className="index-advisories__date">{formatDate(adv.end_date, adv.end_time)}</td>
                        <td>{[adv.street_name, adv.brgy_number].filter(Boolean).join(', ')}</td>
                        <td>
                          <span className={`index-advisories__pill index-advisories__pill--${(adv.status || '').toLowerCase()}`}>
                            {adv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
