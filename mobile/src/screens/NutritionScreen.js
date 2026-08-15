import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { supabase } from '../services/supabase';

const DEMO_MEALS = [
  {
    id: 1,
    tiempo: '🌅 Desayuno Energético',
    hora: '07:30 AM',
    alimento: '100g Avena en hojuelas + 4 Huevos enteros revueltos + 1 Plátano + 20g Mantequilla de maní',
    macros: '610 kcal • 42g P / 78g C / 18g G',
    completado: true,
  },
  {
    id: 2,
    tiempo: '🥪 Almuerzo / Media Mañana',
    hora: '10:30 AM',
    alimento: '1 Bagel o 2 rebanadas pan integral + 120g Pechuga de pavo braseada + 1/2 Aguacate',
    macros: '440 kcal • 33g P / 45g C / 14g G',
    completado: true,
  },
  {
    id: 3,
    tiempo: '🍲 Comida Principal Anabólica',
    hora: '02:00 PM',
    alimento: '200g Pechuga de pollo / Ternera magra + 250g Arroz jazmín + Ensalada con AOVE',
    macros: '730 kcal • 55g P / 82g C / 16g G',
    completado: false,
  },
  {
    id: 4,
    tiempo: '🍌 Merienda Pre-Entreno',
    hora: '05:30 PM',
    alimento: '1 Scoop Whey Protein Isolate + 40g Harina de avena / Tortas de arroz con miel',
    macros: '370 kcal • 30g P / 50g C / 5g G',
    completado: false,
  },
  {
    id: 5,
    tiempo: '🌙 Cena de Recuperación',
    hora: '08:30 PM',
    alimento: '200g Salmón fresco / Merluza + 200g Boniato al horno + Espárragos verdes',
    macros: '510 kcal • 40g P / 42g C / 17g G',
    completado: false,
  },
];

export default function NutritionScreen({ user }) {
  const [comidas, setComidas] = useState(DEMO_MEALS);
  const [tdee, setTdee] = useState(2660);
  const [proteina, setProteina] = useState(200);
  const [carbo, setCarbo] = useState(297);
  const [grasa, setGrasa] = useState(70);
  const [vasosAgua, setVasosAgua] = useState(6);
  const metaAgua = 10;

  useEffect(() => {
    const cargarDietaAtleta = async () => {
      try {
        const email = user?.email;
        let nombre = user?.user_metadata?.full_name || '';

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

        if (nombre) {
          const { data: diets } = await supabase
            .from('dietas')
            .select('*')
            .eq('cliente', nombre)
            .order('id', { ascending: false })
            .limit(1);

          if (diets && diets.length > 0) {
            const d = diets[0];
            if (d.tdee) setTdee(d.tdee);
            if (d.proteina) setProteina(d.proteina);
            if (d.carbo) setCarbo(d.carbo);
            if (d.grasa) setGrasa(d.grasa);

            const meals = Array.isArray(d.comidas)
              ? d.comidas
              : (typeof d.comidas === 'string' ? JSON.parse(d.comidas || '[]') : []);

            if (meals.length > 0) {
              const adaptadas = meals.map((m, i) => ({
                id: i + 1,
                tiempo: m.tiempo || `Comida ${i + 1}`,
                hora: m.hora || (i === 0 ? '08:00 AM' : i === 1 ? '11:00 AM' : i === 2 ? '02:30 PM' : i === 3 ? '05:30 PM' : '08:30 PM'),
                alimento: m.alimento || 'Porción según pauta prescrita por el coach',
                macros: m.macros || `${Math.round(d.tdee / 5)} kcal`,
                completado: false
              }));
              setComidas(adaptadas);
            }
          }
        }
      } catch (err) {
        console.warn("Notice cargando dieta en NutritionScreen:", err);
      }
    };

    cargarDietaAtleta();
  }, [user]);

  const toggleMeal = (id) => {
    setComidas(prev => prev.map(m => m.id === id ? { ...m, completado: !m.completado } : m));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pauta Nutricional</Text>
          <Text style={styles.headerSubtitle}>Prescripción personalizada de macronutrientes</Text>
        </View>

        {/* CALORIC & MACROS BANNER */}
        <View style={styles.macroCard}>
          <Text style={styles.macroGoalTitle}>Meta Diaria: {tdee} kcal</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroPill}>
              <Text style={styles.macroPillLabel}>Proteína</Text>
              <Text style={[styles.macroPillValue, { color: '#4ade80' }]}>{proteina}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroPillLabel}>Carbohidratos</Text>
              <Text style={[styles.macroPillValue, { color: '#60a5fa' }]}>{carbo}g</Text>
            </View>
            <View style={styles.macroPill}>
              <Text style={styles.macroPillLabel}>Grasas</Text>
              <Text style={[styles.macroPillValue, { color: '#fbbf24' }]}>{grasa}g</Text>
            </View>
          </View>
        </View>

        {/* WATER TRACKER */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>💧 Registro Hídrico: {vasosAgua * 250} ml / {metaAgua * 250} ml</Text>
            <View style={styles.waterControls}>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => setVasosAgua(Math.max(0, vasosAgua - 1))}
              >
                <Text style={styles.waterBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.waterBtn}
                onPress={() => setVasosAgua(vasosAgua + 1)}
              >
                <Text style={styles.waterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.waterBarBg}>
            <View style={[styles.waterBarFill, { width: `${Math.min(100, (vasosAgua / metaAgua) * 100)}%` }]} />
          </View>
        </View>

        {/* MEALS LIST */}
        <Text style={styles.sectionTitle}>Distribución de Comidas</Text>
        {comidas.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.mealCard, m.completado && styles.mealCardDone]}
            onPress={() => toggleMeal(m.id)}
          >
            <View style={styles.mealHeader}>
              <View>
                <Text style={styles.mealTitle}>{m.tiempo}</Text>
                <Text style={styles.mealHora}>⏰ {m.hora}</Text>
              </View>
              <View style={[styles.checkCircle, m.completado && styles.checkCircleActive]}>
                <Text style={styles.checkCircleText}>{m.completado ? '✓' : ''}</Text>
              </View>
            </View>
            <Text style={styles.mealAlimento}>{m.alimento}</Text>
            <View style={styles.mealBadge}>
              <Text style={styles.mealBadgeText}>{m.macros}</Text>
            </View>
          </TouchableOpacity>
        ))}

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
  header: {
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
  macroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  macroGoalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  macroPillLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  macroPillValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  waterCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  waterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38bdf8',
  },
  waterControls: {
    flexDirection: 'row',
    gap: 8,
  },
  waterBtn: {
    backgroundColor: '#1e293b',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  waterBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  waterBarBg: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  waterBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  mealCardDone: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.04)',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  mealHora: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkCircleText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  mealAlimento: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 10,
  },
  mealBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mealBadgeText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
  },
});
