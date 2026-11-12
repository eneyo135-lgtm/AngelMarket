import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile, verifyBeforeUpdateEmail } from "firebase/auth";
import { ActionButton, Notice, Screen } from "@/components/marketplace-ui";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { getDemoUser, updateDemoUser } from "@/lib/demo";
import { uploadStorePhoto } from "@/lib/cloudinary";
import { colors } from "@/constants/market";

type Preferences = { notifications: boolean; location: boolean };
const initialPreferences: Preferences = {notifications:true, location:true};

export default function SettingsScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const user = auth?.currentUser;
  const preferencesKey = `angelmarket.preferences.${user?.uid ?? "demo"}`;

  useEffect(() => {
    let active = true;
    if (user) {
      setName(user.displayName ?? "");
      setEmail(user.email ?? "");
      setPhotoURL(user.photoURL);
    } else {
      void getDemoUser().then(value => {if(active) {setName(value?.displayName ?? "");setEmail(value?.email ?? "");}});
    }
    void AsyncStorage.getItem(preferencesKey).then(raw => {
      if (!active || !raw) return;
      try {const value = JSON.parse(raw) as Partial<Preferences>; setPreferences({...initialPreferences, ...value});} catch { /* use defaults */ }
    });
    return () => {active = false;};
  }, [user?.uid, preferencesKey]);

  function resetMessages() {setMessage("");setError("");}
  async function setPreference(key: keyof Preferences, value: boolean) {
    const next = {...preferences, [key]:value};
    setPreferences(next);
    try {await AsyncStorage.setItem(preferencesKey, JSON.stringify(next));}
    catch {setError("No se pudieron guardar las preferencias.");}
  }
  async function saveName() {
    if (!name.trim()) {setError("Escribe tu nombre.");return;}
    resetMessages();setLoading(true);
    try {
      if (user) await updateProfile(user, {displayName:name.trim()});
      else await updateDemoUser(name.trim());
      setMessage("Tu nombre se guardó correctamente.");
    } catch(e) {setError(e instanceof Error ? e.message : "No se pudo cambiar tu nombre.");}
    finally {setLoading(false);}
  }
  async function selectPhoto() {
    resetMessages();
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {setError("Permite el acceso a la galería.");return;}
      const result = await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"], allowsEditing:true, aspect:[1,1], quality:0.65});
      if (result.canceled || !result.assets[0]) return;
      const picked = result.assets[0];
      setLoading(true);
      if (user && isFirebaseConfigured) {
        const url = await uploadStorePhoto({uri:picked.uri,mimeType:picked.mimeType});
        await updateProfile(user, {photoURL:url});
        setPhotoURL(url);
      } else {
        setPhotoURL(picked.uri);
        await AsyncStorage.setItem("angelmarket.demo.profilePhoto", picked.uri);
      }
      setMessage("Foto de perfil actualizada.");
    } catch(e) {setError(e instanceof Error ? e.message : "No se pudo actualizar la foto.");}
    finally {setLoading(false);}
  }
  async function verifyIdentity() {
    if (!user || !user.email) throw new Error("Necesitas iniciar sesión con una cuenta de Firebase.");
    if (!currentPassword) throw new Error("Escribe tu contraseña actual para confirmar el cambio.");
    const credential = EmailAuthProvider.credential(user.email,currentPassword);
    await reauthenticateWithCredential(user, credential);
  }
  async function changeEmail() {
    resetMessages();
    if (!user) {setError("Esta opción necesita una cuenta Firebase.");return;}
    if (!email.trim() || email.trim().toLowerCase() === user.email?.toLowerCase()) {setError("Escribe un correo nuevo y diferente.");return;}
    setLoading(true);
    try {
      await verifyIdentity();
      await verifyBeforeUpdateEmail(user,email.trim());
      setMessage("Se envió un enlace de verificación al correo nuevo. Confírmalo para terminar el cambio.");
      setCurrentPassword("");
    } catch(e) {setError(e instanceof Error ? e.message : "No se pudo iniciar el cambio de correo.");}
    finally {setLoading(false);}
  }
  async function changePassword() {
    resetMessages();
    if (!user) {setError("Esta opción necesita una cuenta Firebase.");return;}
    if (nextPassword.length < 6) {setError("La nueva contraseña necesita al menos 6 caracteres.");return;}
    setLoading(true);
    try {await verifyIdentity(); await updatePassword(user,nextPassword); setCurrentPassword("");setNextPassword("");setMessage("Contraseña actualizada.");}
    catch(e) {setError(e instanceof Error ? e.message : "No se pudo cambiar la contraseña.");}
    finally {setLoading(false);}
  }

  return <Screen>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹  Volver</Text></Pressable>
      <Text style={styles.title}>Configuración</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Foto y nombre</Text>
        {photoURL ? <Image source={{uri:photoURL}} style={styles.avatar}/> : <View style={styles.avatarPlaceholder}><Text style={styles.initial}>{(name || "A").charAt(0).toUpperCase()}</Text></View>}
        <ActionButton label="Cambiar foto" variant="secondary" onPress={() => void selectPhoto()}/>
        <Text style={styles.label}>Nombre</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Tu nombre" style={styles.input}/>
        <ActionButton label="Guardar nombre" variant="secondary" onPress={() => void saveName()}/>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Cuenta</Text>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" style={styles.input} value={email} onChangeText={setEmail}/>
        <Text style={styles.help}>Para cambiar el correo o la contraseña, confirma tu contraseña actual.</Text>
        <TextInput style={styles.input} placeholder="Contraseña actual" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword}/>
        <ActionButton label="Solicitar cambio de correo" variant="secondary" onPress={() => void changeEmail()}/>
        <TextInput style={styles.input} placeholder="Nueva contraseña (mínimo 6 caracteres)" secureTextEntry value={nextPassword} onChangeText={setNextPassword}/>
        <ActionButton label="Cambiar contraseña" variant="secondary" onPress={() => void changePassword()}/>
        {!isFirebaseConfigured ? <Text style={styles.help}>En el modo local solo se puede cambiar el nombre.</Text> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Preferencias</Text>
        <View style={styles.preference}><View style={styles.preferenceText}><Text style={styles.label}>Avisos de la aplicación</Text><Text style={styles.help}>Preferencia guardada; las notificaciones automáticas todavía no están habilitadas.</Text></View><Switch value={preferences.notifications} onValueChange={value => void setPreference("notifications",value)} trackColor={{true:colors.green}}/></View>
        <View style={styles.preference}><View style={styles.preferenceText}><Text style={styles.label}>Usar mi ubicación</Text><Text style={styles.help}>Preferencia de la app; el permiso GPS se gestiona desde tu teléfono.</Text></View><Switch value={preferences.location} onValueChange={value => void setPreference("location",value)} trackColor={{true:colors.green}}/></View>
        <Text style={styles.help}>Idioma: Español</Text>
      </View>
      {error ? <Notice message={error} variant="error"/> : null}
      {message ? <Notice message={message}/> : null}
      {loading ? <ActivityIndicator color={colors.green}/> : null}
      <Text style={styles.help}>Para eliminar una cuenta o sus locales, solicita la eliminación al administrador del proyecto. No se borra información automáticamente desde esta pantalla.</Text>
    </ScrollView>
  </Screen>;
}
const styles = StyleSheet.create({
  content:{padding:20,paddingBottom:60,gap:16},
  back:{color:colors.green,fontSize:16,fontWeight:"700"},title:{fontSize:26,color:colors.ink,fontWeight:"800"},
  card:{backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,borderRadius:18,padding:16,gap:12},
  heading:{fontSize:17,color:colors.ink,fontWeight:"800"}, label:{fontSize:13,color:colors.ink,fontWeight:"700"},
  input:{borderWidth:1,borderColor:colors.line,borderRadius:12,padding:12,color:colors.ink,backgroundColor:colors.cream},
  help:{fontSize:11,color:colors.muted,lineHeight:17},
  avatar:{width:78,height:78,borderRadius:39,alignSelf:"center"},avatarPlaceholder:{width:78,height:78,borderRadius:39,backgroundColor:colors.greenPale,alignSelf:"center",alignItems:"center",justifyContent:"center"},
  initial:{fontSize:30,fontWeight:"800",color:colors.green},
  preference:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:16},preferenceText:{flex:1,gap:3}
});
