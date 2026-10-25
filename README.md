# Nexa Login

A responsive React + Vite sign-in experience with accessible form states, Firebase Authentication hooks, and a clearly labeled, simulated judge demo.

## Run locally

1. Install [Node.js](https://nodejs.org/) (the current LTS release is recommended).
2. Open this folder in VS Code.
3. Open **Terminal → New Terminal** and run:

   ```powershell
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite, usually `http://localhost:5173`.

To create a production build, run `npm run build`. To preview that build locally, run `npm run preview`.

## Try the judge demo

Choose **Try demo**, enter any non-empty identifier and password, then choose **Sign in**. The resulting screen is explicitly labeled as a simulated preview: it does not create an account, authenticate a user, or contact a server. Turn demo mode off before trying real authentication.

## Connect Firebase Authentication

1. Create a Firebase project and add a web app in the [Firebase console](https://console.firebase.google.com/).
2. In **Authentication → Sign-in method**, enable **Email/Password**, **Google**, and/or **Phone** as needed.
3. In your project settings, copy the web app's API key, Auth domain, project ID, and app ID.
4. Copy `.env.example` to `.env.local` in the project root and fill in those values:

   ```dotenv
   VITE_FIREBASE_API_KEY=your-web-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_APP_ID=your-web-app-id
   ```

5. Add the local development host (for example, `localhost`) to Firebase Authentication's authorized domains. For phone authentication, configure Firebase's reCAPTCHA and billing/region requirements as applicable. For Google, set up the provider and consent screen in Firebase.
6. Restart `npm run dev`. The page uses Firebase for email/password sign-in, account creation, password reset, Google popup sign-in, and phone OTP verification. Firebase does not provide username/password lookup in this flow; to enable usernames, add a trusted server endpoint that maps a username to an account without exposing user enumeration, then connect it to your identity provider. Without complete Firebase configuration, real authentication reports that it is not connected; it never treats a mock response as a real login.

Firebase web configuration is intended to identify a Firebase app, not to hold server secrets. Do not place service-account credentials, private keys, or other privileged secrets in Vite environment variables: `VITE_` variables are included in browser code. Protect the application with Firebase Authentication settings, authorized domains, and appropriate Firebase Security Rules.

## Project structure

```text
.
├── .env.example
├── index.html
├── package.json
├── README.md
├── vite.config.js
└── src/
    ├── App.jsx
    ├── main.jsx
    └── styles.css
```
