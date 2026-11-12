import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { ActionButton, Notice, Screen, TextField } from "@/components/marketplace-ui";
import { colors } from "@/constants/market";
import {
  auth,
  isFirebaseConfigured,
  observeAuthState,
  registerWithEmail,
  signInWithEmail,
} from "@/lib/firebase";

import { enterDemo, getDemoUser } from "@/lib/demo";

type AuthMode = "signIn" | "register";

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "No se pudo completar el acceso. Intentalo de nuevo.";
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Ese correo ya tiene una cuenta.",
    "auth/invalid-credential": "El correo o la contrasena no son correctos.",
    "auth/invalid-email": "Escribe un correo valido.",
    "auth/weak-password": "La contrasena debe tener al menos 6 caracteres.",
    "auth/network-request-failed": "No hay conexion. Revisa tu internet e intenta otra vez.",
  };

  return messages[code] ?? error.message;
}

export default function SignInScreen() {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth) {
      void getDemoUser().then(user => { if (user) router.replace("/explore"); });
      return;
    }

    return observeAuthState(
      (user) => {
        if (user) {
          router.replace("/explore");
        }
      },
      (error) => setErrorMessage(error.message),
    );
  }, []);

  async function submit() {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Completa tu correo y contrasena.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setErrorMessage("Escribe tu nombre para crear la cuenta.");
      return;
    }
    if (!isFirebaseConfigured) {
      setLoading(true);
      try {
        await enterDemo(mode === "register" ? name : email.split("@")[0], email);
        router.replace("/explore");
      } catch (error) { setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar el perfil local."); }
      finally { setLoading(false); }
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await registerWithEmail(name, email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.replace("/explore");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandMark}>
            <Text style={styles.brandIcon}>A</Text>
          </View>
          <Text style={styles.brand}>AngelMarket</Text>
          <Text style={styles.eyebrow}>LO QUE BUSCAS, A LA VUELTA</Text>
          <Text style={styles.title}>
            Descubre los negocios{"\n"}que hacen unico tu barrio.
          </Text>
          <Text style={styles.subtitle}>
            Encuentra puestos, bazares y productos locales cerca de ti.
          </Text>

          <View style={styles.form}>
            <View style={styles.modeSwitch}>
              <Text
                onPress={() => {
                  setMode("signIn");
                  setErrorMessage("");
                }}
                style={[styles.modeLabel, mode === "signIn" && styles.selectedMode]}
              >
                Iniciar sesion
              </Text>
              <Text
                onPress={() => {
                  setMode("register");
                  setErrorMessage("");
                }}
                style={[styles.modeLabel, mode === "register" && styles.selectedMode]}
              >
                Crear cuenta
              </Text>
            </View>

            {mode === "register" && (
              <TextField
                autoCapitalize="words"
                label="Nombre"
                onChangeText={setName}
                placeholder="Tu nombre"
                value={name}
              />
            )}
            <TextField
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Correo electronico"
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              value={email}
            />
            <TextField
              autoCapitalize="none"
              autoComplete={mode === "register" ? "new-password" : "password"}
              label="Contrasena"
              onChangeText={setPassword}
              placeholder="Minimo 6 caracteres"
              secureTextEntry
              value={password}
            />

            {errorMessage ? <Notice message={errorMessage} variant="error" /> : null}
            {!isFirebaseConfigured && (
              <Notice message="Modo demostracion local: puedes entrar y publicar sin Firebase. La cuenta es de prueba y no valida contrasenas ni sincroniza datos." />
            )}

            <ActionButton
              disabled={loading}
              label={
                loading
                  ? "Un momento..."
                  : mode === "register"
                    ? "Crear mi cuenta"
                    : "Iniciar sesion"
              }
              onPress={submit}
            />
            <Text style={styles.orText}>o</Text>
            <ActionButton
              label="Explorar como visitante"
              onPress={() => router.replace("/explore")}
              variant="secondary"
            />
          </View>
          <Text style={styles.footer}>
            Al continuar, aceptas nuestros terminos de uso y politica de privacidad.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.green,
    marginBottom: 12,
  },
  brandIcon: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800",
  },
  brand: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  eyebrow: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginTop: 36,
    marginBottom: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 37,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 26,
  },
  form: {
    gap: 15,
  },
  modeSwitch: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 15,
    backgroundColor: "#ECEEE8",
    marginBottom: 3,
  },
  modeLabel: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 11,
    borderRadius: 12,
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    overflow: "hidden",
  },
  selectedMode: {
    backgroundColor: colors.white,
    color: colors.greenDark,
  },
  orText: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 12,
    marginVertical: -8,
  },
  footer: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 22,
  },
});
