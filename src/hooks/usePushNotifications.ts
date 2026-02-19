import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function usePushNotifications() {
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
          { user_id: user.id, token: token.value, platform: 'ios' },
          { onConflict: 'user_id,token' }
        )
    })

    const registrationError = PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err)
    })

    const notificationReceived = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        // Notification arrived while app is in foreground
        console.log('Notification received in foreground:', notification)
      }
    )

    const notificationAction = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        // User tapped a notification
        console.log('Notification tapped:', action.notification)
      }
    )

    init()

    return () => {
      registration.then((l) => l.remove())
      registrationError.then((l) => l.remove())
      notificationReceived.then((l) => l.remove())
      notificationAction.then((l) => l.remove())
    }
  }, [user])
}
