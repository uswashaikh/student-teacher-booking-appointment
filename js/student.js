/* 
    File: student.js
    Location: /js/student.js
    Description: Student dashboard functionality - search teachers and book appointments
*/

let currentStudentId = null;
let currentStudentName = null;
let allTeachers = [];

// Check if user is authenticated and is student
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        if (userData.role !== 'student') {
            alert('Access denied! Students only.');
            window.location.href = 'login.html';
            return;
        }
        
        if (userData.status !== 'approved') {
            alert('Your account is pending approval. Please wait.');
            await auth.signOut();
            window.location.href = 'login.html';
            return;
        }
        
        currentStudentId = user.uid;
        currentStudentName = userData.name;
        
        // Display student name
        document.getElementById('studentName').textContent = userData.name || 'Student';
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentDate').setAttribute('min', today);
        
        // Load data
        loadStatistics();
        loadTeachers();
        loadMyAppointments();
        loadMessages(); // Load messages
        
    } catch (error) {
        console.error('Error checking student access:', error);
        window.location.href = 'login.html';
    }
});

// ===== LOAD STATISTICS =====
async function loadStatistics() {
    try {
        const appointmentsSnapshot = await db.collection('appointments').get();
        
        let totalAppointments = 0;
        let pendingAppointments = 0;
        let approvedAppointments = 0;
        
        appointmentsSnapshot.forEach((doc) => {
            const apt = doc.data();
            if (apt.studentId === currentStudentId) {
                totalAppointments++;
                
                if (apt.status === 'pending') {
                    pendingAppointments++;
                } else if (apt.status === 'approved') {
                    approvedAppointments++;
                }
            }
        });
        
        document.getElementById('totalAppointments').textContent = totalAppointments;
        document.getElementById('pendingAppointments').textContent = pendingAppointments;
        document.getElementById('approvedAppointments').textContent = approvedAppointments;
        
        console.log('Statistics loaded');
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// ===== LOAD TEACHERS =====
async function loadTeachers() {
    try {
        const teachersSnapshot = await db.collection('teachers').get();
        
        allTeachers = [];
        
        teachersSnapshot.forEach((doc) => {
            allTeachers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort by name
        allTeachers.sort((a, b) => {
            if (!a.name || !b.name) return 0;
            return a.name.localeCompare(b.name);
        });
        
        displayTeachers(allTeachers);
        console.log('Teachers loaded:', allTeachers.length);
        
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

// ===== DISPLAY TEACHERS =====
function displayTeachers(teachers) {
    const tbody = document.getElementById('teachersTableBody');
    tbody.innerHTML = '';
    
    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No teachers found</td></tr>';
        return;
    }
    
    teachers.forEach((teacher) => {
        const row = `
            <tr>
                <td>${teacher.name}</td>
                <td>${teacher.department}</td>
                <td>${teacher.subject}</td>
                <td>${teacher.email}</td>
                <td>
                    <button onclick="openBookModal('${teacher.id}', '${teacher.name}')" class="btn btn-primary btn-small">
                        Book Appointment
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// ===== SEARCH TEACHERS =====
function searchTeachers() {
    const nameQuery = document.getElementById('searchName').value.toLowerCase();
    const deptQuery = document.getElementById('searchDepartment').value.toLowerCase();
    const subjectQuery = document.getElementById('searchSubject').value.toLowerCase();
    
    const filtered = allTeachers.filter(teacher => {
        const matchName = teacher.name.toLowerCase().includes(nameQuery);
        const matchDept = teacher.department.toLowerCase().includes(deptQuery);
        const matchSubject = teacher.subject.toLowerCase().includes(subjectQuery);
        
        return matchName && matchDept && matchSubject;
    });
    
    displayTeachers(filtered);
    console.log('Search results:', filtered.length);
}

// ===== OPEN BOOK MODAL =====
function openBookModal(teacherId, teacherName) {
    document.getElementById('selectedTeacherId').value = teacherId;
    document.getElementById('selectedTeacherName').value = teacherName;
    document.getElementById('displayTeacherName').value = teacherName;
    
    // Clear form
    document.getElementById('appointmentDate').value = '';
    document.getElementById('appointmentTime').value = '';
    document.getElementById('appointmentPurpose').value = '';
    
    document.getElementById('bookModal').classList.add('show');
}

// ===== CLOSE BOOK MODAL =====
function closeBookModal() {
    document.getElementById('bookModal').classList.remove('show');
}

// ===== BOOK APPOINTMENT =====
document.getElementById('bookAppointmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const teacherId = document.getElementById('selectedTeacherId').value;
    const teacherName = document.getElementById('selectedTeacherName').value;
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    const purpose = document.getElementById('appointmentPurpose').value.trim();
    
    try {
        // Check if appointment already exists for same date/time
        const existingSnapshot = await db.collection('appointments')
            .where('studentId', '==', currentStudentId)
            .where('teacherId', '==', teacherId)
            .where('date', '==', date)
            .where('time', '==', time)
            .get();
        
        if (!existingSnapshot.empty) {
            alert('You already have an appointment at this time!');
            return;
        }
        
        // Create appointment
        await db.collection('appointments').add({
            studentId: currentStudentId,
            teacherId: teacherId,
            studentName: currentStudentName,
            teacherName: teacherName,
            date: date,
            time: time,
            purpose: purpose,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Appointment booked:', { teacherId, date, time });
        
        const messageDiv = document.getElementById('bookMessage');
        messageDiv.textContent = 'Appointment booked successfully! Waiting for teacher approval.';
        messageDiv.classList.add('show');
        
        // Reload appointments
        loadStatistics();
        loadMyAppointments();
        
        // Close modal after 2 seconds
        setTimeout(() => {
            closeBookModal();
            messageDiv.classList.remove('show');
        }, 2000);
        
    } catch (error) {
        console.error('Error booking appointment:', error);
        alert('Error booking appointment: ' + error.message);
    }
});

// ===== LOAD MY APPOINTMENTS =====
async function loadMyAppointments() {
    try {
        const appointmentsSnapshot = await db.collection('appointments').get();
        
        const tbody = document.getElementById('appointmentsTableBody');
        tbody.innerHTML = '';
        
        let myAppointments = [];
        
        appointmentsSnapshot.forEach((doc) => {
            const apt = doc.data();
            if (apt.studentId === currentStudentId) {
                myAppointments.push({
                    id: doc.id,
                    ...apt
                });
            }
        });
        
        if (myAppointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No appointments found</td></tr>';
            return;
        }
        
        // Sort by date (newest first)
        myAppointments.sort((a, b) => {
            if (!a.date || !b.date) return 0;
            return new Date(b.date) - new Date(a.date);
        });
        
        myAppointments.forEach((apt) => {
            const date = apt.date ? new Date(apt.date).toLocaleDateString() : 'N/A';
            const statusClass = `status-${apt.status}`;
            
            let actionButtons = '';
            if (apt.status === 'pending' || apt.status === 'approved') {
                actionButtons = `
                    <button onclick="cancelMyAppointment('${apt.id}')" class="btn btn-danger btn-small">
                        Cancel
                    </button>
                `;
            } else {
                actionButtons = '<span style="color: #999;">No actions</span>';
            }
            
            const row = `
                <tr>
                    <td>${apt.teacherName}</td>
                    <td>${date}</td>
                    <td>${apt.time}</td>
                    <td>${apt.purpose}</td>
                    <td><span class="status-badge ${statusClass}">${apt.status}</span></td>
                    <td>${actionButtons}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
        
        console.log('My appointments loaded:', myAppointments.length);
        
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

// ===== CANCEL MY APPOINTMENT =====
async function cancelMyAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
    }
    
    try {
        await db.collection('appointments').doc(appointmentId).update({
            status: 'cancelled',
            cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
            cancelledBy: 'student'
        });
        
        console.log('Appointment cancelled:', appointmentId);
        alert('Appointment cancelled successfully!');
        
        loadStatistics();
        loadMyAppointments();
        
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Error cancelling appointment: ' + error.message);
    }
}

// ===== LOAD MESSAGES ===== (NEW FEATURE)
async function loadMessages() {
    try {
        const messagesSnapshot = await db.collection('messages').get();
        
        let myMessages = [];
        
        messagesSnapshot.forEach((doc) => {
            const msg = doc.data();
            if (msg.receiverId === currentStudentId) {
                myMessages.push({
                    id: doc.id,
                    ...msg
                });
            }
        });
        
        // Check if messages section exists in HTML
        const messagesDiv = document.getElementById('messagesContainer');
        if (!messagesDiv) {
            console.log('Messages container not found in HTML');
            return;
        }
        
        if (myMessages.length === 0) {
            messagesDiv.innerHTML = '<p style="text-align: center; color: #999;">No messages yet</p>';
            return;
        }
        
        // Sort by timestamp (newest first)
        myMessages.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return b.timestamp.toMillis() - a.timestamp.toMillis();
        });
        
        // Display messages
        let messagesHTML = '';
        myMessages.forEach((msg) => {
            const date = msg.timestamp ? msg.timestamp.toDate().toLocaleString() : 'N/A';
            const readClass = msg.read ? '' : 'unread';
            
            messagesHTML += `
                <div class="message-item ${readClass}">
                    <div class="message-header">
                        <strong>From: ${msg.senderName}</strong>
                        <span class="message-date">${date}</span>
                    </div>
                    <div class="message-subject"><strong>Subject:</strong> ${msg.subject}</div>
                    <div class="message-body">${msg.message}</div>
                </div>
            `;
        });
        
        messagesDiv.innerHTML = messagesHTML;
        console.log('Messages loaded:', myMessages.length);
        
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}