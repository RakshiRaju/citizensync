import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAwlw43Arx8_hQcOLzflcXEkpGt5A6yGmY",
  authDomain: "citizensync-5304f.firebaseapp.com",
  projectId: "citizensync-5304f",
  storageBucket: "citizensync-5304f.firebasestorage.app",
  messagingSenderId: "434864830189",
  appId: "1:434864830189:web:e430adcc6b535b1ca93ee4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const mockUsers = [
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

const mockDepartments = [
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

const mockComplaints = [
  {
    id: "c1",
    title: "Large Pothole on Main St",
    description: "There is a very deep pothole causing traffic slowdowns and potential vehicle damage near the intersection.",
    category: "Road Damage / Potholes",
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
    category: "Waste Management",
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

async function seedDatabase() {
  console.log("Starting database seed...");

  try {
    // Seed Users
    console.log("Seeding users...");
    for (const user of mockUsers) {
      await setDoc(doc(db, "users", user.uid), user);
    }
    console.log("Users seeded.");

    // Seed Departments
    console.log("Seeding departments...");
    for (const dept of mockDepartments) {
      await setDoc(doc(db, "departments", dept.id), dept);
    }
    console.log("Departments seeded.");

    // Seed Complaints
    console.log("Seeding complaints...");
    for (const complaint of mockComplaints) {
      await setDoc(doc(db, "complaints", complaint.id), complaint);
    }
    console.log("Complaints seeded.");

    console.log("Database seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
