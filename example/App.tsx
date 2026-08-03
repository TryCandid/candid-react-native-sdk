import {
  addCandidEventListener,
  configure,
  log,
  registerTrigger,
  setUserId as setCandidUserId,
  CandidSystemFontDesign,
  CandidWidgetPosition,
} from '@trycandid/react-native';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Settings,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const DEFAULT_USER_ID = 'candid-sample-user';

type SampleEnvironment = 'local' | 'staging' | 'production';

const PRODUCTION_BASE_URL = 'https://candid-api.wave.voodoo.io/';

const ENVIRONMENTS: { id: SampleEnvironment; title: string; baseURL: string }[] = [
  { id: 'local', title: 'Local', baseURL: 'http://localhost:8000/' },
  { id: 'staging', title: 'Staging', baseURL: 'https://candid-api.wave.voodoo-staging.io/' },
  { id: 'production', title: 'Prod', baseURL: PRODUCTION_BASE_URL },
];

// Persistence mirrors the iOS sample (UserDefaults-backed). `Settings` is iOS only; the
// native side also reads `candidBaseURLOverride` to reroute Candid API requests in debug.
const settingsGet = (key: string): string | undefined =>
  Platform.OS === 'ios' ? (Settings.get(key) as string | undefined) : undefined;
const settingsSet = (values: Record<string, string>) => {
  if (Platform.OS === 'ios') {
    Settings.set(values);
  }
};

const apiKeySettingsKey = (environment: SampleEnvironment) => `candidApiKey.${environment}`;

const savedBaseURL = (environment: SampleEnvironment) => {
  const environmentBaseURL = ENVIRONMENTS.find((item) => item.id === environment)!.baseURL;
  if (environment === 'local') {
    return settingsGet('candidLocalBaseURL') || environmentBaseURL;
  }
  return environmentBaseURL;
};

const initialEnvironment: SampleEnvironment =
  (settingsGet('candidEnvironment') as SampleEnvironment) || 'staging';
const initialBaseURL = savedBaseURL(initialEnvironment);
const initialApiKey = settingsGet(apiKeySettingsKey(initialEnvironment)) ?? '';
const initialUserId = settingsGet('candidUserId') || DEFAULT_USER_ID;

const PRIMARY_COLORS = [
  { title: 'Green', hex: '#35C884' },
  { title: 'Purple', hex: '#6C5CE7' },
  { title: 'Blue', hex: '#0984E3' },
  { title: 'Orange', hex: '#F97316' },
  { title: 'Pink', hex: '#E84393' },
];

// Entries without a `systemDesign` use the custom font name entered below.
const FONT_CHOICES: { title: string; systemDesign?: CandidSystemFontDesign }[] = [
  { title: 'System', systemDesign: 'default' },
  { title: 'Rounded', systemDesign: 'rounded' },
  { title: 'Serif', systemDesign: 'serif' },
  { title: 'Monospaced', systemDesign: 'monospaced' },
  { title: 'Custom' },
];

const WIDGET_POSITIONS: { title: string; position: CandidWidgetPosition }[] = [
  { title: 'Top left', position: 'topLeft' },
  { title: 'Top right', position: 'topRight' },
  { title: 'Bottom left', position: 'bottomLeft' },
  { title: 'Bottom right', position: 'bottomRight' },
];

const SAMPLE_EVENTS = [
  { title: 'Follow an artist', name: 'app_follow_artist' },
  { title: 'Add a track to a playlist', name: 'add_to_playlist_save' },
  { title: 'Start a track in the Discover tab', name: 'discovery_start' },
  { title: 'Like or dislike 2 tracks', name: 'candid_discovery_like_2_tracks' },
  { title: 'Show top charts for house music', name: 'candid_select_house_top_charts' },
];

