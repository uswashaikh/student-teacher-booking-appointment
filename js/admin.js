/* 
    File: admin.js
    Location: /js/admin.js
    Description: Admin dashboard functionality - FIXED: Creating teacher doesn't logout admin
*/

// Store current admin user
let currentAdminUser = null;

// Check if user is authenticated and is admin
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.data();

    if (userData.role !== "admin") {
      alert("Access denied! Admin only.");
      window.location.href = "login.html";
      return;
    }

    // Store admin user
    currentAdminUser = user;

    // Display admin name
    document.getElementById("adminName").textContent = userData.name || "Admin";

    // Load all data
    loadStatistics();
    loadTeachers();
    loadPendingStudents();
    loadAllAppointments();
  } catch (error) {
    console.error("Error checking admin access:", error);
    window.location.href = "login.html";
  }
});

// ===== LOAD STATISTICS =====
async function loadStatistics() {
  try {
    // Count teachers
    const teachersSnapshot = await db.collection("teachers").get();
    document.getElementById("totalTeachers").textContent = teachersSnapshot.size;

    // Count pending students (manual filter)
    const usersSnapshot = await db.collection("users").get();
    let pendingCount = 0;
    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      if (user.role === "student" && user.status === "pending") {
        pendingCount++;
      }
    });
    document.getElementById("pendingStudents").textContent = pendingCount;

    // Count appointments
    const appointmentsSnapshot = await db.collection("appointments").get();
    document.getElementById("totalAppointments").textContent = appointmentsSnapshot.size;

    console.log("Statistics loaded");
  } catch (error) {
    console.error("Error loading statistics:", error);
  }
}

