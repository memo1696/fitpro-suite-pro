import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { supabase } from '../services/supabase';

export default function ChangePasswordScreen({ user, onPasswordChanged }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const athleteName = user?.user_metadata?.full_name || 'Atleta Pro';

  const handleUpdatePassword = async () => {
    setErrorMessage('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e intenta de nuevo.');
      return;
    }

    try {
      setLoading(true);

      // 1. Actualizar contraseña y metadata en Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          must_change_password: false,
        },
      });

      if (error) {
        throw error;
      }

      // 2. Actualizar bandera en la tabla clients
      if (user?.email) {
        try {
          await supabase
            .from('clients')
            .update({
              must_change_password: false,
              password_provisional: null,
              updated_at: new Date().toISOString()
            })
            .ilike('email', user.email);
        } catch (dbErr) {
          console.warn("Notice actualizando tabla clients:", dbErr);
        }
      }

      Alert.alert(
        '🎉 ¡Contraseña Actualizada!',
        'Tu contraseña ha sido establecida exitosamente. Bienvenido a tu panel de atleta.',
        [
          {
            text: 'Comenzar Entrenamiento',
            onPress: () => {
              if (onPasswordChanged) onPasswordChanged();
            },
          },
        ]
      );
    } catch (err) {
      console.error("Error al cambiar contraseña:", err);
      setErrorMessage(err.message || 'Error al actualizar la contraseña. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔐</Text>
            </View>
            <Text style={styles.title}>Actualización Obligatoria</Text>
            <Text style={styles.subtitle}>
              ¡Hola <Text style={styles.highlight}>{athleteName}</Text>! Por seguridad, ingresa una nueva contraseña personal para activar tu cuenta y acceder a tus planes biomecánicos.
            </Text>
          </View>

          {/* CARD FORM */}
          <View style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            {/* INPUT NUEVA CONTRASEÑA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nueva Contraseña Personal</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* INPUT CONFIRMAR CONTRASEÑA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
              <TextInput
                style={styles.inputFull}
                placeholder="Repite tu nueva contraseña"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
            </View>

            {/* VALIDATION CHECKLIST */}
            <View style={styles.checklist}>
              <View style={styles.checkItem}>
                <Text style={[styles.checkIcon, { color: hasMinLength ? '#22c55e' : '#64748b' }]}>
                  {hasMinLength ? '✓' : '○'}
                </Text>
                <Text style={[styles.checkLabel, { color: hasMinLength ? '#e2e8f0' : '#64748b' }]}>
                  Mínimo 6 caracteres
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Text style={[styles.checkIcon, { color: passwordsMatch ? '#22c55e' : '#64748b' }]}>
                  {passwordsMatch ? '✓' : '○'}
                </Text>
                <Text style={[styles.checkLabel, { color: passwordsMatch ? '#e2e8f0' : '#64748b' }]}>
                  Las contraseñas coinciden
                </Text>
              </View>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!hasMinLength || !passwordsMatch || loading) && styles.submitBtnDisabled,
              ]}
              onPress={handleUpdatePassword}
              disabled={!hasMinLength || !passwordsMatch || loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>🔒 Guardar y Acceder a Mi Plan</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* FOOTER ADVICE */}
          <View style={styles.footerAdvice}>
            <Text style={styles.footerText}>
              🛡️ Tu información biomecánica y médica está encriptada y protegida bajo el protocolo de seguridad de FitPro Suite Pro.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  highlight: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
  },
  inputFull: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeText: {
    fontSize: 16,
  },
  checklist: {
    marginBottom: 20,
    gap: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 20,
  },
  checkLabel: {
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  footerAdvice: {
    marginTop: 24,
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
