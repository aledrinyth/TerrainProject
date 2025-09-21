
import { useState } from 'react';

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
      style={{ width: '558px', height: '231px' }} 
    />
  );
};

// Main Login Page component
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100">
      
      {/* Header with absolute positioning for the logo */}
      <header className="absolute top-[124px]">
        <Logo />
      </header>
      
      {/* Main login form */}
      <main className="flex flex-col items-center gap-y-6 pt-[300px]"> {/* Added padding-top to push form below logo */}
        <LoginInput
          placeholder="USERNAME / EMAIL"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <LoginInput
          placeholder="PASSWORD"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-[358px] h-[60px] border-2 border-black rounded-full bg-[#D9D9D9] font-mono hover:bg-gray-400 transition-colors">
          ENTER
        </button>
        <a href="#" className="font-mono text-sm mt-2 hover:underline">
          FORGOT PASSWORD?
        </a>
      </main>
    </div>
  );
}