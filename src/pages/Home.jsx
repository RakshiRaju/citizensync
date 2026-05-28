import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1>Report Issues. Build Better Cities.</h1>
        <p>CitizenSync is a modern platform connecting citizens directly with city departments to resolve infrastructure, safety, and community issues quickly.</p>
        <div>
          <Link to="/register" className="btn btn-primary" style={{ marginRight: '1rem' }}>Get Started</Link>
          <Link to="/login" className="btn btn-outline">Login</Link>
        </div>
      </section>

      <section style={{ padding: '2rem 0' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="stat-card">
            <i className="fa-solid fa-camera stat-value" style={{ marginBottom: '1rem' }}></i>
            <h3>1. Report an Issue</h3>
            <p className="stat-label">Spot a pothole, broken streetlight, or garbage dump? Snap a photo and tell us where it is.</p>
          </div>
          <div className="stat-card">
            <i className="fa-solid fa-paper-plane stat-value" style={{ marginBottom: '1rem' }}></i>
            <h3>2. Automatic Routing</h3>
            <p className="stat-label">Our system automatically categorizes and sends your complaint to the correct city department.</p>
          </div>
          <div className="stat-card">
            <i className="fa-solid fa-check-circle stat-value" style={{ marginBottom: '1rem' }}></i>
            <h3>3. Track Progress</h3>
            <p className="stat-label">Get real-time updates as the department reviews, works on, and resolves your complaint.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
