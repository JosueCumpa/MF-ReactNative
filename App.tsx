import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getMyAccess,
  listUsers,
  loginUser,
  registerUser,
  switchMyRole,
  type AccessPayload,
  type AuthPayload,
  type MenuItem,
  type RoleKey,
  type User,
} from './src/api/bkApi';
import {API_BASE_URL} from './src/api/config';

const RemoteApp = React.lazy(() => import('remote/RemoteRoot'));

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

function LoadingFallback(): React.JSX.Element {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
      <Text style={styles.helperText}>Cargando microfrontend remoto...</Text>
    </View>
  );
}

export default function App(): React.JSX.Element {
  const [name, setName] = useState('Usuario Demo');
  const [email, setEmail] = useState('demo.menu@bk.local');
  const [password, setPassword] = useState('123456');
  const [auth, setAuth] = useState<AuthPayload | null>(null);
  const [access, setAccess] = useState<AccessPayload | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string>('home');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState('');

  const token = auth?.token ?? '';
  const selectedMenu = useMemo(
    () => access?.menu.find(item => item.id === activeMenuId) ?? null,
    [access, activeMenuId],
  );

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError('');
    try {
      await fn();
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : 'Error desconocido',
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAccess = async (nextToken: string) => {
    const accessData = await getMyAccess(nextToken);
    setAccess(accessData);
    setActiveMenuId(accessData.menu[0]?.id ?? 'home');
    setLog(pretty(accessData));
  };

  const onAuthSuccess = async (payload: AuthPayload) => {
    setAuth(payload);
    await loadAccess(payload.token);
  };

  const handleLogin = () =>
    run(async () => {
      const payload = await loginUser({email, password});
      await onAuthSuccess(payload);
    });

  const handleRegister = () =>
    run(async () => {
      const payload = await registerUser({name, email, password});
      await onAuthSuccess(payload);
    });

  const handleRefreshAccess = () =>
    run(async () => {
      if (!token) {
        return;
      }

      await loadAccess(token);
    });

  const handleToggleRole = () =>
    run(async () => {
      if (!token || !access) {
        return;
      }

      const nextRole: RoleKey = access.roles.includes('admin') ? 'user' : 'admin';
      const updated = await switchMyRole(token, nextRole);
      setAccess(updated);
      setActiveMenuId(updated.menu[0]?.id ?? 'home');
      setLog(pretty(updated));
      setUsers([]);
    });

  const logout = () => {
    setAuth(null);
    setAccess(null);
    setUsers([]);
    setError('');
    setLog('');
    setActiveMenuId('home');
  };

  useEffect(() => {
    if (!token || selectedMenu?.id !== 'users') {
      return;
    }

    setLoading(true);
    setError('');
    listUsers(token)
      .then(result => {
        setUsers(result);
        setLog(pretty(result));
      })
      .catch(effectError => {
        setError(
          effectError instanceof Error
            ? effectError.message
            : 'Error desconocido',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, selectedMenu]);

  if (!auth) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Host App</Text>
          <Text style={styles.subtitle}>
            Login + menu dinamico por permisos ({API_BASE_URL})
          </Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Autenticacion</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Nombre"
              style={styles.input}
              value={name}
            />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              style={styles.input}
              value={email}
            />
            <TextInput
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              style={styles.input}
              value={password}
            />

            <View style={styles.buttonGap}>
              <Button onPress={handleRegister} title="Registrar" />
            </View>
            <View style={styles.buttonGap}>
              <Button onPress={handleLogin} title="Login" />
            </View>
          </View>

          {loading ? <ActivityIndicator size="large" /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Host App</Text>
          <Text style={styles.subtitle}>
            Usuario: {auth.user.name} ({auth.user.email})
          </Text>
          <Text style={styles.muted}>
            Roles: {access?.roles.join(', ') || 'sin roles'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          <View style={styles.buttonGap}>
            <Button onPress={handleRefreshAccess} title="Refrescar permisos" />
          </View>
          <View style={styles.buttonGap}>
            <Button onPress={handleToggleRole} title="Cambiar rol (admin/user)" />
          </View>
          <View style={styles.buttonGap}>
            <Button color="#b91c1c" onPress={logout} title="Cerrar sesion" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Menu dinamico</Text>
          {!access?.menu.length ? (
            <Text style={styles.error}>No hay opciones habilitadas para este usuario.</Text>
          ) : (
            access.menu.map((item: MenuItem) => (
              <View key={item.id} style={styles.buttonGap}>
                <Button
                  onPress={() => setActiveMenuId(item.id)}
                  title={`Abrir: ${item.label}`}
                />
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contenido activo</Text>
          <Text style={styles.muted}>
            {selectedMenu ? `${selectedMenu.id} (${selectedMenu.type})` : 'Sin opcion seleccionada'}
          </Text>

          {selectedMenu?.id === 'remote' ? (
            <View style={styles.remoteContainer}>
              <React.Suspense fallback={<LoadingFallback />}>
                <RemoteApp />
              </React.Suspense>
            </View>
          ) : null}

          {selectedMenu?.id === 'users' ? (
            <View style={styles.usersContainer}>
              {loading ? <ActivityIndicator size="small" /> : null}
              {users.map(user => (
                <Text key={user.id} style={styles.userRow}>
                  #{user.id} {user.name} - {user.email}
                </Text>
              ))}
              {!users.length && !loading ? (
                <Text style={styles.muted}>Sin usuarios para mostrar.</Text>
              ) : null}
            </View>
          ) : null}

          {selectedMenu?.id === 'home' ? (
            <Text style={styles.muted}>
              Esta pantalla viene del host. El menu se habilita segun permisos de BK-API.
            </Text>
          ) : null}
        </View>

        {loading ? <ActivityIndicator size="large" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {log ? <Text style={styles.output}>{log}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f5fb',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  header: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe2ef',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    color: '#4b5563',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe2ef',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    color: '#111827',
    backgroundColor: '#f8fafc',
  },
  buttonGap: {
    marginTop: 8,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  helperText: {
    color: '#4b5563',
  },
  muted: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  usersContainer: {
    marginTop: 8,
    gap: 6,
  },
  remoteContainer: {
    height: 380,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#dbe2ef',
    borderRadius: 8,
    overflow: 'hidden',
  },
  userRow: {
    color: '#111827',
    fontSize: 13,
  },
  output: {
    fontFamily: 'monospace',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
  },
  error: {
    color: '#b91c1c',
    fontWeight: '600',
  },
});
