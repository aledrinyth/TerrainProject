import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    // You can return a loading spinner here
    return <div>Loading...</div>;
  }

  if (!user) {
    // If the user is not authenticated, redirect to the login page
    return <Navigate to="/" />;
  }

  // If the user is authenticated, render the children components
  return children;
};

export default ProtectedRoute;