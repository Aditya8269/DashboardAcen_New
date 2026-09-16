import { useState } from 'react'
import { startLogin } from '../authConfig'

const Login = () => {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState('')

  const handleMicrosoftLogin = () => {
    setError('')
    setIsSigningIn(true)

    try {
      startLogin()
    } catch (signInError) {
      setError(signInError.message || 'Unable to sign in. Please try again.')
      setIsSigningIn(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-mark">D</div>
        <p className="eyebrow">ETMS Drive</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-copy">Sign in with your organization account to open the dashboard.</p>

        <button className="microsoft-button" type="button" onClick={handleMicrosoftLogin} disabled={isSigningIn}>
          <span className="microsoft-icon" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          {isSigningIn ? 'Signing you in...' : 'Continue with Microsoft'}
        </button>

        {error && <p className="login-error" role="alert">{error}</p>}
        <p className="login-note">Access is limited to users registered in the dashboard database.</p>
      </section>
      <aside className="login-aside">
        <span className="aside-label">Workspace / 01</span>
        <h2>Your data, in one clear view.</h2>
        <p>Secure reporting for the teams that keep ETMS moving.</p>
      </aside>
    </main>
  );
};

export default Login;