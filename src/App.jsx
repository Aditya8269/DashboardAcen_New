import './App.css'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, signOut } from './authConfig'

function App() {
  const navigate = useNavigate()
  const account = getCurrentUser()?.profile

  const handleSignOut = () => {
    navigate('/login', { replace: true })
    signOut()
  }

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="brand-lockup"><span className="brand-mark small">D</span><span>ETMS Drive</span></div>
        <button className="sign-out" type="button" onClick={handleSignOut}>Sign out</button>
      </nav>
      <section className="dashboard-content">
        <p className="eyebrow">Dashboard / Overview</p>
        <h1>Good to see you, {account?.name?.split(' ')[0] || 'there'}.</h1>
        <p className="dashboard-subtitle">Your workspace is ready. More dashboard modules can be placed here.</p>
        <div className="dashboard-grid">
          <article><span className="metric-label">Signed in as</span><strong>{account?.username || 'Verified user'}</strong></article>
          <article><span className="metric-label">Access status</span><strong className="status"><span />Authorized</strong></article>
          <article><span className="metric-label">Workspace</span><strong>ETMS Drive</strong></article>
        </div>
      </section>
    </main>
  )
}

export default App
