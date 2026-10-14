// Resolves a file in /public against the configured base path (VITE_BASE_PATH).
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

export const padNumber = (value, length = 2) => String(value).padStart(length, '0')
