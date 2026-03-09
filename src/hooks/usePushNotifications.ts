import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export type NotificationDestination =
  | { tab: 'events' }
  | { tab: 'map' }
  | { tab: 'groups'; circleId?: string }
  | { tab: 'profile' }

function resolveDestination(data: Record<string, string>): NotificationDestination | null {
  const { type, circle_id } = data

  switch (type) {
    case 'booking_confirmed':
      return { tab: 'map' }

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
      return { tab: 'map' }

    default:
      return null
  }
}

export function usePushNotifications(onNavigate?: (dest: NotificationDestination) => void) {
  const { user } = useAuth()

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return

    async function init() {
      const { receive } = await PushNotifications.requestPermissions()
      if (receive !== 'granted') return
      await PushNotifications.register()
    }

    const registration = PushNotifications.addListener('registration', async (token) => {
      await supabase
        .from('device_tokens')
        .upsert(
          { user_id: user.id, token: token.value, platform: Capacitor.getPlatform() },
          { onConflict: 'user_id,token' }
        )
    })

    const registrationError = PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err)
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
        if (dest && onNavigate) onNavigate(dest)
      }
    )

    init()

    return () => {
      registration.then((l) => l.remove())
      registrationError.then((l) => l.remove())
      notificationReceived.then((l) => l.remove())
      notificationAction.then((l) => l.remove())
    }
  }, [user, onNavigate])
}
