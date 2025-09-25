const { adminAuth } = require('../config/firebase')

const checkIfAdmin = async (req, res, next) => {
  // 1. Get the ID token from the Authorization header
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).send('Unauthorized: No token provided.');
  }

  try {
    // 2. Verify the token using the Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // 3. Check for the admin custom claim
    if (decodedToken.admin === true) {
      req.user = decodedToken; // Optionally pass the decoded token to the next handler
      return next();
    } else {
      return res.status(403).send('Forbidden: User is not an admin.');
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).send('Unauthorized: Invalid token.');
  }
};

module.exports = { checkIfAdmin };