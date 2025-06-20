@echo off

echo Deploying Firestore rules...
firebase deploy --only firestore:rules

echo Deploying Firestore indexes...
firebase deploy --only firestore:indexes

echo Installing functions dependencies...
cd functions
npm install

echo Deploying Cloud Functions...
firebase deploy --only functions

cd ..
echo Deployment complete!
pause
