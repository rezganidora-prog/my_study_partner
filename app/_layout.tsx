import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Colors } from '@/constants/GhibliTheme'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === ('(auth)' as any)
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as any)
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)' as any)
    }
  }, [session, loading, segments])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.beige }}>
        <ActivityIndicator size="large" color={Colors.green} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor={Colors.beige} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
