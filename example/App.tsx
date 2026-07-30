import {
  addCandidEventListener,
  configure,
  log,
  registerTrigger,
  reset,
} from 'candid-react-native';
import { useEffect, useState } from 'react';
import { Button, SafeAreaView, ScrollView, Text, View } from 'react-native';

const USER_ID = 'candid-react-native-example';

export default function App() {
  const [status, setStatus] = useState('Configured on launch');
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    configure({
      userId: USER_ID,
      appearance: {
        primaryColor: '#35C884',
        font: { systemDesign: 'rounded' },
        widgetPosition: 'bottomRight',
      },
    });

    const subscription = addCandidEventListener((event) => {
      setEvents((current) => [event.name, ...current].slice(0, 20));
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Candid Example</Text>
        <Group name="Flow">
          <Button
            title="Register trigger (home)"
            onPress={() => {
              registerTrigger('home', { oncePerUser: false });
              setStatus('Registered trigger "home"');
            }}
          />
          <Button
            title="Log app_follow_artist"
            onPress={() => {
              log('app_follow_artist', { source: 'example' });
              setStatus('Logged app_follow_artist');
            }}
          />
          <Button
            title="Reset presentation history"
            onPress={() => {
              reset();
              setStatus('Reset');
            }}
          />
          <Text style={styles.status}>{status}</Text>
        </Group>
        <Group name="SDK events">
          {events.length === 0 ? (
            <Text style={styles.status}>No events received yet</Text>
          ) : (
            events.map((name, index) => <Text key={`${name}-${index}`}>{name}</Text>)
          )}
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: { fontSize: 30, margin: 20 },
  groupHeader: { fontSize: 20, marginBottom: 20 },
  group: { margin: 20, backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  container: { flex: 1, backgroundColor: '#eee' },
  status: { color: '#666', marginTop: 12 },
};