export default function App() {
  const [environment, setEnvironment] = useState<SampleEnvironment>(initialEnvironment);
  const [baseURLDraft, setBaseURLDraft] = useState(initialBaseURL);
  const [baseURL, setBaseURL] = useState(initialBaseURL);
  const [apiKeyDraft, setApiKeyDraft] = useState(initialApiKey);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [userIdDraft, setUserIdDraft] = useState(initialUserId);
  const [userId, setUserId] = useState(initialUserId);
  const [recordingDuration, setRecordingDuration] = useState(600);
  const [primaryColor, setPrimaryColor] = useState(PRIMARY_COLORS[0].hex);
  const [fontChoice, setFontChoice] = useState(FONT_CHOICES[1]);
  const [customFontNameDraft, setCustomFontNameDraft] = useState('AvenirNext-Regular');
  const [customFontName, setCustomFontName] = useState('AvenirNext-Regular');
  const [widgetPosition, setWidgetPosition] = useState<CandidWidgetPosition>('bottomRight');
  const [widgetVerticalPadding, setWidgetVerticalPadding] = useState(172);
  const [lastLoggedEvent, setLastLoggedEvent] = useState('No events logged');
  const [sdkEvents, setSdkEvents] = useState<string[]>([]);

  useEffect(() => {
    configure({
      apiKey: apiKey || undefined,
      recordingDuration,
      appearance: {
        primaryColor,
        font: fontChoice.systemDesign
          ? { systemDesign: fontChoice.systemDesign }
          : { customName: customFontName },
        widgetPosition,
        widgetVerticalPadding,
      },
    });
  }, [
    apiKey,
    recordingDuration,
    primaryColor,
    fontChoice,
    customFontName,
    widgetPosition,
    widgetVerticalPadding,
  ]);

  useEffect(() => {
    setCandidUserId(userId || null);
  }, [userId]);

  useEffect(() => {
    const subscription = addCandidEventListener((event) => {
      const properties = event.properties && Object.keys(event.properties).length
        ? ` ${JSON.stringify(event.properties)}`
        : '';
      setSdkEvents((current) => [`${event.name}${properties}`, ...current].slice(0, 20));
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    settingsSet({
      candidEnvironment: environment,
      // Read by the debug-only URLProtocol in AppDelegate to reroute Candid API requests.
      candidBaseURLOverride: environment === 'production' ? '' : baseURL,
      candidUserId: userId,
      [apiKeySettingsKey(environment)]: apiKey,
      ...(environment === 'local' ? { candidLocalBaseURL: baseURL } : {}),
    });
  }, [environment, baseURL, apiKey, userId]);

  const selectEnvironment = (nextEnvironment: SampleEnvironment) => {
    if (nextEnvironment === environment) {
      return;
    }
    setEnvironment(nextEnvironment);
    const nextBaseURL = savedBaseURL(nextEnvironment);
    setBaseURL(nextBaseURL);
    setBaseURLDraft(nextBaseURL);
    const nextApiKey = settingsGet(apiKeySettingsKey(nextEnvironment)) ?? '';
    setApiKey(nextApiKey);
    setApiKeyDraft(nextApiKey);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Candid Sample</Text>

        <Group name="Connection">
          <Text style={styles.label}>Environment</Text>
          <View style={styles.chipRow}>
            {ENVIRONMENTS.map((item) => (
              <Chip
                key={item.id}
                title={item.title}
                selected={environment === item.id}
                onPress={() => selectEnvironment(item.id)}
              />
            ))}
          </View>
          <Text style={styles.label}>Base URL</Text>
          <TextInput
            style={[styles.input, environment !== 'local' && styles.inputDisabled]}
            value={baseURLDraft}
            onChangeText={setBaseURLDraft}
            onEndEditing={() => setBaseURL(baseURLDraft.trim())}
            editable={environment === 'local'}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
          />
          <Text style={styles.label}>API key</Text>
          <TextInput
            style={styles.input}
            value={apiKeyDraft}
            onChangeText={setApiKeyDraft}
            onEndEditing={() => setApiKey(apiKeyDraft.trim())}
            placeholder="cpk_..."
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="done"
          />
          <Text style={styles.label}>User ID</Text>
          <TextInput
            style={styles.input}
            value={userIdDraft}
            onChangeText={setUserIdDraft}
            onEndEditing={() => setUserId(userIdDraft.trim())}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
        </Group>

        <Group name="Flow">
          <Stepper
            label="Recording duration"
            value={recordingDuration}
            unit="s"
            min={15}
            max={900}
            step={15}
            onChange={setRecordingDuration}
          />
        </Group>

        <Group name="Appearance">
          <Text style={styles.label}>Primary color</Text>
          <View style={styles.chipRow}>
            {PRIMARY_COLORS.map((color) => (
              <Pressable
                key={color.hex}
                style={[
                  styles.colorDot,
                  { backgroundColor: color.hex },
                  primaryColor === color.hex && styles.colorDotSelected,
                ]}
                onPress={() => setPrimaryColor(color.hex)}
              />
            ))}
          </View>

          <Text style={styles.label}>Font</Text>
          <View style={styles.chipRow}>
            {FONT_CHOICES.map((choice) => (
              <Chip
                key={choice.title}
                title={choice.title}
                selected={fontChoice.title === choice.title}
                onPress={() => setFontChoice(choice)}
              />
            ))}
          </View>
          {fontChoice.systemDesign ? null : (
            <TextInput
              style={styles.input}
              value={customFontNameDraft}
              onChangeText={setCustomFontNameDraft}
              onEndEditing={() => setCustomFontName(customFontNameDraft.trim())}
              placeholder="Registered font name"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          )}

          <Text style={styles.label}>Widget position</Text>
          <View style={styles.chipRow}>
            {WIDGET_POSITIONS.map((item) => (
              <Chip
                key={item.position}
                title={item.title}
                selected={widgetPosition === item.position}
                onPress={() => setWidgetPosition(item.position)}
              />
            ))}
          </View>

          <Stepper
            label="Widget padding"
            value={widgetVerticalPadding}
            unit="pt"
            min={0}
            max={600}
            step={20}
            onChange={setWidgetVerticalPadding}
          />
        </Group>

        <Group name="Actions">
          <ActionRow
            title="Start Candid scenario"
            emphasized
            onPress={() => {
              registerTrigger('home', { oncePerUser: false });
              setLastLoggedEvent("Registered trigger 'home'");
            }}
          />
          {SAMPLE_EVENTS.map((event) => (
            <ActionRow
              key={event.name}
              title={event.title}
              onPress={() => {
                log(event.name);
                setLastLoggedEvent(`Logged ${event.name}`);
              }}
            />
          ))}
          <Text style={styles.status}>{lastLoggedEvent}</Text>
        </Group>

        <Group name="SDK events">
          {sdkEvents.length === 0 ? (
            <Text style={styles.status}>No events received yet</Text>
          ) : (
            sdkEvents.map((name, index) => <Text key={`${name}-${index}`}>{name}</Text>)
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

function Chip(props: { title: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.chip, props.selected && styles.chipSelected]}
      onPress={props.onPress}
    >
      <Text style={[styles.chipText, props.selected && styles.chipTextSelected]}>
        {props.title}
      </Text>
    </Pressable>
  );
}

function Stepper(props: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>
        {props.label}: {props.value}
        {props.unit}
      </Text>
      <View style={styles.stepperButtons}>
        <Pressable
          style={styles.stepperButton}
          onPress={() => props.onChange(Math.max(props.min, props.value - props.step))}
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Pressable
          style={styles.stepperButton}
          onPress={() => props.onChange(Math.min(props.max, props.value + props.step))}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ActionRow(props: { title: string; emphasized?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.actionRow} onPress={props.onPress}>
      <Text style={[styles.actionText, props.emphasized && styles.actionTextEmphasized]}>
        {props.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 30, margin: 20, fontWeight: '700' },
  groupHeader: { fontSize: 20, marginBottom: 16, fontWeight: '600' },
  group: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  container: { flex: 1, backgroundColor: '#eee' },
  label: { color: '#666', fontSize: 13, marginBottom: 6, marginTop: 10 },
  status: { color: '#666', marginTop: 12, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputDisabled: { color: '#999', backgroundColor: '#f7f7f7' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipSelected: { backgroundColor: '#222', borderColor: '#222' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextSelected: { color: '#fff' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: '#222' },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  stepperLabel: { fontSize: 15, flexShrink: 1 },
  stepperButtons: { flexDirection: 'row', gap: 8 },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 20, color: '#333' },
  actionRow: { paddingVertical: 10 },
  actionText: { fontSize: 16, color: '#0a7ea4' },
  actionTextEmphasized: { fontWeight: '600' },
});
