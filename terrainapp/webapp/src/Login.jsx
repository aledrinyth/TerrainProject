import { useState } from 'react';
import { signInWithEmailAndPassword, getIdTokenResult, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Reusable component for the input fields
const LoginInput = ({ placeholder, type = 'text', value, onChange }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-[358px] h-[60px] border-2 border-black rounded-full text-center font-gt-america placeholder-black focus:outline-none focus:ring-2 focus:ring-terrain-blue"
    />
  );
};

// Logo component
const Logo = () => {
  return (
    <img
      src="/terrain.svg"
      alt="Terrain Logo"
      className="w-[558px] h-auto" // Use Tailwind classes for responsive sizing
    />
  );
};

// Main Login Page component
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const user = userCredential.user;

      // ** GET THE TOKEN AND CHECK CLAIMS **
      const idTokenResult = await getIdTokenResult(user);

      // The 'admin' property will be true if the custom claim is set
      const isAdmin = idTokenResult.claims.admin === true;

      console.log('User signed in:', user.email);
      console.log('Is Admin:', isAdmin);

      if (isAdmin) {
        navigate('/admin');
        // Redirect to admin dashboard: history.push('/admin') or similar
      } else {
        navigate('/booking');
        // Redirect to normal user dashboard: history.push('/dashboard')
      }

    } catch (error) {
      // Check for common authentication errors
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        alert('Login failed: Invalid email or password. Please try again.');
      } else {
        console.error("Login failed:", error);
        alert('An unknown error occurred during login. Please try again later.');
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!username || username.trim() === '') {
      alert('Please enter your email address in the EMAIL field first, then click FORGOT PASSWORD.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, username);
      alert('Password reset email sent! Please check your inbox and spam folder.');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        alert('If an account exists with this email, a password reset link has been sent.');
      } else if (error.code === 'auth/invalid-email') {
        alert('Please enter a valid email address.');
      } else {
        console.error('Password reset error:', error);
        alert('Failed to send reset email. Please try again later.');
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-gt-america bg-terrain-white">
      
      {/* Header with absolute positioning for the logo */}
      <header className="absolute top-[124px]">
        <Logo />
      </header>
      
      {/* Main login form */}
      <main className="flex flex-col items-center gap-y-6 pt-[300px]"> {/* Added padding-top to push form below logo */}
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-y-6">
          <LoginInput
            placeholder="EMAIL"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <LoginInput
            placeholder="PASSWORD"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
          type="submit"
          className="w-[358px] h-[60px] border-2 border-black rounded-full bg-terrain-green font-gt-america hover:opacity-90 transition-all hover-cursor-green"
          >
            ENTER
          </button>
        </form>
        <button type="button" onClick={handleForgotPassword} className="font-gt-america text-sm mt-2 hover:underline cursor-pointer bg-transparent border-none p-0">
          FORGOT PASSWORD?
        </button>
      </main>
    </div>
  );
}