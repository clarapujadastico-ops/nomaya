import { useEffect, useState } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const BUNDLE_ID = 'com.nomaya.app'

// Simple numeric version compare — MARKETING_VERSION is always a plain
// dot-separated string like "1.3.2", never semver prerelease tags.
function isNewerVersion(remote: string, local: string): boolean {
  const r = remote.split('.').map(Number)
  const l = local.split('.').map(Number)
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] ?? 0
    const lv = l[i] ?? 0
    if (rv > lv) return true
    if (rv < lv) return false
  }
  return false
}

/**
 * Checks the public App Store listing (no auth, no backend involved) against
 * the running app's own version on every cold start, and returns the App
 * Store URL to send people to if they're behind — or null otherwise.
 *
 * Exists because push notifications alone can't reach everyone (many
 * members never grant notification permission, or registered on an old
 * build before push registration was fixed), so this is the one nudge that
 * reaches every member who opens the app, regardless of push settings.
 */
export function useAppUpdateCheck(): string | null {
  const [updateUrl, setUpdateUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let cancelled = false

    ;(async () => {
      try {
        const info = await App.getInfo()
        const res = await fetch(`https://itunes.apple.com/lookup?bundleId=${BUNDLE_ID}`)
        const json = await res.json()
        const result = json.results?.[0]
        if (!result?.version || !result?.trackViewUrl) return
        if (!cancelled && isNewerVersion(result.version, info.version)) {
          setUpdateUrl(result.trackViewUrl)
        }
      } catch {
        // Best-effort nudge, not critical path — a failed lookup (offline,
        // Apple's API down, etc.) should never block or break the app.
      }
    })()

    return () => { cancelled = true }
  }, [])

  return updateUrl
}
