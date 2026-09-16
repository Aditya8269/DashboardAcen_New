import AuthenticationContext from 'adal-angular'

const tenantId = import.meta.env.VITE_TENANT_ID || 'f3211d0e-125b-42c3-86db-322b19a65a22'
const clientId = import.meta.env.VITE_CLIENT_ID || 'b55a7b4d-6fad-4f22-bb96-1f4ad1987818'
const productionRedirectUri = 'https://www.etmsdrive.in/dashbuild/'
const vercelRedirectUri = 'https://dashboard-acen-new.vercel.app'
const redirectUri = import.meta.env.VITE_REDIRECT_URI
  || (window.location.hostname === 'www.etmsdrive.in'
    ? productionRedirectUri
    : window.location.hostname === 'dashboard-acen-new.vercel.app'
      ? vercelRedirectUri
      : window.location.origin)
const apiUrl = import.meta.env.VITE_AUTH_API_URL || '/api/auth/authorize'

export const adalConfig = {
  clientId,
  tenant: tenantId,
  instance: 'https://login.microsoftonline.com/',
  redirectUri,
  postLogoutRedirectUri: redirectUri,
  cacheLocation: 'sessionStorage',
  popUp: true,
  navigateToLoginRequestUrl: false,
  callback: (error, user, errorDescription) => {
    window.dispatchEvent(new CustomEvent('adal-login-complete', {
      detail: { error, user, errorDescription },
    }))
  },
}

export const authContext = new AuthenticationContext(adalConfig)

export async function initializeAuth() {
  if (window.location.hash) {
    authContext.handleWindowCallback()
  }

  if (authContext.getLoginError()) {
    clearAuthCache()
    throw new Error(authContext.getLoginError())
  }

  return authContext.getCachedUser()
}

export function startLogin() {
  authContext.login()
}

export async function authorizeCurrentUser() {
  const user = await initializeAuth()
  if (!user) return null

  const idToken = authContext.getCachedToken(clientId)
  if (!idToken) {
    throw new Error('Microsoft sign-in completed, but no identity token was found.')
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ idToken }),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload.authorized) {
    authContext.logOut()
    throw new Error(payload.message || 'This Microsoft account is not registered for the dashboard.')
  }

  return { account: user, user: payload.user || user.profile }
}

export function getCurrentUser() {
  return authContext.getCachedUser()
}

export function signOut() {
  clearAuthCache()
  authContext.logOut()
}

export function clearAuthCache() {
  authContext.clearCache()
}
