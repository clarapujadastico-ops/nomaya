import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export type NotificationDestination =
  | { tab: 'events'; eventId?: string }
  | { tab: 'groups'; circleId?: string }
  | { tab: 'profile' }

function resolveDestination(data: Record<string, string>): NotificationDestination | null {
  const { type, circle_id, event_id } = data

  switch (type) {
    case 'booking_confirmed':
      return { tab: 'events' }

    case 'circle_join_approved':
    case 'circle_join_rejected':
    case 'circle_join':
    case 'circle_join_request':
    case 'circle_message':
    case 'circle_reminder':
    case 'circle_plan_suggestion':
    case 'circle_event_approved':
    case 'circle_event_rejected':
      return circle_id ? { tab: 'groups', circleId: circle_id } : { tab: 'groups' }

    case 'event_message':
      return { tab: 'events' }

    case 'new_event':
    case 'event_reminder':
    case 'tbc_event_available':
      return { tab: 'events', eventId: event_id }

    case 'new_poll':
      return { tab: 'events' }

    default:
      return null
  }
}

export function usePushNotifications(onNavigate?: (dest: NotificationDestination) => void) {
  const { user } = useAuth()
  // Read through a ref rather than depending on `onNavigate` directly — the
  // caller passes a new function identity on every render (it's not
  // useCallback-wrapped), which was tearing down and re-registering these
  // listeners on essentially every app re-render. That race routinely meant
  // the 'registration' listener was gone by the time Apple's async response
  // came back, so device_tokens was never actually written — no push ever
  // reached anyone, referral notifications included.
  const onNavigateRef = useRef(onNavigate)
  onNavigateRef.current = onNavigate

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return

    // Visible from the Supabase side (push_debug_log table) since there's no
    // way to plug a debugger into a TestFlight/App Store-signed build to
    // read its console output.
    function logDebug(event: string, detail?: unknown) {
      supabase.from('push_debug_log').insert({
        user_id: user.id,
        event,
        detail: detail != null ? JSON.stringify(detail) : null,
      }).then(({ error }) => {
        if (error) console.error('push_debug_log insert failed:', error)
      })
    }

    async function init() {
      logDebug('init_start')
      try {
        const perm = await PushNotifications.requestPermissions()
        logDebug('requestPermissions_result', perm)
        if (perm.receive !== 'granted') return
        await PushNotifications.register()
        logDebug('register_called')
      } catch (e) {
        logDebug('init_threw', e instanceof Error ? e.message : e)
      }
    }

    const registration = PushNotifications.addListener('registration', async (token) => {
      logDebug('registration_event', { tokenLength: token.value?.length })
      const { error } = await supabase
        .from('device_tokens')
        .upsert(
          { user_id: user.id, token: token.value, platform: Capacitor.getPlatform() },
          { onConflict: 'user_id,token' }
        )
      if (error) {
        console.error('Failed to save device token:', error)
        logDebug('device_token_save_failed', error.message)
      }
    })

    const registrationError = PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err)
      logDebug('registrationError_event', err)
    })

    const notificationReceived = PushNotifications.addListener(
      'pushNotificationReceived',
      (_notification) => {
        // Notification arrived while app is in foreground — no action needed
      }
    )

    const notificationAction = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        const data = (action.notification.data ?? {}) as Record<string, string>
        const dest = resolveDestination(data)
        if (dest && onNavigateRef.current) onNavigateRef.current(dest)
      }
    )

    init()

    return () => {
      registration.then((l) => l.remove())
      registrationError.then((l) => l.remove())
      notificationReceived.then((l) => l.remove())
      notificationAction.then((l) => l.remove())
    }
  }, [user?.id])
}
