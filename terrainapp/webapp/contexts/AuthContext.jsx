import React, { useState, useEffect, useContext, createContext } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, getIdTokenResult, signOut } from 'firebase/auth';

// Auth Context
// This context holds the authentication state and is accessible by child components.
const authContext = createContext();

// Provider Component
// This component wraps the application and provides the auth context to its children.
export function ProvideAuth({ children }) {
  const authData = useProvideAuth();
  return (
    <authContext.Provider value={authData}>
      {children}
    </authContext.Provider>
  );
}

// Custom hook that components will use to access the auth context.
export const useAuth = () => {
  return useContext(authContext);
};

// Hook containing all the authentication logic.
function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const signout = () => {
    return signOut(auth);
  };

  // Return the user state and any auth methods you want to expose
  return {
    user,
    isAdmin,
    loading,
    signout,
  };
}