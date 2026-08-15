import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { supabase } from '../services/supabase';

export default function HomeScreen({ user, navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [athleteData, setAthleteData] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [activeDiet, setActiveDiet] = useState(null);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const email = user?.email;
      if (email) {
        // Consultar expediente del cliente en Supabase
        const { data: clients } = await supabase
          .from('clients')
          .select('*')
          .ilike('email', email)
          .limit(1);

        if (clients && clients.length > 0) {
          const cli = clients[0];
          setAthleteData(cli);

          // Consultar planes del atleta
          const { data: plans } = await supabase
            .from('planes')
            .select('*')
            .eq('cliente', cli.nombre)
            .order('id', { ascending: false })
            .limit(1);

          if (plans && plans.length > 0) {
            setActivePlan(plans[0]);
          }

          // Consultar dietas
          const { data: diets } = await supabase
            .from('dietas')
            .select('*')
            .eq('cliente', cli.nombre)
            .order('id', { ascending: false })
            .limit(1);

          if (diets && diets.length > 0) {
            setActiveDiet(diets[0]);
          }
        }
      }
    } catch (e) {
      console.warn("Error cargando datos del atleta:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const nombre = athleteData?.nombre || user?.user_metadata?.full_name || 'Atleta Pro';
  const objetivo = athleteData?.objetivo || user?.user_metadata?.objetivo || 'Hipertrofia Muscular';
  const gymName = athleteData?.gym_id || user?.user_metadata?.gym_name || 'FitPro Central Hub';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#22c55e" />}
      >
        {/* TOP HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>¡Hola de nuevo! 👋</Text>
            <Text style={styles.nameText}>{nombre}</Text>
          </View>
          <View style={styles.gymBadge}>
            <Text style={styles.gymBadgeText}>🏢 {gymName}</Text>
          </View>
        </View>

        {/* WORKOUT HIGHLIGHT CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTag}>🔥 RUTINA DE HOY</Text>
            <Text style={styles.heroMeta}>Mesociclo 2 • Semana 3</Text>
          </View>
          <Text style={styles.heroTitle}>{activePlan?.metodo || 'Sobrecarga Progresiva Adaptada'}</Text>
          <Text style={styles.heroDesc}>Objetivo: {objetivo}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Bloques</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>55</Text>
              <Text style={styles.statLabel}>Minutos</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>RPE 8.5</Text>
              <Text style={styles.statLabel}>Intensidad</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => navigation.navigate('Workout')}
          >
            <Text style={styles.heroButtonText}>⚡ Iniciar Entrenamiento</Text>
          </TouchableOpacity>
        </View>

        {/* DAILY SUMMARY GRID */}
        <Text style={styles.sectionTitle}>Resumen Diario</Text>
        <View style={styles.summaryGrid}>
          {/* CALORIAS */}
          <TouchableOpacity
            style={styles.summaryCard}
            onPress={() => navigation.navigate('Nutrition')}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🥗</Text>
              <Text style={styles.cardBadgeGreen}>Activa</Text>
            </View>
            <Text style={styles.cardValue}>{activeDiet?.tdee || 2450} kcal</Text>
            <Text style={styles.cardLabel}>Meta Calórica Diaria</Text>
          </TouchableOpacity>

          {/* ADHERENCIA */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📈</Text>
              <Text style={styles.cardBadgeBlue}>95%</Text>
            </View>
            <Text style={styles.cardValue}>19 / 20</Text>
            <Text style={styles.cardLabel}>Sesiones Completadas</Text>
          </View>
        </View>

        {/* COACH CARD */}
        <View style={styles.coachCard}>
          <View style={styles.coachAvatar}>
            <Text style={styles.coachAvatarText}>CP</Text>
          </View>
          <View style={styles.coachInfo}>
            <Text style={styles.coachTitle}>Tu Entrenador Asignado</Text>
            <Text style={styles.coachName}>{athleteData?.entrenador || 'Coach Master Pro'}</Text>
            <Text style={styles.coachSub}>Prescripción activa sincronizada con Supabase Cloud</Text>
          </View>
        </View>

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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  gymBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gymBadgeText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTag: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroMeta: {
    color: '#64748b',
    fontSize: 11,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#38bdf8',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  heroButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  heroButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardBadgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBadgeBlue: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  coachAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  coachInfo: {
    flex: 1,
  },
  coachTitle: {
    fontSize: 11,
    color: '#64748b',
  },
  coachName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },
  coachSub: {
    fontSize: 11,
    color: '#22c55e',
    marginTop: 2,
  },
});
