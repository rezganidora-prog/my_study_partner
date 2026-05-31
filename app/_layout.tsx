import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { ThemeProvider } from '../context/ThemeContext'
import { PomodoroProvider } from '../context/PomodoroContext'
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false)
  const router = useRouter()
  const segments = useSegments()
  useEffect(() => {
    // 1. Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    // 2. Écouter les changements d'auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (loading) return
    // On vérifie si on est dans le groupe d'authentification ou sur le splash
    const inAuthGroup = segments[0] === '(auth)'
    const inSplash = segments[0] === 'splash-ayat'
    if (!session) {
      // CAS 1 : Pas de session
      // On redirige vers le login si on n'est pas déjà dans le groupe auth
      if (!inAuthGroup) {
        router.replace('/(auth)/login')
      }
    } else {
      // CAS 2 : On a une session
      if (inAuthGroup) {
        // Si on est dans le groupe auth (ex: LoginScreen) :
        if (!isInitialCheckDone) {
          // A. AU DÉMARRAGE : Redirection directe vers dashboard si session existante
          // On saute le splash car l'utilisateur ne vient pas de se loguer manuellement
          router.replace('/(tabs)')
        }
        // B. APRÈS LOGIN MANUEL : On ne fait RIEN ici.
        // C'est login.tsx qui gère router.replace('/splash-ayat')
        // En ne faisant rien, on évite que _layout court-circuite vers /(tabs)
      }
    }
    // On marque que le premier check (au chargement) a été effectué
    if (!isInitialCheckDone) {
      setIsInitialCheckDone(true)
    }
  }, [session, loading, segments, isInitialCheckDone])
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF6E3' }}>
        <ActivityIndicator size="large" color="#8BAF76" />
      </View>
    )
  }
  return (
    <ThemeProvider>
      <PomodoroProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="splash-ayat" options={{ headerShown: false, animation: 'fade' }} />
        </Stack>
      </PomodoroProvider>
    </ThemeProvider>
  )
}