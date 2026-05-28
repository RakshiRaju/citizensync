// Mock data for initial development

export const mockUsers = [
  {
    uid: "u1",
    email: "citizen@example.com",
    displayName: "John Doe",
    role: "citizen"
  },
  {
    uid: "u2",
    email: "admin@example.com",
    displayName: "System Admin",
    role: "admin"
  },
  {
    uid: "u3",
    email: "roads@example.com",
    displayName: "Road Department",
    role: "department",
    departmentId: "d1"
  }
];

export const mockDepartments = [
  {
    id: "d1",
    name: "Roads & Infrastructure",
    description: "Handles potholes, road maintenance, and infrastructure issues."
  },
  {
    id: "d2",
    name: "Sanitation & Waste Management",
    description: "Handles garbage collection, cleanliness, and waste."
  },
  {
    id: "d3",
    name: "Water Supply & Sewage",
    description: "Handles water leakage, supply issues, and drainage."
  }
];

export const mockComplaints = [
  {
    id: "c1",
    title: "Large Pothole on Main St",
    description: "There is a very deep pothole causing traffic slowdowns and potential vehicle damage near the intersection.",
    category: "Roads & Infrastructure",
    departmentId: "d1",
    status: "Pending",
    urgency: "High",
    location: {
      lat: 12.9716,
      lng: 77.5946,
      address: "Main Street, Central Area"
    },
    citizenId: "u1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "c2",
    title: "Garbage not collected for a week",
    description: "The community bins are overflowing and causing a bad smell in the neighborhood.",
    category: "Sanitation & Waste Management",
    departmentId: "d2",
    status: "In Progress",
    urgency: "Medium",
    location: {
      lat: 12.9352,
      lng: 77.6245,
      address: "Koramangala 4th Block"
    },
    citizenId: "u1",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];
