/* 
    File: teacher.js
    Location: /js/teacher.js
    Description: Teacher dashboard functionality - manage appointments and messages
*/

let currentTeacherId = null;
let allAppointments = [];

// Check if user is authenticated and is teacher
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.data();

    if (userData.role !== "teacher") {
      alert("Access denied! Teachers only.");
      window.location.href = "login.html";
      return;
    }

    // Get teacher ID from teachers collection
    const teacherSnapshot = await db.collection("teachers").where("userId", "==", user.uid).get();

    if (!teacherSnapshot.empty) {
      currentTeacherId = teacherSnapshot.docs[0].id;

      // Display teacher name
      document.getElementById("teacherName").textContent = userData.name || "Teacher";

      // Load data
      loadStatistics();
      loadAppointments();
      loadStudents();
    } else {
      alert("Teacher profile not found!");
      window.location.href = "login.html";
    }
  } catch (error) {
    console.error("Error checking teacher access:", error);
    window.location.href = "login.html";
  }
});

// ===== LOAD STATISTICS ===== (FIXED)
async function loadStatistics() {
  try {
    // Get all appointments and filter manually
    const appointmentsSnapshot = await db.collection("appointments").get();

    let totalAppointments = 0;
    let pendingAppointments = 0;
    let approvedToday = 0;

    const today = new Date().toDateString();

    appointmentsSnapshot.forEach((doc) => {
      const apt = doc.data();

      // Only count appointments for this teacher
      if (apt.teacherId === currentTeacherId) {
        totalAppointments++;

        if (apt.status === "pending") {
          pendingAppointments++;
        }

        if (apt.status === "approved" && new Date(apt.date).toDateString() === today) {
          approvedToday++;
        }
      }
    });

    document.getElementById("totalAppointments").textContent = totalAppointments;
    document.getElementById("pendingAppointments").textContent = pendingAppointments;
    document.getElementById("approvedToday").textContent = approvedToday;

    console.log("Statistics loaded - Total:", totalAppointments, "Pending:", pendingAppointments);
  } catch (error) {
    console.error("Error loading statistics:", error);
  }
}

// ===== LOAD APPOINTMENTS ===== (FIXED)
async function loadAppointments() {
  try {
    // Get all appointments and filter manually (no index needed)
    const appointmentsSnapshot = await db.collection("appointments").get();

    allAppointments = [];
    const tbody = document.getElementById("appointmentsTableBody");
    tbody.innerHTML = "";

    // Filter appointments for current teacher
    appointmentsSnapshot.forEach((doc) => {
      const apt = doc.data();
      if (apt.teacherId === currentTeacherId) {
        allAppointments.push({
          id: doc.id,
          ...apt,
        });
      }
    });

    if (allAppointments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No appointments found</td></tr>';
      console.log("No appointments found for teacher:", currentTeacherId);
      return;
    }

    // Sort by date (newest first)
    allAppointments.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date) - new Date(a.date);
    });

    displayAppointments(allAppointments);
    console.log("Appointments loaded:", allAppointments.length);
  } catch (error) {
    console.error("Error loading appointments:", error);
    const tbody = document.getElementById("appointmentsTableBody");
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: red;">Error loading appointments. Check console.</td></tr>';
  }
}

// ===== DISPLAY APPOINTMENTS =====
function displayAppointments(appointments) {
  const tbody = document.getElementById("appointmentsTableBody");
  tbody.innerHTML = "";

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No appointments found</td></tr>';
    return;
  }

  appointments.forEach((apt) => {
    const date = apt.date ? new Date(apt.date).toLocaleDateString() : "N/A";
    const statusClass = `status-${apt.status}`;

    let actionButtons = "";
    if (apt.status === "pending") {
      actionButtons = `
                <button onclick="approveAppointment('${apt.id}')" class="btn btn-success btn-small">Approve</button>
                <button onclick="cancelAppointment('${apt.id}')" class="btn btn-danger btn-small">Cancel</button>
            `;
    } else if (apt.status === "approved") {
      actionButtons = `
                <button onclick="cancelAppointment('${apt.id}')" class="btn btn-danger btn-small">Cancel</button>
            `;
    } else {
      actionButtons = '<span style="color: #999;">No actions</span>';
    }

    const row = `
            <tr>
                <td>${apt.studentName || "N/A"}</td>
                <td>${date}</td>
                <td>${apt.time || "N/A"}</td>
                <td>${apt.purpose || "N/A"}</td>
                <td><span class="status-badge ${statusClass}">${apt.status}</span></td>
                <td>${actionButtons}</td>
            </tr>
        `;
    tbody.innerHTML += row;
  });
}

