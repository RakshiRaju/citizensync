import { Link } from 'react-router-dom';

export default function Layout({ children, currentUser, onLogout }) {
  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <i className="fa-solid fa-users"></i> CitizenSync
          </Link>
          <div className="nav-links">
            {currentUser ? (
              <>
                {currentUser.role === 'citizen' && (
                  <>
                    <Link to="/citizen/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/citizen/submit-complaint" className="btn btn-primary btn-sm">Report Issue</Link>
                  </>
                )}
                {currentUser.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/admin/departments" className="nav-link">Departments</Link>
                  </>
                )}
                {currentUser.role === 'department' && (
                  <Link to="/department/dashboard" className="nav-link">Dashboard</Link>
                )}
                <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="user-name">
                    {currentUser.displayName || currentUser.email} ({currentUser.role})
                  </span>
                  <button onClick={onLogout} className="btn btn-outline btn-sm">Logout</button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <p>&copy; 2026 CitizenSync Safety & Complaint Management Portal. All rights reserved.</p>
      </footer>
    </>
  );
}
