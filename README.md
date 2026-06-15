# Invoicer

A minimalist, mobile-first web app for invoicing a real estate photography
business. Build invoices from your own services, packages and add-ons; set
custom prices per client; and let travel fees calculate themselves from the
driving distance to each listing. **Every invoice is stored in the cloud** with
a live save indicator — nothing important lives only on your device.

## Features

- **Catalog** — create services, packages and add-ons, each with its own price.
- **Clients** — store contact details, set **custom prices** per client, and
  override the travel **radius** and **per-km rate**.
- **Automatic travel fees** — type a listing address and the app measures the
  driving distance from your home base (Google Maps). Anything past your free
  radius (default **25 km**) is billed at your per-km rate, with optional
  round-trip and per-client overrides.
- **Cloud storage** — invoices save to Firebase Firestore automatically. A
  **Saved / Saving… / Not saved** indicator shows the real cloud status.
- **Share** — preview a clean invoice and share it or save it as a PDF.
- Installable to your phone’s home screen (PWA).
- No square-footage billing, by design.

## Tech

React + Vite · Firebase Auth + Firestore · Google Maps JavaScript API.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Firebase project (cloud storage)

1. Go to <https://console.firebase.google.com> and create a project (free).
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** (start in production mode).
4. **Project settings → General → Your apps → Web app (`</>`)**, register the
   app, and copy the config values.

### 3. Add a Google Maps API key (travel distance)

1. In the [Google Cloud console](https://console.cloud.google.com), enable:
   **Maps JavaScript API**, **Distance Matrix API**, and **Places API**.
2. Create an API key (restrict it to your domain when you deploy).

### 4. Configure environment

```bash
cp .env.example .env
```

Fill in every `VITE_FIREBASE_*` value and `VITE_GOOGLE_MAPS_API_KEY`.

### 5. Run

```bash
npm run dev
```

Open the app, create your account, then set your **home base address**, default
**radius** and **per-km rate** in **Settings**.

---

## Deploy (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # select your project
firebase deploy --only firestore:rules   # publish security rules
npm run deploy            # builds and deploys hosting
```

The included `firestore.rules` ensure each signed-in user can only read and
write their own data. The app is a single-page app; hosting rewrites all routes
to `index.html`.

## Data model

All data is namespaced under the signed-in user:

```
users/{uid}/catalog/{id}     services / packages / add-ons
users/{uid}/clients/{id}     contacts + custom prices + travel overrides
users/{uid}/invoices/{id}    invoices (autosaved)
users/{uid}/meta/settings    business info, defaults, invoice counter
```
