# 📚 Student-Teacher Booking Appointment System

A web-based appointment booking system that allows students to book appointments with teachers, teachers to manage their schedules, and administrators to oversee the entire system.

## 🎯 Project Overview

This system facilitates seamless appointment scheduling between students and teachers through an intuitive web interface. Built with HTML, CSS, JavaScript, and Firebase, it provides role-based access for Admins, Teachers, and Students.

## ✨ Features

### 👨‍💼 Admin Features
- ➕ Add new teachers with details (name, email, department, subject)
- ✏️ Edit and update teacher information
- 🗑️ Delete teachers from the system
- ✅ Approve or reject student registrations
- 📊 View all appointments across the system
- 📈 Dashboard with system statistics

### 👨‍🏫 Teacher Features
- 📅 View all scheduled appointments
- ✅ Approve or cancel appointment requests
- 💬 Send and receive messages from students
- 📊 Personal dashboard with appointment overview

### 👨‍🎓 Student Features
- 🔍 Search teachers by department or subject
- 📝 Book appointments with selected teachers
- 📱 View personal appointment history and status
- 💬 Send messages to teachers
- ❌ Cancel own appointments

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Firebase
  - Authentication (Email/Password)
  - Firestore Database
- **Backend:** Netlify 
  - Hosting
- **Design:** Responsive, Mobile-First Design

## 📋 Prerequisites

