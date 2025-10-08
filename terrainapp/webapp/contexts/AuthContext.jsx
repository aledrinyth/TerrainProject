import React, { useState, useEffect, useContext, createContext } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, getIdTokenResult, signOut } from 'firebase/auth'; // <-- ADD signOut

// Auth Context
// This context will hold the authentication state and be accessible by child components.
const authContext = createContext();

// Provider Component
// This component will wrap your application and provide the auth context to its children.
export function ProvideAuth({ children }) {
  const authData = useProvideAuth();
  return (
    <authContext.Provider value={authData}>
      {children}
    </authContext.Provider>
  );
}

// Custom hook that components will use
// This hook simplifies accessing the auth context data.
export const useAuth = () => {
  return useContext(authContext);
};

// Create the hook that contains all the authentication logic
function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in.
        const idTokenResult = await getIdTokenResult(firebaseUser);
        const userIsAdmin = idTokenResult.claims.admin === true;

        // Set the user object and their admin status in state
        setUser(firebaseUser);
        setIsAdmin(userIsAdmin);
      } else {
        // User is signed out.
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false); // Finished loading auth state
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  // sign-in, sign-out functions should probably go here in the future
  const signout = () => {
    return signOut(auth); // State will be updated by the onAuthStateChanged listener
  };

  // Return the user state and any auth methods you want to expose
  return {
    user,
    isAdmin,
    loading,
    signout, // EXPOSE signout
  };
}