import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function UpdateComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const docRef = doc(db, 'complaints', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setComplaint({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such complaint!");
          navigate('/department/dashboard');
        }
      } catch (error) {
        console.error("Error fetching complaint:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const formData = new FormData(e.target);
    const status = formData.get('status');
    const resolutionNotes = formData.get('resolution_notes');

    try {
      const complaintRef = doc(db, 'complaints', id);
      await updateDoc(complaintRef, {
        status: status,
        resolution_notes: resolutionNotes,
        updatedAt: new Date().toISOString()
      });
      
      alert('Complaint updated successfully!');
      navigate('/department/dashboard');
    } catch (error) {
      console.error("Error updating complaint:", error);
      alert("Failed to update complaint.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading complaint...</div>;
  if (!complaint) return <div style={{ padding: '2rem', textAlign: 'center' }}>Complaint not found</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Update Complaint #{complaint.id.substring(0, 8)}</h2>
        <Link to="/department/dashboard" className="btn btn-outline btn-sm">Back</Link>
      </div>
      
      <div className="form-card" style={{ maxWidth: '100%', marginBottom: '2rem', background: '#F9FAFB' }}>
        <h3>{complaint.title}</h3>
        <p style={{ marginTop: '1rem' }}><strong>Description:</strong> {complaint.description}</p>
        
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
          <div><strong>Location:</strong> {complaint.location?.address || `Coordinates: ${complaint.location?.lat}, ${complaint.location?.lng}`}</div>
          <div><strong>Category:</strong> {complaint.category}</div>
        </div>

        {/* Geotagged Photo evidence preview details */}
        {complaint.evidenceUrl && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <i className="fa-solid fa-circle-check" style={{ color: 'var(--success-color)' }}></i> Verified Geotagged Evidence:
            </strong>
            <div 
              style={{ 
                borderRadius: '0.5rem', 
                overflow: 'hidden', 
                border: '1px solid var(--border-color)', 
                maxWidth: '450px', 
                cursor: 'zoom-in', 
                background: 'white',
                boxShadow: 'var(--shadow-sm)' 
              }} 
              onClick={() => setActiveLightboxImg(complaint.evidenceUrl)}
            >
              <img src={complaint.evidenceUrl} alt="Complaint Evidence" style={{ width: '100%', display: 'block', objectFit: 'contain' }} />
            </div>
            <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
              Click photo to inspect watermark details, GPS coordinates, and timestamp validation.
            </small>
          </div>
        )}
      </div>

      <div className="form-card" style={{ maxWidth: '100%' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" className="form-control" required defaultValue={complaint.status}>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Resolution Notes / Progress Update</label>
            <textarea 
              name="resolution_notes" 
              className="form-control" 
              rows="4" 
              required 
              placeholder="Describe what actions were taken..."
              defaultValue={complaint.resolution_notes || ''}
            ></textarea>
          </div>
          
          <div className="form-group">
            <label className="form-label">Upload Proof (Photo/Video)</label>
            <input type="file" name="proof_image" className="form-control" accept="image/*,video/*" disabled />
            <small style={{ color: 'var(--text-secondary)' }}>File upload not implemented in this demo.</small>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Update'}
          </button>
        </form>
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
