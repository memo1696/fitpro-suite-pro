import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { supabase } from '../services/supabase';

export default function ProfileScreen({ user, onLogout }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [athleteData, setAthleteData] = useState(null);

  useEffect(() => {
    const cargarPerfilAtleta = async () => {
      try {
        const email = user?.email;
        if (email) {
          const { data: clients } = await supabase
            .from('clients')
            .select('*')
            .ilike('email', email)
            .limit(1);

          if (clients && clients.length > 0) {
            setAthleteData(clients[0]);
          }
        }
      } catch (err) {
        console.warn("Notice cargando perfil en ProfileScreen:", err);
      }
    };

    cargarPerfilAtleta();
  }, [user]);

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de FitPro Atleta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.warn("Signout notice:", e);
            }
            if (onLogout) onLogout();
          }
        }
      ]
    );
  };

  const nombre = athleteData?.nombre || user?.user_metadata?.full_name || 'Carlos Mendoza';
  const email = athleteData?.email || user?.email || 'atleta@fitpro.com';
  const gymName = athleteData?.gym_id || user?.user_metadata?.gym_name || 'FitPro Central Hub';
  const coachName = athleteData?.entrenador || 'Coach Master Pro';
  const peso = athleteData?.peso ? `${athleteData.peso} kg` : '78.5 kg';
  const altura = athleteData?.altura ? `${athleteData.altura} cm` : '178 cm';
  const musculo = athleteData?.porcentajeMusculo ? `${athleteData.porcentajeMusculo}%` : '45.8%';
  const grasa = athleteData?.porcentajeGrasa ? `${athleteData.porcentajeGrasa}%` : '14.2%';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* PROFILE HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nombre.substring(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{nombre}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>🟢 Membresía {athleteData?.estadoMembresia ? athleteData.estadoMembresia.toUpperCase() : 'PRO ACTIVA'}</Text>
          </View>
        </View>

        {/* BIO STATS */}
        <Text style={styles.sectionTitle}>Composición Antropométrica</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{peso}</Text>
            <Text style={styles.statLbl}>Peso Corporal</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{altura}</Text>
            <Text style={styles.statLbl}>Estatura</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#4ade80' }]}>{musculo}</Text>
            <Text style={styles.statLbl}>Masa Muscular</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#fbbf24' }]}>{grasa}</Text>
            <Text style={styles.statLbl}>Grasa Corporal</Text>
          </View>
        </View>

        {/* GYM & COACH INFO */}
        <Text style={styles.sectionTitle}>Suscripción y Sede</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏢 Gimnasio Activo</Text>
            <Text style={styles.infoValue}>{gymName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👤 Head Coach</Text>
            <Text style={styles.infoValue}>{coachName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>☁️ Sincronización</Text>
            <Text style={[styles.infoValue, { color: '#22c55e' }]}>Supabase Cloud Conectado</Text>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} disabled={loggingOut}>
          <Text style={styles.logoutText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>FitPro Suite Pro Mobile • Versión 1.0.0 (APK Ready)</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  membershipBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginTop: 12,
  },
  membershipText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLbl: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 12,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },
  logoutText: {
    color: '#f87171',
    fontWeight: '700',
    fontSize: 14,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#475569',
  },
});
