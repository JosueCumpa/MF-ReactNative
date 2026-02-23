import React from 'react';
import {ActivityIndicator, SafeAreaView, StyleSheet, Text, View} from 'react-native';

const RemoteApp = React.lazy(() => import('remote/RemoteRoot'));

function LoadingFallback(): React.JSX.Element {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
      <Text style={styles.helperText}>Cargando microfrontend remoto...</Text>
    </View>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Host App</Text>
        <Text style={styles.subtitle}>Microfrontend remoto + BK-API</Text>
      </View>

      <React.Suspense fallback={<LoadingFallback />}>
        <RemoteApp />
      </React.Suspense>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f6fb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#d7dcea',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  helperText: {
    color: '#4b5563',
  },
});
