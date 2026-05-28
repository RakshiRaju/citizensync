import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function DepartmentDashboard({ currentUser }) {
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!currentUser?.departmentId) {
        setLoading(false);
        return;
      }
      
      try {
        const q = query(
          collection(db, 'complaints'),
          where('departmentId', '==', currentUser.departmentId)
        );
        const querySnapshot = await getDocs(q);
        const complaints = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAssignedComplaints(complaints);
      } catch (error) {
        console.error("Error fetching assigned complaints:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [currentUser]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Department Dashboard: {currentUser?.displayName || 'Roads & Infrastructure'}</h2>

      <div className="complaint-list">
        {assignedComplaints.length > 0 ? (
          assignedComplaints.map(complaint => (
            <div key={complaint.id} className="complaint-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: '0', fontSize: '1.25rem' }}>#{complaint.id.substring(0, 8)} - {complaint.title}</h3>
                <span className={`status-badge status-${complaint.status.toLowerCase().replace(' ', '')}`}>
                  {complaint.status}
                </span>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <i className="fa-solid fa-calendar-days"></i> {new Date(complaint.createdAt).toLocaleString()}
                <br />
                <i className="fa-solid fa-layer-group"></i> {complaint.category}
                <br />
                <strong>Priority:</strong> <span className={`priority-${complaint.urgency?.toLowerCase()}`}>{complaint.urgency || 'Normal'}</span>
              </p>
              
              <p style={{ marginBottom: '1rem' }}>{complaint.description}</p>
              
              <div style={{ marginTop: '1.5rem' }}>
                <Link to={`/department/update-complaint/${complaint.id}`} className="btn btn-primary" style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}>
                  Update Status
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', borderRadius: '1rem' }}>
            <i className="fa-solid fa-check-double" style={{ fontSize: '3rem', color: 'var(--success-color)', marginBottom: '1rem' }}></i>
            <h3>All caught up!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>No complaints are currently assigned to your department.</p>
          </div>
        )}
      </div>
    </div>
  );
}
