// Shown when Firebase keys are missing, so the app never silently fails.
export default function SetupNeeded() {
  return (
    <div className="app">
      <div className="content" style={{ paddingTop: 40 }}>
        <div className="auth">
          <div className="brand">
            <img className="logo" src="/icon.svg" alt="" />
            <h1>Almost there</h1>
            <p>Connect your cloud to start invoicing.</p>
          </div>
          <div className="notice warn">
            This app stores every invoice in the cloud, so it needs your Firebase
            keys before it can run.
          </div>
          <div className="card">
            <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              <li>
                Create a free project at <b>console.firebase.google.com</b>.
              </li>
              <li>
                Add a <b>Web app</b> and enable <b>Authentication → Email/Password</b>{' '}
                and <b>Cloud Firestore</b>.
              </li>
              <li>
                Copy <code>.env.example</code> to <code>.env</code> and paste in your
                config values.
              </li>
              <li>
                Add a <b>Google Maps API key</b> for automatic travel distance.
              </li>
              <li>
                Restart the app (<code>npm run dev</code>).
              </li>
            </ol>
          </div>
          <p className="hint" style={{ textAlign: 'center' }}>
            Full instructions are in <b>README.md</b>.
          </p>
        </div>
      </div>
    </div>
  )
}