Before you begin, ensure you have:
- A web browser (Chrome, Firefox, Safari, or Edge)
- A Firebase account ([Create one here](https://firebase.google.com/))
- Git installed on your computer
- Basic knowledge of HTML, CSS, and JavaScript

## 🚀 Getting Started

### Step 1: Clone the Repository

```bash
git clone https://github.com/uswashaikh/student-teacher-booking-appointment
cd student-teacher-appointment
```

### Step 2: Set Up Firebase

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Enter project name: "student-teacher-appointment"
   - Disable Google Analytics (optional)
   - Click "Create Project"

2. **Enable Firebase Services**

   **a) Enable Authentication:**
   - In Firebase Console, go to **Authentication**
   - Click "Get Started"
   - Select "Email/Password" under Sign-in method
   - Enable it and click "Save"

   **b) Create Firestore Database:**
   - Go to **Firestore Database**
   - Click "Create Database"
   - Select "Start in test mode" (for development)
   - Choose a location closest to you
   - Click "Enable"

   **c) Set up Hosting with Netlify (for deployment):**
  - Go to [Netlify](https://www.netlify.com/)
  - Click **"Add new site"** → **"Import from Git"**
  - Connect your GitHub repository
  - Set build settings:
  - **Build command**: `npm run build` *(or as per your project)*
  - **Publish directory**: `dist` *(or `build`, depending on your setup)*
  - Click **"Deploy Site"**
  - After deployment, your site will be live at a Netlify URL (e.g., `https://your-site-name.netlify.app`)


3. **Get Firebase Configuration**
   - In Firebase Console, click the gear icon ⚙️ (Project Settings)
   - Scroll down to "Your apps"
   - Click the web icon `</>`
   - Register your app with a nickname
   - Copy the Firebase configuration object

4. **Update config.js**
   - Open `js/config.js`
   - Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### Step 3: Create Initial Admin Account

Since the system requires an admin to approve students and add teachers, you need to create the first admin account manually:

1. **Create Admin User in Firebase Auth:**
   - Go to Firebase Console → Authentication → Users
   - Click "Add User"
   - Email: `admin@example.com`
   - Password: `admin123` (change this later!)
   - Click "Add User"
   - Copy the User UID

2. **Add Admin to Firestore:**
   - Go to Firestore Database
   - Click "Start Collection"
   - Collection ID: `users`
   - Document ID: Paste the User UID from above
   - Add fields:
     ```
     name: "Admin"
     email: "admin@example.com"
     role: "admin"
     status: "approved"
     createdAt: (use timestamp)
     ```
   - Click "Save"

### Step 4: Run the Application

#### Option A: Open Locally
1. Simply open `index.html` in your web browser
2. Or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```
3. Navigate to `http://localhost:8000`

#### Option B: Deploy to Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init hosting
# Select: Use an existing project
# Choose your project
# Public directory: . (current directory)
# Single-page app: No
# Set up automatic builds: No

# Deploy
firebase deploy

# Your app will be live at:
# https://your-project-id.web.app
```

## 📱 Usage Guide

### First Time Setup

1. **Login as Admin:**
   - Go to the application URL
   - Click "Login"
   - Enter admin credentials:
     - Email: `admin@example.com`
     - Password: `Admin@123`

2. **Add Teachers:**
   - In Admin Dashboard, scroll to "Add New Teacher"
   - Fill in teacher details:
     - Full Name
     - Email
     - Department
     - Subject
   - Click "Add Teacher"
   - **Note the default password:** `teacher123`
   - Teachers can login with their email and this password

3. **Student Registration:**
   - Students click "Register as Student"
   - Fill in their details
   - Submit registration
   - Wait for admin approval

4. **Approve Students:**
   - Admin logs in
   - Views "Pending Student Approvals"
   - Click "Approve" for each student
   - Students can now login

### Student Workflow

1. **Register & Wait for Approval**
2. **Login** after approval
3. **Search for Teachers** by department or subject
4. **Book Appointment:**
   - Select teacher
   - Choose date and time
   - Add purpose/reason
   - Submit booking
5. **View Appointments** and status
6. **Send Messages** to teachers

### Teacher Workflow

1. **Login** with credentials provided by admin
2. **View Appointments** on dashboard
3. **Approve or Cancel** appointment requests
4. **Send Messages** to students
5. **Manage Schedule**

### Admin Workflow

1. **Login** to admin dashboard
2. **Manage Teachers:**
   - Add new teachers
   - Edit teacher details
   - Delete teachers
3. **Approve Students:**
   - Review pending registrations
   - Approve or reject
4. **Monitor System:**
   - View all appointments
   - Check system statistics

## 📂 Project Structure

```
student-teacher-appointment/
│
├── index.html              # Landing page
├── login.html              # Login page
├── register.html           # Student registration
├── admin.html              # Admin dashboard
├── teacher.html            # Teacher dashboard (to be created)
├── student.html            # Student dashboard (to be created)
│
├── css/
│   └── style.css          # All styles
│
├── js/
│   ├── config.js          # Firebase configuration
│   ├── auth.js            # Authentication logic
│   ├── admin.js           # Admin functions
│   ├── teacher.js         # Teacher functions (to be created)
│   └── student.js         # Student functions (to be created)
│
├── docs/
│   ├── PLAN.md            # Project plan
│   └── screenshots/       # Application screenshots
│
└── README.md              # This file
```

## 🗄️ Database Structure

### Collections

#### users
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  role: "student" | "teacher" | "admin",
  status: "pending" | "approved" | "rejected",
  createdAt: timestamp
}
```

#### teachers
```javascript
{
  userId: "reference_to_users",
  name: "Dr. Smith",
  email: "smith@example.com",
  department: "Computer Science",
  subject: "Data Structures",
  createdAt: timestamp
}
```

#### appointments
```javascript
{
  studentId: "user_id",
  teacherId: "teacher_id",
  studentName: "John Doe",
  teacherName: "Dr. Smith",
  date: "2025-10-15",
  time: "10:00 AM",
  purpose: "Discuss project",
  status: "pending" | "approved" | "cancelled",
  createdAt: timestamp
}
```

## 🔐 Security

### Firebase Security Rules

Add these rules in Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Teachers collection
    match /teachers/{teacherId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

## 🧪 Testing

### Manual Testing Checklist

#### Authentication Testing
- [ ] Student can register with valid email and password
- [ ] Registration fails with duplicate email
- [ ] Login works with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] Students cannot login before approval
- [ ] Users are redirected based on their role

#### Admin Testing
- [ ] Admin can add new teachers
- [ ] Admin can edit teacher information
- [ ] Admin can delete teachers
- [ ] Admin can approve student registrations
- [ ] Admin can reject student registrations
- [ ] Admin can view all appointments
- [ ] Statistics display correctly

#### Teacher Testing (After Implementation)
- [ ] Teacher can login with credentials
- [ ] Teacher can view their appointments
- [ ] Teacher can approve appointments
- [ ] Teacher can cancel appointments
- [ ] Teacher can send messages to students

#### Student Testing (After Implementation)
- [ ] Student can search teachers by department
- [ ] Student can search teachers by subject
- [ ] Student can book appointments
- [ ] Student can view their appointments
- [ ] Student can cancel appointments
- [ ] Student can send messages to teachers

### Browser Compatibility
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Mobile browsers

### Responsive Design Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## 🐛 Troubleshooting

### Common Issues and Solutions

**Problem: Firebase not initializing**
```
Solution:
1. Check if config.js has correct Firebase credentials
2. Ensure Firebase SDK scripts are loaded in HTML
3. Check browser console for specific errors
```

**Problem: Login not working**
```
Solution:
1. Verify Email/Password authentication is enabled in Firebase
2. Check if user exists in Firebase Authentication
3. Verify user has correct role and status in Firestore
```

**Problem: Cannot add teachers**
```
Solution:
1. Make sure you're logged in as admin
2. Check Firebase Authentication has createUser permission
3. Verify Firestore security rules allow admin writes
```

**Problem: Page shows "Access Denied"**
```
Solution:
1. Check if user role in Firestore matches the page
2. Verify user status is "approved" for students
3. Clear browser cache and login again
```

**Problem: Data not showing in tables**
```
Solution:
1. Open browser console and check for errors
2. Verify Firestore collections exist and have data
3. Check Firestore security rules allow reads
4. Ensure proper indexes are created
```

**Problem: Deployment fails**
```
Solution:
1. Make sure Firebase CLI is installed: npm install -g firebase-tools
2. Login: firebase login
3. Initialize: firebase init hosting
4. Deploy: firebase deploy
```

## 📊 Features Status

### ✅ Completed
- [x] Landing page
- [x] Login system
- [x] Student registration
- [x] Admin dashboard
- [x] Add/Edit/Delete teachers
- [x] Approve/Reject students
- [x] View all appointments
- [x] Responsive design

### 🚧 To Be Implemented
- [ ] Teacher dashboard
- [ ] Student dashboard
- [ ] Appointment booking
- [ ] Messaging system
- [ ] Search functionality
- [ ] Email notifications (optional)

## 📈 Future Enhancements

- 📧 Email notifications for appointments
- 📱 Mobile app version
- 📅 Calendar integration
- 🔔 Push notifications
- 📊 Advanced analytics
- 📄 Generate appointment reports
- 🎨 Theme customization
- 🌐 Multi-language support

## 👥 Default Accounts

### Admin Account
```
Email: admin@example.com
Password: Admin@123
```

### Sample Teacher Account (After adding via admin)
```
Email: john.smith@example.com
Password: teacher123 
```

## 📝 Logging

The application logs important actions to the browser console:

- User registration
- User login/logout
- Teacher CRUD operations
- Student approval/rejection
- Appointment operations
- Database errors

To view logs:
1. Open browser developer tools (F12)
2. Go to Console tab
3. All operations are logged with timestamps

## 🔒 Security Best Practices

1. **Change Default Passwords**
   - Immediately change admin password after setup
   - Teachers should change password on first login

2. **Firebase Security Rules**
   - Never use test mode in production
   - Update rules as shown in Security section
   - Review rules regularly

3. **Environment Variables**
   - Keep Firebase config private
   - Don't commit sensitive data to public repos
   - Use environment variables for production

4. **User Data**
   - Only collect necessary information
   - Implement proper data validation
   - Regular security audits

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Firebase documentation
3. Check browser console for errors
4. Open an issue on GitHub

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ✍️ Author

**Your Name**
- GitHub: [@uswashaikh](https://github.com/uswashaikh)
- Email: uswashaikh@example.com

## 🙏 Acknowledgments

- Firebase for backend services
- Google Fonts for typography
- Icons from emoji set
- Internship program supervisors

**Made with ❤️ for Education**

Repo Link: https://github.com/uswashaikh/student-teacher-booking-appointment
