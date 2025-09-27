
import { useState } from 'react';
import { signInWithEmailAndPassword, getIdTokenResult } from 'firebase/auth';
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
      className="w-[358px] h-[60px] border-2 border-black rounded-full text-center font-mono placeholder-black focus:outline-none focus:ring-2 focus:ring-sky-400"
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
        alert('Login successful! Welcome, Admin!');
        navigate('/admin');
        // Redirect to admin dashboard: history.push('/admin') or similar
      } else {
        alert('Login successful! Welcome, User!');
        navigate('/booking');
        // Redirect to normal user dashboard: history.push('/dashboard')
      }

    } catch (error) {
      const errorMessage = error.message;
      console.error("Login failed:", errorMessage);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100">
      
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
          className="w-[358px] h-[60px] border-2 border-black rounded-full bg-[#D9D9D9] font-mono hover:bg-gray-400 transition-colors"
          >
            ENTER
          </button>
        </form>
        <a href="#" className="font-mono text-sm mt-2 hover:underline">
          FORGOT PASSWORD?
        </a>
      </main>
    </div>
  );
}


