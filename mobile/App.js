import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { supabase } from './src/services/supabase';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#090d16',
    card: '#0f172a',
    text: '#ffffff',
    border: '#1e293b',
    primary: '#22c55e',
  },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkMustChangePassword = async (currentUser) => {
    if (!currentUser) return;

    if (currentUser.user_metadata?.must_change_password === true) {
      setMustChangePassword(true);
      return;
    }

    if (currentUser.email) {
      try {
        const { data: clients } = await supabase
          .from('clients')
          .select('must_change_password')
          .ilike('email', currentUser.email)
          .limit(1);

        if (clients && clients.length > 0 && clients[0].must_change_password === true) {
          setMustChangePassword(true);
          return;
        }
      } catch (err) {
        console.warn("Notice verificando must_change_password:", err);
      }
    }

    setMustChangePassword(false);
  };

  useEffect(() => {
    // 1. Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        checkMustChangePassword(currentUser);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // 2. Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        checkMustChangePassword(currentUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (newSession, newUser) => {
    setSession(newSession);
    setUser(newUser);
    if (newUser) {
      checkMustChangePassword(newUser);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setUser(null);
    setMustChangePassword(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Cargando FitPro Atleta...</Text>
      </View>
    );
  }

  if (!session && !user) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  if (mustChangePassword) {
    return (
      <>
        <StatusBar style="light" />
        <ChangePasswordScreen
          user={user}
          onPasswordChanged={() => {
            setMustChangePassword(false);
            if (user) {
              setUser({
                ...user,
                user_metadata: {
                  ...user.user_metadata,
                  must_change_password: false,
                },
              });
            }
          }}
        />
      </>
    );
  }

  return (
    <NavigationContainer theme={customDarkTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0f172a',
            borderTopColor: '#1e293b',
            borderTopWidth: 1,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20 }}>🏠</Text>
            ),
          }}
        >
          {props => <HomeScreen {...props} user={user} />}
        </Tab.Screen>

        <Tab.Screen
          name="Workout"
          options={{
            tabBarLabel: 'Rutina',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20 }}>🏋️</Text>
            ),
          }}
        >
          {props => <WorkoutScreen {...props} user={user} />}
        </Tab.Screen>

        <Tab.Screen
          name="Nutrition"
          options={{
            tabBarLabel: 'Nutrición',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20 }}>🥗</Text>
            ),
          }}
        >
          {props => <NutritionScreen {...props} user={user} />}
        </Tab.Screen>

        <Tab.Screen
          name="Profile"
          options={{
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: 20 }}>👤</Text>
            ),
          }}
        >
          {props => <ProfileScreen {...props} user={user} onLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 14,
    fontSize: 13,
  },
});
