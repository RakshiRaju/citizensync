import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const authenticateUser = async (userEmail) => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        onLogin(userData);
        navigate(`/${userData.role === 'admin' ? 'admin' : userData.role}/dashboard`);
      } else {
        setError('User not found. Try one of the demo logins.');
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setError('Failed to log in. Check console for details.');
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    authenticateUser(email);
  };

  const handleDemoLogin = (emailStr) => {
    setEmail(emailStr);
    setPassword('mockpassword');
    setError('');
    authenticateUser(emailStr);
  };

  return (
    <div className="form-card" style={{ marginTop: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Login to Your Account</h2>
      
      {error && (
        <div className="alert alert-error">
          {error}
          <span className="close-btn" onClick={() => setError('')}>&times;</span>
        </div>
      )}

      <form onSubmit={handleLoginSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            className="form-control" 
            required 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            className="form-control" 
            required 
            placeholder="Enter your password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
      </form>
      
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Demo Quick Login</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button type="button" onClick={() => handleDemoLogin('citizen@example.com')} className="btn btn-outline btn-sm">Login as Citizen</button>
          <button type="button" onClick={() => handleDemoLogin('admin@example.com')} className="btn btn-outline btn-sm">Login as Admin</button>
          <button type="button" onClick={() => handleDemoLogin('roads@example.com')} className="btn btn-outline btn-sm">Login as Roads Dept</button>
        </div>
      </div>
      
      <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)' }}>Register here</Link>
      </p>
    </div>
  );
}