// ===== FILTER APPOINTMENTS =====
function filterAppointments() {
  const filterValue = document.getElementById("statusFilter").value;

  if (filterValue === "all") {
    displayAppointments(allAppointments);
  } else {
    const filtered = allAppointments.filter((apt) => apt.status === filterValue);
    displayAppointments(filtered);
  }

  console.log("Filtered appointments by status:", filterValue);
}

// ===== APPROVE APPOINTMENT =====
async function approveAppointment(appointmentId) {
  if (!confirm("Approve this appointment?")) {
    return;
  }

  try {
    await db.collection("appointments").doc(appointmentId).update({
      status: "approved",
      approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Appointment approved:", appointmentId);
    alert("Appointment approved successfully!");

    loadStatistics();
    loadAppointments();
  } catch (error) {
    console.error("Error approving appointment:", error);
    alert("Error approving appointment: " + error.message);
  }
}

// ===== CANCEL APPOINTMENT =====
async function cancelAppointment(appointmentId) {
  const reason = prompt("Enter reason for cancellation (optional):");

  if (reason === null) {
    return; // User clicked cancel
  }

  try {
    await db
      .collection("appointments")
      .doc(appointmentId)
      .update({
        status: "cancelled",
        cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
        cancellationReason: reason || "No reason provided",
      });

    console.log("Appointment cancelled:", appointmentId);
    alert("Appointment cancelled successfully!");

    loadStatistics();
    loadAppointments();
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    alert("Error cancelling appointment: " + error.message);
  }
}

// ===== LOAD STUDENTS FOR MESSAGING =====
async function loadStudents() {
  try {
    // Get all appointments for this teacher
    const appointmentsSnapshot = await db.collection("appointments").get();

    const studentIds = new Set();
    appointmentsSnapshot.forEach((doc) => {
      const apt = doc.data();
      if (apt.teacherId === currentTeacherId) {
        studentIds.add(apt.studentId);
      }
    });

    const select = document.getElementById("studentSelect");
    select.innerHTML = '<option value="">-- Select Student --</option>';

    if (studentIds.size === 0) {
      console.log("No students found with appointments");
      return;
    }

    // Get student details
    for (const studentId of studentIds) {
      try {
        const studentDoc = await db.collection("users").doc(studentId).get();
        if (studentDoc.exists) {
          const student = studentDoc.data();
          const option = document.createElement("option");
          option.value = studentId;
          option.textContent = student.name || student.email;
          select.appendChild(option);
        }
      } catch (err) {
        console.error("Error loading student:", studentId, err);
      }
    }

    console.log("Students loaded for messaging:", studentIds.size);
  } catch (error) {
    console.error("Error loading students:", error);
  }
}

// ===== SEND MESSAGE =====
document.getElementById("sendMessageForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentId = document.getElementById("studentSelect").value;
  const subject = document.getElementById("messageSubject").value.trim();
  const message = document.getElementById("messageText").value.trim();

  if (!studentId) {
    alert("Please select a student");
    return;
  }

  try {
    const user = auth.currentUser;
    const userDoc = await db.collection("users").doc(user.uid).get();
    const userData = userDoc.data();

    await db.collection("messages").add({
      senderId: user.uid,
      receiverId: studentId,
      senderName: userData.name,
      senderRole: "teacher",
      subject: subject,
      message: message,
      read: false,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    console.log("Message sent to student:", studentId);

    const statusDiv = document.getElementById("messageStatus");
    statusDiv.textContent = "Message sent successfully!";
    statusDiv.classList.add("show");

    // Reset form
    document.getElementById("sendMessageForm").reset();

    setTimeout(() => {
      statusDiv.classList.remove("show");
    }, 3000);
  } catch (error) {
    console.error("Error sending message:", error);
    alert("Error sending message: " + error.message);
  }
});
