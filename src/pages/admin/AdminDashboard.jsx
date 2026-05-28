import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
        const deptsSnapshot = await getDocs(collection(db, 'departments'));
        
        setComplaints(complaintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setDepartments(deptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Pending').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  const handleAssign = async (e, complaintId) => {
    e.preventDefault();
    const departmentId = e.target.department_id.value;
    if (!departmentId) return;

    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      await updateDoc(complaintRef, {
        departmentId: departmentId,
        status: 'In Progress',
        updatedAt: new Date().toISOString()
      });
      
      // Update local state to reflect changes without reloading
      setComplaints(complaints.map(c => 
        c.id === complaintId 
          ? { ...c, departmentId, status: 'In Progress' } 
          : c
      ));
      
      alert(`Complaint ${complaintId} assigned successfully!`);
    } catch (error) {
      console.error("Error assigning complaint:", error);
      alert("Failed to assign complaint.");
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Admin Dashboard</h2>
        <Link to="/admin/departments" className="btn btn-outline">Manage Departments</Link>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning-color)' }}>{pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success-color)' }}>{resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1.5rem' }}>Recent Complaints</h3>

      <div className="form-card" style={{ maxWidth: '100%', padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Title</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>Priority</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Assign To</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length > 0 ? (
              complaints.map(complaint => (
                <tr key={complaint.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>#{complaint.id.substring(0, 8)}...</td>
                  <td style={{ padding: '1rem' }}>{complaint.title}</td>
                  <td style={{ padding: '1rem' }}>{complaint.category}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`priority-${complaint.urgency?.toLowerCase()}`}>{complaint.urgency || 'Normal'}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`status-badge status-${complaint.status.toLowerCase().replace(' ', '')}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {complaint.status === 'Pending' ? (
                      <form onSubmit={(e) => handleAssign(e, complaint.id)} style={{ display: 'flex', gap: '0.5rem' }}>
                        <select name="department_id" className="form-control" style={{ padding: '0.25rem', fontSize: '0.875rem' }} required defaultValue="">
                          <option value="" disabled>Select Dept</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                        <button type="submit" className="btn btn-primary btn-sm">Assign</button>
                      </form>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Assigned to: {departments.find(d => d.id === complaint.departmentId)?.name || 'Unknown'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No complaints found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
