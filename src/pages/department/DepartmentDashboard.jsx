import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function DepartmentDashboard({ currentUser }) {
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

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
            <div key={complaint.id} className="complaint-card" style={{ display: 'flex', flexDirection: 'column' }}>
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
              
              {/* Geotagged Photo evidence thumbnail */}
              {complaint.evidenceUrl && (
                <div style={{ marginBottom: '1rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)', height: '140px', background: '#f9fafb', position: 'relative', cursor: 'zoom-in' }} onClick={() => setActiveLightboxImg(complaint.evidenceUrl)}>
                  <img src={complaint.evidenceUrl} alt="Geotagged Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <i className="fa-solid fa-expand"></i> Inspect Geotag
                  </div>
                </div>
              )}

              <p style={{ marginBottom: '1rem', flexGrow: 1 }}>{complaint.description}</p>
              
              <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
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

      {/* Lightbox Modal Overlay */}
      {activeLightboxImg && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 17, 23, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setActiveLightboxImg(null)}
        >
          <button 
            type="button" 
            onClick={() => setActiveLightboxImg(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          
          <div 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '85vh', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              background: 'black',
              border: '2px solid rgba(255,255,255,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeLightboxImg} 
              alt="Geotagged verification evidence full resolution" 
              style={{ display: 'block', maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
