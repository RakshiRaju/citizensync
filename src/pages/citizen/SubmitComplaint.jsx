import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Fix for leaflet default icon issue in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function SubmitComplaint({ currentUser }) {
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      setIsDetecting(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsDetecting(false);
        },
        (err) => {
          alert('Error getting location: ' + err.message);
          setIsDetecting(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    const address = formData.get('location_address');
    
    const complaintData = {
      title: formData.get('title'),
      category: formData.get('category'),
      description: formData.get('description'),
      status: 'Pending',
      urgency: 'Normal', // Default, could be added to form
      departmentId: null, // Unassigned initially
      citizenId: currentUser?.uid || 'unknown',
      location: {
        lat: position?.lat || null,
        lng: position?.lng || null,
        address: address || null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'complaints'), complaintData);
      navigate('/citizen/dashboard');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Report a New Issue</h2>
      
      <div className="form-card" style={{ maxWidth: '100%' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="title">Issue Title</label>
              <input type="text" id="title" name="title" className="form-control" required placeholder="E.g., Large pothole on Main Street" />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="category">Category</label>
              <select id="category" name="category" className="form-control" required defaultValue="">
                <option value="" disabled>Select Category</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Water Leakage / Water Supply">Water Leakage / Water Supply</option>
                <option value="Road Damage / Potholes">Road Damage / Potholes</option>
                <option value="Construction Safety">Construction Safety</option>
                <option value="Street Light Issues">Street Light Issues</option>
                <option value="Stray Animals">Stray Animals</option>
                <option value="Public Safety Complaints">Public Safety Complaints</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="evidence">Upload Photo (Optional)</label>
              <input type="file" id="evidence" name="evidence" className="form-control" accept="image/*,video/*" disabled />
              <small style={{ color: 'var(--text-secondary)' }}>File upload not implemented in this demo.</small>
            </div>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="description">Detailed Description</label>
              <textarea id="description" name="description" className="form-control" rows="4" required placeholder="Describe the issue in detail..."></textarea>
            </div>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Location</label>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Click the button below to detect your location automatically, or click on the map.
              </p>
              
              <button 
                type="button" 
                onClick={handleDetectLocation} 
                className={`btn btn-sm ${position ? 'btn-primary' : 'btn-outline'}`} 
                style={{ marginBottom: '1rem' }}
                disabled={isDetecting}
              >
                {isDetecting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Detecting...</>
                ) : position ? (
                  <><i className="fa-solid fa-check"></i> Location Detected</>
                ) : (
                  <><i className="fa-solid fa-location-crosshairs"></i> Detect My Location</>
                )}
              </button>
              
              <div style={{ height: '300px', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)', zIndex: 1, overflow: 'hidden' }}>
                <MapContainer center={position || [20.5937, 78.9629]} zoom={position ? 15 : 5} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
              </div>
              
              <input type="text" id="location_address" name="location_address" className="form-control" placeholder="Enter manual address or description if map fails" />
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <Link to="/citizen/dashboard" className="btn btn-outline" style={{ marginRight: '1rem' }}>Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
