async function authUser(email, password) {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Login failed: " + error.message);
    } else {
        // Successful login! Supabase automatically saves the session token in the background.
        window.location.href = 'index.html';
    }
}

async function registerUser(email, password) {
    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Registration Error:", error.message);
        alert("Error: " + error.message);
    } else {
        alert("Registration successful! Check your email for a confirmation link.");
        console.log("User created:", data.user);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            const user_id = document.getElementById('user_id').value.trim();
            const user_password = document.getElementById('user_password').value.trim();
            console.log(user_id, user_password);
            
            authUser(user_id, user_password);
        })
    }

    const authContainer = document.getElementById('auth-content');

    function capitalizeWords(sentence) {
        // Convert the whole string to lowercase first for consistency
        const words = sentence.toLowerCase().split(' ');

        for (let i = 0; i < words.length; i++) {
            if (words[i].length > 0) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
            }
        }

        return words.join(' ');
    }

    async function handleSignUp(e) {
        e.preventDefault();
        
        const name = document.getElementById('reg_name').value;
        const email = document.getElementById('reg_email').value;
        const password = document.getElementById('reg_password').value;
        const confirm = document.getElementById('reg_confirm').value;

        

        if (password !== confirm) {
            alert("Passwords do not match!");
            return;
        }

        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: capitalizeWords(name), // This stores the name in the user_metadata
                }
            }
        });

        if (error) {
            alert(error.message);
        } else {
            alert("Success! Check your email for the confirmation link.");
            showLoginForm();
        }
    }   

    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'toggle-auth') {
            e.preventDefault();
            const isLoggingIn = e.target.innerText === "Sign Up";

            if (isLoggingIn) {
                showSignUpForm();
            } else {
                showLoginForm();
            }
        }
    });

    function showSignUpForm() {
        authContainer.innerHTML = `
            <div class="login-header">
                <h2>Create Account</h2>
                <p>Join the NCBA.LIFE community</p>
            </div>

            <form class="login-form" id="signup-form">
                <div class="input-group">
                    <label>Full Name</label>
                    <input type="text" id="reg_name" placeholder="Juan Dela Cruz" required>
                </div>
                <div class="input-group">
                    <label>Email Address</label>
                    <input type="email" id="reg_email" placeholder="student@ncba.edu.ph" required>
                </div>
                <div class="input-group">
                    <label>Password</label>
                    <input type="password" id="reg_password" placeholder="Min. 8 characters" required>
                </div>
                <div class="input-group">
                    <label>Confirm Password</label>
                    <input type="password" id="reg_confirm" placeholder="Repeat password" required>
                </div>

                <button type="submit" class="btn-primary">Create Account</button>
            </form>

            <div class="register-prompt">
                <p>Already have an account? <a href="#" id="toggle-auth">Log In</a></p>
            </div>
        `;
        
        // Attach the new signup submit listener
        document.getElementById('signup-form').addEventListener('submit', handleSignUp);
    }

    function showLoginForm() {
        // This just reloads the page to get the original state back, 
        // or you can store the original HTML in a variable and inject it.
        window.location.reload(); 
    }
})