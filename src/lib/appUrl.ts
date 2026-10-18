import { Capacitor } from '@capacitor/core'

export const nativeAuthCallback = 'packquest://auth-callback'
const authReturnPathKey = 'packquest.auth.return-path'

export function getAppPath(path: `/${string}`): string {
  return `${import.meta.env.BASE_URL}${path.slice(1)}`
}

export function getAppUrl(path: `/${string}`): string {
  return new URL(getAppPath(path), window.location.origin).toString()
}

export function getAuthRedirectUrl(path: `/${string}`): string {
  if (!Capacitor.isNativePlatform()) return getAppUrl(path)

  window.localStorage.setItem(authReturnPathKey, path)
  return nativeAuthCallback
}

export function getAuthReturnPath(): string {
  const next = window.localStorage.getItem(authReturnPathKey)
  window.localStorage.removeItem(authReturnPathKey)
  return next === '/parent/templates' ? next : '/parent/account'
}
