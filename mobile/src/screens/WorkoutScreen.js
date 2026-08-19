import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../services/supabase';

const DEMO_EXERCISES = [
  {
    id: 1,
    bloque: 'Activación Neural',
    nombre: 'Face-Pull en Polea con Rotación Externa',
    series: '3 series x 15 reps',
    cadencia: '2-0-1-1',
    descanso: 45,
    nota: 'Retracción escapular sostenida 1 segundo en máxima contracción.',
    completado: false,
  },
  {
    id: 2,
    bloque: 'Fuerza Base',
    nombre: 'Press de Banca Plano con Barra Guiada',
    series: '4 series x 6 reps (RPE 8.5)',
    cadencia: '3-1-X-0',
    descanso: 120,
    nota: 'Pausa isométrica de 1 segundo en el punto cero antes del empuje explosivo.',
    completado: false,
  },
  {
    id: 3,
    bloque: 'Asistencia Vectorial',
    nombre: 'Aperturas Inclinadas con Mancuernas (30°)',
    series: '3 series x 12 reps',
    cadencia: '3-0-1-0',
    descanso: 60,
    nota: 'Énfasis en la fase excéntrica y elongación del pectoral mayor.',
    completado: false,
  },
  {
    id: 4,
    bloque: 'Isometría & Estabilidad',
    nombre: 'Plancha Prona con Activación de Serrato Anterior',
    series: '3 series x 45 segs',
    cadencia: 'Isométrico',
    descanso: 45,
    nota: 'Mantener pelvis neutra y presión continua contra el suelo.',
    completado: false,
  },
];

export default function WorkoutScreen({ user }) {
  const [ejercicios, setEjercicios] = useState(DEMO_EXERCISES);
  const [planTitulo, setPlanTitulo] = useState('Sobrecarga Progresiva Adaptada');
  const [planObjetivo, setPlanObjetivo] = useState('Hipertrofia Muscular');
  const [loading, setLoading] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    const cargarRutinaAtleta = async () => {
      try {
        setLoading(true);
        const email = user?.email;
        let nombre = user?.user_metadata?.full_name || '';

        // Buscar cliente en Supabase
        if (email) {
          const { data: clients } = await supabase
            .from('clients')
            .select('*')
            .ilike('email', email)
            .limit(1);

          if (clients && clients.length > 0) {
            nombre = clients[0].nombre;
          }
        }

        // Buscar rutina del cliente
        if (nombre) {
          const { data: plans } = await supabase
            .from('planes')
            .select('*')
            .eq('cliente', nombre)
            .order('id', { ascending: false })
            .limit(1);

          if (plans && plans.length > 0) {
            const p = plans[0];
            setPlanTitulo(p.metodo || 'Rutina Biomecánica Personalizada');
            setPlanObjetivo(p.objetivo || 'Hipertrofia');

            const lista = Array.isArray(p.ejercicios)
              ? p.ejercicios
              : (typeof p.ejercicios === 'string' ? p.ejercicios.split(' | ') : []);

            if (lista.length > 0) {
              const adaptados = lista.map((item, idx) => ({
                id: idx + 1,
                bloque: `Bloque ${idx + 1}`,
                nombre: item,
                series: '4 series x 10-12 reps',
                cadencia: '3-0-1-0',
                descanso: 60,
                nota: 'Control excéntrico estricto y contracción máxima sostenida.',
                completado: false,
              }));
              setEjercicios(adaptados);
            }
          }
        }
      } catch (err) {
        console.warn("Notice cargando rutina en WorkoutScreen:", err);
      } finally {
        setLoading(false);
      }
    };

    cargarRutinaAtleta();
  }, [user]);
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      Alert.alert('⏱️ ¡Tiempo de Descanso Terminado!', 'Prepárate para la siguiente serie.');
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const toggleCompletado = (id) => {
    setEjercicios(prev => prev.map(e => e.id === id ? { ...e, completado: !e.completado } : e));
  };

  const iniciarDescanso = (segundos) => {
    setTimerSeconds(segundos);
    setTimerActive(true);
  };

  const totalCompletados = ejercicios.filter(e => e.completado).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER & PROGRESS */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{planTitulo}</Text>
            <Text style={styles.headerSubtitle}>Objetivo: {planObjetivo}</Text>
          </View>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>{totalCompletados}/{ejercicios.length}</Text>
          </View>
        </View>

        {/* REST TIMER BAR */}
        {timerActive ? (
          <View style={styles.timerBar}>
            <Text style={styles.timerText}>⏱️ Descanso: {timerSeconds}s</Text>
            <TouchableOpacity style={styles.timerStopBtn} onPress={() => setTimerActive(false)}>
              <Text style={styles.timerStopText}>Detener</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* EXERCISES LIST */}
        <ScrollView style={styles.scroll}>
          {ejercicios.map((ej, index) => (
            <View
              key={ej.id}
              style={[
                styles.exerciseCard,
                ej.completado && styles.exerciseCardCompleted
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.badgeBloque}>
                  <Text style={styles.badgeBloqueText}>#{index + 1} {ej.bloque}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.checkBtn, ej.completado && styles.checkBtnActive]}
                  onPress={() => toggleCompletado(ej.id)}
                >
                  <Text style={styles.checkBtnText}>{ej.completado ? '✓ Listo' : 'Marcar'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.exerciseName}>{ej.nombre}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>📊 {ej.series}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>⏱️ Tempo: {ej.cadencia}</Text>
                </View>
              </View>

              <Text style={styles.noteText}>💡 {ej.nota}</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.restButton}
                  onPress={() => iniciarDescanso(ej.descanso)}
                >
                  <Text style={styles.restButtonText}>⏱️ Descanso ({ej.descanso}s)</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  progressCircle: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  progressText: {
    color: '#22c55e',
    fontWeight: '800',
    fontSize: 13,
  },
  timerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  timerText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  timerStopBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerStopText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  exerciseCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  exerciseCardCompleted: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeBloque: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeBloqueText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  checkBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkBtnActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkBtnText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metaBadge: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaBadgeText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  noteText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 12,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  restButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  restButtonText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
});
