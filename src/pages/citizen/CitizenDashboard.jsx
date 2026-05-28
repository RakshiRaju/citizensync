import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

export default function CitizenDashboard({ currentUser }) {
  const [userComplaints, setUserComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const q = query(
          collection(db, 'complaints'),
          where('citizenId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const complaints = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Client side sort since we'd need a composite index in Firestore for where + orderBy
        complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setUserComplaints(complaints);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [currentUser]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading complaints...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Complaints</h2>
        <Link to="/citizen/submit-complaint" className="btn btn-primary">
          <i className="fa-solid fa-plus"></i> New Complaint
        </Link>
      </div>

      {userComplaints.length > 0 ? (
        <div className="complaint-list">
          {userComplaints.map(complaint => (
            <div key={complaint.id} className="complaint-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{complaint.title}</h3>
                <span className={`status-badge status-${complaint.status.toLowerCase().replace(' ', '')}`}>
                  {complaint.status}
                </span>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <i className="fa-solid fa-calendar-days"></i> {new Date(complaint.createdAt).toLocaleString()}
                <br />
                <i className="fa-solid fa-layer-group"></i> {complaint.category}
              </p>
              
              <p style={{ marginBottom: '1rem' }}>
                {complaint.description.length > 100 ? `${complaint.description.substring(0, 100)}...` : complaint.description}
              </p>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.875rem' }}>
                <strong>Urgency:</strong> <span className={`priority-${complaint.urgency?.toLowerCase()}`}>{complaint.urgency || 'Normal'}</span>
                {complaint.resolution_notes && (
                  <div style={{ marginTop: '0.5rem', background: '#F3F4F6', padding: '0.75rem', borderRadius: '0.5rem', borderLeft: '3px solid var(--primary-color)' }}>
                    <strong>Resolution Note:</strong> {complaint.resolution_notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', borderRadius: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', color: 'var(--border-color)', marginBottom: '1rem' }}></i>
          <h3>No complaints submitted yet.</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Help us improve the city by reporting issues you find.</p>
          <Link to="/citizen/submit-complaint" className="btn btn-primary">Report an Issue</Link>
        </div>
      )}
    </div>
  );
}
