/* 
    File: auth.js
    Location: /js/auth.js
    Description: Authentication functions for login and registration
*/

// ===== STUDENT REGISTRATION =====
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        // Clear previous messages
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
        successDiv.textContent = '';
        successDiv.classList.remove('show');
        
        // Validation
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match!';
            errorDiv.classList.add('show');
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters!';
            errorDiv.classList.add('show');
            return;
        }
        
        try {
            // Create user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('User registered:', email);
            
            // Save user data to Firestore
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'student',
                status: 'pending', // Needs admin approval
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('User data saved to Firestore');
            
            // Show success message
            successDiv.textContent = 'Registration successful! Please wait for admin approval before logging in.';
            successDiv.classList.add('show');
            
            // Sign out the user (they need approval first)
            await auth.signOut();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            
        } catch (error) {
            console.error('Registration error:', error);
            
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already registered. Please login instead.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            }
            
            errorDiv.textContent = errorMessage;
            errorDiv.classList.add('show');
        }
    });
}

// ===== USER LOGIN =====
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        
        // Clear previous error
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
        
        try {
            // Sign in user
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('User logged in:', email);
            
            // Get user data from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                throw new Error('User data not found');
            }
            
            const userData = userDoc.data();
            
            // Check if student account is approved
            if (userData.role === 'student' && userData.status === 'pending') {
                errorDiv.textContent = 'Your account is pending approval. Please wait for admin approval.';
                errorDiv.classList.add('show');
                await auth.signOut();
                return;
            }
            
            if (userData.role === 'student' && userData.status === 'rejected') {
                errorDiv.textContent = 'Your account has been rejected. Please contact admin.';
                errorDiv.classList.add('show');
                await auth.signOut();
                return;
            }
            
            console.log('User role:', userData.role);
            
            // Redirect based on role
            if (userData.role === 'admin') {
                window.location.href = 'admin.html';
            } else if (userData.role === 'teacher') {
                window.location.href = 'teacher.html';
            } else if (userData.role === 'student') {
                window.location.href = 'student.html';
            } else {
                throw new Error('Invalid user role');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            errorDiv.textContent = errorMessage;
            errorDiv.classList.add('show');
        }
    });
}

// ===== CHECK AUTH STATE =====
// Redirect if user is already logged in
auth.onAuthStateChanged(async (user) => {
    // Only check on login and register pages
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user && (currentPage === 'login.html' || currentPage === 'register.html')) {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Redirect based on role
                if (userData.role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (userData.role === 'teacher') {
                    window.location.href = 'teacher.html';
                } else if (userData.role === 'student' && userData.status === 'approved') {
                    window.location.href = 'student.html';
                }
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }
});

// ===== LOGOUT FUNCTION =====
function logout() {
    auth.signOut().then(() => {
        console.log('User logged out');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    });
}

// ===== CHECK IF USER IS AUTHENTICATED =====
function checkAuth() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                resolve(user);
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
            }
        });
    });
}

// ===== GET CURRENT USER DATA =====
async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            return {
                uid: user.uid,
                ...userDoc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}