// ===== ADD TEACHER ===== (FIXED - No Auto-Login)
document.getElementById("addTeacherForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("teacherName").value.trim();
  const email = document.getElementById("teacherEmail").value.trim();
  const department = document.getElementById("teacherDepartment").value.trim();
  const subject = document.getElementById("teacherSubject").value.trim();

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Creating Teacher...";
  submitBtn.disabled = true;

  try {
    const password = "teacher123"; // Default password

    // SOLUTION 1: Use Firebase REST API (No auto-login)
    const API_KEY = firebase.app().options.apiKey;

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
        returnSecureToken: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create teacher account");
    }

    const teacherUid = data.localId;

    console.log("Teacher account created:", email, "UID:", teacherUid);

    // Add to users collection
    await db.collection("users").doc(teacherUid).set({
      name: name,
      email: email,
      role: "teacher",
      status: "approved",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Add to teachers collection
    await db.collection("teachers").add({
      userId: teacherUid,
      name: name,
      email: email,
      department: department,
      subject: subject,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Teacher data saved to Firestore");

    // Show success message
    const messageDiv = document.getElementById("teacherMessage");
    messageDiv.textContent = `✅ Teacher "${name}" added successfully! Email: ${email} | Password: ${password}`;
    messageDiv.classList.add("show");

    // Reset form
    document.getElementById("addTeacherForm").reset();

    // Reload data
    loadStatistics();
    loadTeachers();

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.remove("show");
    }, 5000);
  } catch (error) {
    console.error("Error adding teacher:", error);

    let errorMessage = "Error adding teacher: " + error.message;

    if (error.message.includes("EMAIL_EXISTS")) {
      errorMessage = "Error: This email is already registered!";
    } else if (error.message.includes("INVALID_EMAIL")) {
      errorMessage = "Error: Invalid email address!";
    } else if (error.message.includes("WEAK_PASSWORD")) {
      errorMessage = "Error: Password is too weak!";
    }

    alert(errorMessage);
  } finally {
    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// ===== LOAD TEACHERS =====
async function loadTeachers() {
  try {
    const teachersSnapshot = await db.collection("teachers").get();

    const tbody = document.getElementById("teachersTableBody");
    tbody.innerHTML = "";

    if (teachersSnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No teachers found</td></tr>';
      return;
    }

    // Convert to array and sort by name
    let teachersList = [];
    teachersSnapshot.forEach((doc) => {
      teachersList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by name
    teachersList.sort((a, b) => {
      if (!a.name || !b.name) return 0;
      return a.name.localeCompare(b.name);
    });

    // Display teachers
    teachersList.forEach((teacher) => {
      const row = `
                <tr>
                    <td>${teacher.name}</td>
                    <td>${teacher.email}</td>
                    <td>${teacher.department}</td>
                    <td>${teacher.subject}</td>
                    <td>
                        <button onclick="editTeacher('${teacher.id}')" class="btn btn-warning btn-small">Edit</button>
                        <button onclick="deleteTeacher('${teacher.id}')" class="btn btn-danger btn-small">Delete</button>
                    </td>
                </tr>
            `;
      tbody.innerHTML += row;
    });

    console.log("Teachers loaded:", teachersList.length);
  } catch (error) {
    console.error("Error loading teachers:", error);
  }
}

// ===== EDIT TEACHER =====
async function editTeacher(teacherId) {
  try {
    const teacherDoc = await db.collection("teachers").doc(teacherId).get();
    const teacher = teacherDoc.data();

    // Fill form
    document.getElementById("editTeacherId").value = teacherId;
    document.getElementById("editTeacherName").value = teacher.name;
    document.getElementById("editTeacherEmail").value = teacher.email;
    document.getElementById("editTeacherDepartment").value = teacher.department;
    document.getElementById("editTeacherSubject").value = teacher.subject;

    // Show modal
    document.getElementById("editModal").classList.add("show");
  } catch (error) {
    console.error("Error loading teacher for edit:", error);
    alert("Error loading teacher data");
  }
}

// Close edit modal
function closeEditModal() {
  document.getElementById("editModal").classList.remove("show");
}

// Update teacher
document.getElementById("editTeacherForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const teacherId = document.getElementById("editTeacherId").value;
  const name = document.getElementById("editTeacherName").value.trim();
  const email = document.getElementById("editTeacherEmail").value.trim();
  const department = document.getElementById("editTeacherDepartment").value.trim();
  const subject = document.getElementById("editTeacherSubject").value.trim();

  try {
    await db.collection("teachers").doc(teacherId).update({
      name: name,
      email: email,
      department: department,
      subject: subject,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Teacher updated:", teacherId);
    alert("Teacher updated successfully!");

    closeEditModal();
    loadTeachers();
  } catch (error) {
    console.error("Error updating teacher:", error);
    alert("Error updating teacher: " + error.message);
  }
});

// ===== DELETE TEACHER =====
async function deleteTeacher(teacherId) {
  if (!confirm("Are you sure you want to delete this teacher?")) {
    return;
  }

  try {
    // Get teacher data
    const teacherDoc = await db.collection("teachers").doc(teacherId).get();
    const teacher = teacherDoc.data();

    // Delete from teachers collection
    await db.collection("teachers").doc(teacherId).delete();

    // Delete from users collection
    await db.collection("users").doc(teacher.userId).delete();

    // Note: Cannot delete from Firebase Auth without Admin SDK
    // The auth account will remain but user data is deleted

    console.log("Teacher deleted:", teacherId);
    alert("Teacher deleted successfully!");

    loadStatistics();
    loadTeachers();
  } catch (error) {
    console.error("Error deleting teacher:", error);
    alert("Error deleting teacher: " + error.message);
  }
}

// ===== LOAD PENDING STUDENTS =====
async function loadPendingStudents() {
  try {
    // Get all users and filter in JavaScript (no index needed)
    const usersSnapshot = await db.collection("users").get();

    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML = "";

    let pendingStudents = [];

    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      if (user.role === "student" && user.status === "pending") {
        pendingStudents.push({
          id: doc.id,
          ...user,
        });
      }
    });

    if (pendingStudents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No pending students</td></tr>';
      return;
    }

    // Sort by createdAt (newest first)
    pendingStudents.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });

    pendingStudents.forEach((student) => {
      const date = student.createdAt ? student.createdAt.toDate().toLocaleDateString() : "N/A";

      const row = `
                <tr>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${date}</td>
                    <td>
                        <button onclick="approveStudent('${student.id}')" class="btn btn-success btn-small">Approve</button>
                        <button onclick="rejectStudent('${student.id}')" class="btn btn-danger btn-small">Reject</button>
                    </td>
                </tr>
            `;
      tbody.innerHTML += row;
    });

    console.log("Pending students loaded:", pendingStudents.length);
  } catch (error) {
    console.error("Error loading pending students:", error);
    // Show error in table
    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align: center; color: red;">Error loading students. Check console.</td></tr>';
  }
}

// ===== APPROVE STUDENT =====
async function approveStudent(studentId) {
  try {
    await db.collection("users").doc(studentId).update({
      status: "approved",
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Student approved:", studentId);
    alert("Student approved successfully!");

    loadStatistics();
    loadPendingStudents();
  } catch (error) {
    console.error("Error approving student:", error);
    alert("Error approving student: " + error.message);
  }
}

// ===== REJECT STUDENT =====
async function rejectStudent(studentId) {
  if (!confirm("Are you sure you want to reject this student?")) {
    return;
  }

  try {
    await db.collection("users").doc(studentId).update({
      status: "rejected",
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Student rejected:", studentId);
    alert("Student registration rejected.");

    loadStatistics();
    loadPendingStudents();
  } catch (error) {
    console.error("Error rejecting student:", error);
    alert("Error rejecting student: " + error.message);
  }
}

// ===== LOAD ALL APPOINTMENTS =====
async function loadAllAppointments() {
  try {
    const appointmentsSnapshot = await db.collection("appointments").get();

    const tbody = document.getElementById("appointmentsTableBody");
    tbody.innerHTML = "";

    if (appointmentsSnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No appointments found</td></tr>';
      return;
    }

    // Convert to array and sort by date
    let appointmentsList = [];
    appointmentsSnapshot.forEach((doc) => {
      appointmentsList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by date (newest first)
    appointmentsList.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date) - new Date(a.date);
    });

    // Display appointments
    appointmentsList.forEach((apt) => {
      const date = apt.date ? new Date(apt.date).toLocaleDateString() : "N/A";
      const statusClass = `status-${apt.status}`;

      const row = `
                <tr>
                    <td>${apt.studentName}</td>
                    <td>${apt.teacherName}</td>
                    <td>${date}</td>
                    <td>${apt.time}</td>
                    <td>${apt.purpose}</td>
                    <td><span class="status-badge ${statusClass}">${apt.status}</span></td>
                </tr>
            `;
      tbody.innerHTML += row;
    });

    console.log("All appointments loaded:", appointmentsList.length);
  } catch (error) {
    console.error("Error loading appointments:", error);
  }
}
