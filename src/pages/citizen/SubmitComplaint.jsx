import { useState, useRef, useEffect } from 'react';
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

  // New Geotag & Photo States
  const [geotaggedPhoto, setGeotaggedPhoto] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  
  // Camera Modal States
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState('environment');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [triggerFlash, setTriggerFlash] = useState(false);
  const [showPreviewLightbox, setShowPreviewLightbox] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto geocode when map position changes
  useEffect(() => {
    if (position) {
      reverseGeocode(position.lat, position.lng);
    }
  }, [position]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Geolocation wrapper
  const getGeoLocationPromise = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    try {
      const loc = await getGeoLocationPromise();
      setPosition(loc);
    } catch (err) {
      alert('Error getting location: ' + err.message);
    } finally {
      setIsDetecting(false);
    }
  };

  // Reverse Geocoding via OSM Nominatim API
  async function reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (!response.ok) throw new Error('Network error during geocoding');
      const data = await response.json();
      const addr = data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
      
      // Update form text input automatically if empty or user wants
      const addrInput = document.getElementById('location_address');
      if (addrInput) addrInput.value = addr;
      
      return addr;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      const fallbackAddr = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      return fallbackAddr;
    }
  }

  // Canvas Drawing Utility for Watermark Geotag Overlay
  const drawGeotagWatermark = (imageSrc, lat, lng, address) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Downscale image to max 640px for safe Firestore fail-safe fallback storage keeping aspect ratio
        const maxDim = 640;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw the uploaded / clicked photo onto the canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Calculate dynamic banner height (16% of height)
        const bannerHeight = Math.max(80, Math.round(height * 0.16));
        
        // Dark translucent gradient block for modern aesthetics & maximum text contrast
        const gradient = ctx.createLinearGradient(0, height - bannerHeight, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
        gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - bannerHeight, width, bannerHeight);
        
        // Decorative Indigo highlight bar at the bottom
        ctx.fillStyle = '#4F46E5';
        ctx.fillRect(0, height - 4, width, 4);

        // Core Text Details
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        
        // Scale fonts relative to canvas width
        const titleSize = Math.max(12, Math.round(width * 0.024));
        const textSize = Math.max(9, Math.round(width * 0.018));
        const addressSize = Math.max(8, Math.round(width * 0.016));
        
        // Standard formatted date
        const dateStr = new Date().toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
        
        // Draw Title Banner
        ctx.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(`📍 CITIZENSYNC GEOTAG VERIFIED`, 20, height - bannerHeight + (bannerHeight * 0.25));
        
        // Draw Coordinates & Time
        ctx.fillStyle = '#E5E7EB';
        ctx.font = `500 ${textSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(`GPS: ${lat.toFixed(6)}°, ${lng.toFixed(6)}°  |  Time: ${dateStr}`, 20, height - bannerHeight + (bannerHeight * 0.52));
        
        // Draw Address Word-wrapped
        ctx.fillStyle = '#9CA3AF';
        ctx.font = `italic ${addressSize}px system-ui, -apple-system, sans-serif`;
        
        const wrapText = (text, x, y, maxWidth, lineHeight) => {
          const words = text.split(' ');
          let line = '';
          let currentY = y;
          
          for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              ctx.fillText(line, x, currentY);
              line = words[n] + ' ';
              currentY += lineHeight;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, x, currentY);
        };
        
        wrapText(`Address: ${address}`, 20, height - bannerHeight + (bannerHeight * 0.78), width - 40, addressSize + 4);
        
        // Export canvas as highly optimized JPEG data URL to fit within 1MB firestore safely (~20KB)
        resolve(canvas.toDataURL('image/jpeg', 0.70));
      };
      img.src = imageSrc;
    });
  };

  // Process selected image file or camera capture
  const processImageFile = async (file) => {
    setIsProcessingPhoto(true);
    setPhotoError('');
    
    try {
      // 1. Ensure geolocation is available. Auto-detect if needed
      let activePos = position;
      if (!activePos) {
        try {
          activePos = await getGeoLocationPromise();
          setPosition(activePos);
        } catch (gpsError) {
          throw new Error(
            'Geolocation is required to capture/upload evidence. Please allow location access or select a location on the map.',
            { cause: gpsError }
          );
        }
      }
      
      // 2. Fetch Osm reverse address
      const address = await reverseGeocode(activePos.lat, activePos.lng);
      
      // 3. Load image source
      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawPhotoData = e.target.result;
        // 4. Render watermark overlay
        const watermarkedData = await drawGeotagWatermark(rawPhotoData, activePos.lat, activePos.lng, address);
        setGeotaggedPhoto(watermarkedData);
        setIsProcessingPhoto(false);
      };
      reader.onerror = () => {
        setPhotoError('Failed to read image file');
        setIsProcessingPhoto(false);
      };
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error(err);
      setPhotoError(err.message);
      setIsProcessingPhoto(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  // WebRTC Camera Controls
  const startCamera = async (facing = cameraFacingMode) => {
    setCameraLoading(true);
    setPhotoError('');
    
    // Stop active stream tracks if any
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: { facingMode: facing },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCameraModal(true);
    } catch (err) {
      console.error(err);
      setPhotoError('Could not open camera stream: ' + err.message + '. Please upload a file instead.');
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    setTriggerFlash(true);
    setTimeout(() => setTriggerFlash(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Horizontal mirror flip if front camera
    if (cameraFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to Blob or file and process
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      await processImageFile(file);
    }, 'image/jpeg', 0.9);
  };

  const handleRemovePhoto = () => {
    setGeotaggedPhoto(null);
    setPhotoError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Submission with base64 photo stored directly in Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    const address = formData.get('location_address');
    const title = formData.get('title');
    const category = formData.get('category');
    const description = formData.get('description');

    if (!position) {
      alert("Please specify a location by detecting it or clicking the map.");
      setIsSubmitting(false);
      return;
    }

    const complaintData = {
      title,
      category,
      description,
      status: 'Pending',
      urgency: 'Normal', 
      departmentId: null, 
      citizenId: currentUser?.uid || 'unknown',
      location: {
        lat: position?.lat || null,
        lng: position?.lng || null,
        address: address || null
      },
      evidenceUrl: geotaggedPhoto || null,
      evidenceStorageType: geotaggedPhoto ? 'base64' : null,
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
            
            {/* Issue Title */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="title">Issue Title</label>
              <input type="text" id="title" name="title" className="form-control" required placeholder="E.g., Large pothole on Main Street" />
            </div>
            
            {/* Category selection */}
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
            
            {/* Premium Photo Picker & Capture Widgets */}
            <div className="form-group">
              <label className="form-label">Evidence Geotagged Photo</label>
              
              <div 
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: '#FBFBFE',
                  minHeight: '135px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {!geotaggedPhoto && !isProcessingPhoto && (
                  <div>
                    <i className="fa-solid fa-camera" style={{ fontSize: '1.75rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}></i>
                    <p style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      Add Verified Geotagged Photo
                    </p>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <i className="fa-solid fa-video"></i> Open Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <i className="fa-solid fa-upload"></i> Upload Photo
                      </button>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                    />
                  </div>
                )}

                {/* Processing Geotags Loading State */}
                {isProcessingPhoto && (
                  <div style={{ padding: '1rem' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.75rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}></i>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      Fetching GPS location and rendering verified geotag watermark...
                    </p>
                  </div>
                )}

                {/* Verified Watermarked Preview */}
                {geotaggedPhoto && (
                  <div style={{ width: '100%', position: 'relative' }}>
                    <img 
                      src={geotaggedPhoto} 
                      alt="Verified evidence preview" 
                      style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '0.5rem' }} 
                    />
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: '5px', 
                        right: '38px', 
                        background: 'rgba(79, 70, 229, 0.95)', 
                        color: 'white', 
                        borderRadius: '50%', 
                        width: '28px', 
                        height: '28px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'transform 0.2s'
                      }}
                      onClick={() => setShowPreviewLightbox(true)}
                      title="Preview Geotag Fullscreen"
                    >
                      <i className="fa-solid fa-expand"></i>
                    </div>
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: '5px', 
                        right: '5px', 
                        background: 'rgba(239, 68, 68, 0.9)', 
                        color: 'white', 
                        borderRadius: '50%', 
                        width: '28px', 
                        height: '28px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'transform 0.2s'
                      }}
                      onClick={handleRemovePhoto}
                      title="Remove image"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </div>
                    
                    <div 
                      style={{ 
                        position: 'absolute', 
                        bottom: '5px', 
                        left: '5px', 
                        background: 'rgba(16, 185, 129, 0.95)', 
                        color: 'white', 
                        fontSize: '0.65rem', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        letterSpacing: '0.5px'
                      }}
                    >
                      <i className="fa-solid fa-circle-check"></i> GEOTAGGED PREVIEW
                    </div>
                  </div>
                )}
              </div>
              
              {photoError && (
                <p style={{ color: 'var(--error-color)', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 500 }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> {photoError}
                </p>
              )}
            </div>
            
            {/* Description Area */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="description">Detailed Description</label>
              <textarea id="description" name="description" className="form-control" rows="4" required placeholder="Describe the issue in detail..."></textarea>
            </div>
            
            {/* Geolocation Section */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Location</label>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Detect your location automatically or click on the map to pinpoint. Photos require verification.
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
                  <><i className="fa-solid fa-check"></i> Location Pinpoint Active</>
                ) : (
                  <><i className="fa-solid fa-location-crosshairs"></i> Detect My Location</>
                )}
              </button>
              
              <div style={{ height: '260px', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border-color)', zIndex: 1, overflow: 'hidden' }}>
                <MapContainer center={position || [20.5937, 78.9629]} zoom={position ? 15 : 5} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
              </div>
              
              {/* Address detail description */}
              <input 
                type="text" 
                id="location_address" 
                name="location_address" 
                className="form-control" 
                placeholder="Detecting address automatically from coordinates..." 
              />
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <Link to="/citizen/dashboard" className="btn btn-outline" style={{ marginRight: '1rem' }}>Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || isProcessingPhoto}>
              {isSubmitting ? (
                <><i className="fa-solid fa-spinner fa-spin"></i> Submitting Complaint...</>
              ) : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>

      {/* Modern Custom camera WebRTC modal */}
      {showCameraModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 17, 23, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div 
            style={{
              background: '#1F2937',
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '560px',
              padding: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #374151',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {/* Flash Overlay Indicator */}
            {triggerFlash && (
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'white',
                  borderRadius: '1rem',
                  zIndex: 10,
                  pointerEvents: 'none',
                  animation: 'fadeOut 0.2s forwards'
                }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.125rem', fontWeight: 600 }}>
                Camera Evidence Capture
              </h3>
              <button 
                type="button" 
                onClick={stopCamera} 
                style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Video Viewport Frame */}
            <div 
              style={{
                width: '100%',
                aspectRatio: '4/3',
                background: 'black',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                position: 'relative',
                border: '2px solid #4B5563',
                boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.6)'
              }}
            >
              {cameraLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}></i>
                  <span>Initializing camera stream...</span>
                </div>
              )}
              
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none' 
                }} 
              />
              
              {/* GPS overlay warning indicator */}
              <div 
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: '#10B981',
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <i className="fa-solid fa-location-dot"></i> GPS ACTIVE
              </div>
            </div>

            {/* Shutter Panel Control */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '1.25rem', padding: '0 1rem' }}>
              
              {/* Flip camera front/back */}
              <button 
                type="button" 
                onClick={toggleCameraFacing} 
                style={{
                  background: '#374151',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background 0.2s'
                }}
                title="Switch Camera"
              >
                <i className="fa-solid fa-camera-rotate"></i>
              </button>

              {/* Shutter Trigger */}
              <button 
                type="button" 
                onClick={capturePhoto} 
                style={{
                  background: '#FFFFFF',
                  border: '5px solid #4B5563',
                  borderRadius: '50%',
                  width: '68px',
                  height: '68px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                title="Capture Verification"
              />

              {/* Cancel button fallback */}
              <button 
                type="button" 
                onClick={stopCamera} 
                style={{
                  background: '#EF4444',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  transition: 'background 0.2s'
                }}
                title="Cancel Capture"
              >
                <i className="fa-solid fa-ban"></i>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Geotag Fullscreen Preview Lightbox Modal */}
      {showPreviewLightbox && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 17, 23, 0.96)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setShowPreviewLightbox(false)}
        >
          <button 
            type="button" 
            onClick={() => setShowPreviewLightbox(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.15)',
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
              transition: 'background 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              zIndex: 100000
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
              border: '2px solid rgba(255,255,255,0.15)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={geotaggedPhoto} 
              alt="Geotagged verification evidence fullscreen preview" 
              style={{ display: 'block', maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} 
            />
          </div>
        </div>
      )}

      {/* Injection of Keyframe animations into layout */}
      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
