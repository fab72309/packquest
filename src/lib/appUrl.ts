export function getAppPath(path: `/${string}`): string {
  return `${import.meta.env.BASE_URL}${path.slice(1)}`
}

export function getAppUrl(path: `/${string}`): string {
  return new URL(getAppPath(path), window.location.origin).toString()
}
