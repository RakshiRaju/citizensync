import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    alert('Mock Registration Successful! Please login.');
    navigate('/login');
  };

  return (
    <div className="form-card" style={{ marginTop: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create an Account</h2>
      <form onSubmit={handleRegisterSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="username">Full Name</label>
          <input type="text" id="username" name="username" className="form-control" required placeholder="John Doe" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email" className="form-control" required placeholder="john@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input type="password" id="password" name="password" className="form-control" required placeholder="Create a password" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Login here</Link>
      </p>
    </div>
  );
}
