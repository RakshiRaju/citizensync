import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const deptsSnapshot = await getDocs(collection(db, 'departments'));
      setDepartments(deptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    const formData = new FormData(e.target);
    const name = formData.get('username');
    const email = formData.get('email');
    // Note: In a real app, password should go through Firebase Auth. 
    // Here we're just creating the department record.
    const description = formData.get('department_category');

    try {
      const newDeptRef = await addDoc(collection(db, 'departments'), {
        name,
        description,
        email,
        createdAt: new Date().toISOString()
      });
      
      alert('Department created successfully!');
      e.target.reset();
      
      // Refresh the list
      fetchDepartments();
    } catch (error) {
      console.error("Error creating department:", error);
      alert('Failed to create department.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Manage Departments</h2>
        <Link to="/admin/dashboard" className="btn btn-outline">Back to Dashboard</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Add new department form */}
        <div className="form-card" style={{ margin: '0', maxWidth: '100%' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Add Department User</h3>
          <form onSubmit={handleCreateDepartment}>
            <div className="form-group">
              <label className="form-label">Department Name</label>
              <input type="text" name="username" className="form-control" required placeholder="E.g., Water Works Dept" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-control" required placeholder="waterdept@city.gov" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Category Assignment</label>
              <select name="department_category" className="form-control" required defaultValue="Waste Management">
                <option value="Waste Management">Waste Management</option>
                <option value="Water Leakage / Water Supply">Water Leakage / Water Supply</option>
                <option value="Road Damage / Potholes">Road Damage / Potholes</option>
                <option value="Construction Safety">Construction Safety</option>
                <option value="Street Light Issues">Street Light Issues</option>
                <option value="Stray Animals">Stray Animals</option>
                <option value="Public Safety Complaints">Public Safety Complaints</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Department'}
            </button>
          </form>
        </div>

        {/* List of departments */}
        <div className="form-card" style={{ margin: '0', maxWidth: '100%', padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Description / Category</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="2" style={{ padding: '2rem', textAlign: 'center' }}>Loading departments...</td></tr>
              ) : departments.length > 0 ? (
                departments.map(dept => (
                  <tr key={dept.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{dept.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                        {dept.description}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No departments created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
