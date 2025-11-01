#!/bin/bash

echo "Filling in env variables and deploying"
# Make sure youre inside the setup directory
# Read the setup files and create the .env files for the general setup
sed -n '/<GENERAL_ENV>/,/<\/GENERAL_ENV>/ { //d; p; }' setup.txt > ../.env
# Read the setup files to create the .env files for the webapp directory
sed -n '/<WEBAPP_ENV>/,/<\/WEBAPP_ENV>/ { //d; p ; }' setup.txt > ../webapp/.env
# Read the setup files to get the project name
PROJECT_NAME=$(sed -n '/<PROJECT_NAME>/,/<\/PROJECT_NAME>/ { //d; p ; }' setup.txt)
# Read the setup files to get the firebase hosting site
FIREBASE_HOSTING_SITE=$(sed -n '/<FIREBASE_HOSTING_SITE>/,/<\/FIREBASE_HOSTING_SITE>/ { //d; p ; }' setup.txt)

# Create the firebase.json file necessary
cat > ../firebase.json << EOL
{
  "functions": {
    "source": "backend",
    "codebase": "default",
    "runtime": "nodejs20"
  },
  "hosting": {
    "site": "${FIREBASE_HOSTING_SITE}",    
    "public": "webapp/dist", 
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**", 
        "function": "app"
      },
      {
        "source": "**", 
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
EOL

# Now run npm install to download all the packages
cd ..
cd backend
npm install
cd ..
cd webapp
npm install

# Build the app to be served
npm run build

# Rewrite and deploy
firebase use ${PROJECT_NAME}

# Pipe the output to grep directly
DEPLOY_OUTPUT=$(firebase deploy --only hosting,functions 2>&1)

# 2. Extract the URL using grep to find the line and awk to split it
HOSTING_URL=$(echo "$DEPLOY_OUTPUT" | \
  grep "Hosting URL:" | \
  awk '{print $3}')

# 3. Use the variable
echo "Deployment Complete. Access your site at: $HOSTING_URL"

# Please enter the name for the account you want to make into an admin
# Prompt for the Firebase Project ID
read -p "Enter the email of your first admin(Make sure this user exists): " ADMIN_EMAIL

curl -X POST \
  -H "Content-Type: application/json" \
  "${HOSTING_URL}/api/user/set-admin-role/${ADMIN_EMAIL}"

echo "Script execution complete."
