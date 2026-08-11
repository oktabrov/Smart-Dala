import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  Droplets,
  Eye,
  FileImage,
  FlaskConical,
  Gauge,
  History,
  ImagePlus,
  Languages,
  Leaf,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Save,
  ScanLine,
  Settings as SettingsIcon,
  ShieldCheck,
  Sprout,
  Thermometer,
  Trash2,
  Upload,
  UserRound,
  Video,
  Wind,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { captureVideoFrame, optimizeImageFile } from './lib/image.js';
import { readStoredJson, removeStoredValue, writeStoredJson } from './lib/storage.js';

const STORAGE = {
  language: 'smart_dala_language',
  settings: 'smart_dala_device_settings',
  user: 'smart_dala_user',
  users: 'smart_dala_local_users',
  journal: 'smart_dala_analysis_records',
};

const PAGES = {
  monitor: 'monitor',
  diagnostics: 'diagnostics',
  journal: 'journal',
  settings: 'settings',
};

const DEFAULT_USER = { id: 'guest', username: 'Guest', role: 'user' };
const DEFAULT_SETTINGS = { sensorIp: '', cameraIp: '' };

const COPY = {
  uz: {
    language: "O'zbek",
    subtitle: "Aqlli dehqonchilik boshqaruv tizimi",
    monitor: 'AgroRobo',
    diagnostics: 'Diagnostika',
    journal: 'Tahlillar jurnali',
    settings: 'Sozlamalar',
    online: 'Onlayn',
    offline: 'Oflayn',
    monitoring: 'Monitoring',
    dashboardTitle: 'Smart Dala nazorati',
    dashboardLead: 'Qishloq xo‘jaligini real vaqt kuzatish va boshqarish',
    session: 'Sessiya',
    signal: 'Signal',
    active: 'Faol',
    lost: "Yo'qolgan",
    cameraFeed: 'Jonli kamera',
    reconnect: 'Qayta ulanish',
    noCamera: 'Kamera manzili sozlanmagan',
    cameraHint: 'Kamera IP manzilini Sozlamalarda kiriting.',
    aiCore: 'Agro AI',
    aiScan: 'AI skan',
    water: "Sug'orish",
    autoIrrigation: 'Avto sug‘orish',
    climateControl: 'Iqlim nazorati',
    systemSecure: 'Tizim himoyalangan',
    modulesOnline: 'Modullar holati tekshirilmoqda',
    telemetry: 'Telemetriya oqimi',
    temperature: 'Harorat',
    humidity: 'Namlik',
    soil: 'Tuproq namligi',
    air: 'Havo sifati',
    live: 'Jonli',
    noSignal: "Signal yo'q",
    critical: 'Jiddiy',
    chart: 'Sensorlar grafigi',
    systemLogs: 'Tizim jurnali',
    diagnosticsTitle: 'AI diagnostika',
    diagnosticsLead: 'O‘simlik rasmini oling yoki yuklang va AI xulosasini oling.',
    camera: 'Kamera',
    closeCamera: 'Kamerani yopish',
    upload: 'Rasm yuklash',
    noImage: 'Rasm tanlanmagan',
    imageHint: 'Aniq barg yoki o‘simlik rasmini oling.',
    ready: 'Rasm tahlilga tayyor',
    chooseImage: 'Tahlilni boshlash uchun rasm yuklang yoki oling.',
    analyzing: 'Tahlil qilinmoqda…',
    analyze: 'AI tahlilni boshlash',
    analysisSaved: 'Tahlil jurnalga saqlandi',
    result: 'Tashxis natijasi',
    crop: 'Aniqlangan ekin',
    diagnosis: 'Biologik holat',
    treatment: 'Tavsiya etilgan yechim',
    irrigation: "Sug'orish holati",
    report: "To'liq tahlil va xulosa",
    healthy: "Sog'lom",
    warning: 'Ogohlantirish',
    all: 'Barchasi',
    filters: 'Filtrlar',
    clear: 'Hammasini tozalash',
    clearConfirm: 'Barcha saqlangan tahlillarni o‘chirasizmi?',
    emptyJournal: 'Hali saqlangan tahlillar yo‘q',
    emptyJournalHint: 'Diagnostika sahifasida rasmni tahlil qiling.',
    detectedAt: 'Vaqt',
    cropType: 'Ekin',
    diagnosisColumn: 'Tashxis',
    treatmentColumn: 'Yechim',
    irrigationColumn: "Sug'orish",
    severity: 'Daraja',
    delete: "O'chirish",
    deviceSettings: 'Qurilma sozlamalari',
    sensorIp: 'ESP sensor manzili',
    cameraIp: 'ESP kamera manzili',
    deviceHint: 'IP yoki hostni kiriting. Brauzer qurilmaga shu tarmoq orqali ulanadi.',
    save: 'Saqlash',
    saved: 'Saqlandi',
    interfaceLanguage: 'Interfeys tili',
    systemInfo: 'Tizim ma’lumotlari',
    storage: 'Tahlillar saqlanishi',
    provider: 'AI provayder',
    serverSide: 'Server tomonda sozlanadi',
    localStorage: 'Ushbu brauzer',
    logout: 'Chiqish',
    login: 'Kirish',
    register: "Ro'yxatdan o'tish",
    username: 'Foydalanuvchi nomi',
    password: 'Parol',
    guest: 'Mehmon sifatida kirish',
    noAccount: "Hisobingiz yo'qmi? Ro'yxatdan o'ting",
    hasAccount: 'Hisobingiz bormi? Kiring',
    localOnly: 'Bu faqat shu brauzerdagi lokal profil.',
    invalidLogin: 'Foydalanuvchi nomi yoki parol noto‘g‘ri.',
    accountExists: 'Bu foydalanuvchi nomi band.',
    accountCreated: 'Lokal profil yaratildi. Endi kiring.',
    imageError: 'Rasmni tayyorlab bo‘lmadi.',
    cameraError: 'Kameraga kira olmadik. Ruxsat va HTTPS ni tekshiring.',
    analysisError: 'AI tahlili hozir mavjud emas. Keyinroq urinib ko‘ring.',
    configured: 'Sozlangan',
    notConfigured: 'Sozlanmagan',
  },
  ru: {
    language: 'Русский',
    subtitle: 'Система умного сельского хозяйства',
    monitor: 'АгроРобо',
    diagnostics: 'Диагностика',
    journal: 'Журнал анализов',
    settings: 'Настройки',
    online: 'Онлайн',
    offline: 'Оффлайн',
    monitoring: 'Мониторинг',
    dashboardTitle: 'Управление Smart Dala',
    dashboardLead: 'Мониторинг и управление сельским хозяйством в реальном времени',
    session: 'Сессия',
    signal: 'Сигнал',
    active: 'Активен',
    lost: 'Нет связи',
    cameraFeed: 'Камера',
    reconnect: 'Переподключить',
    noCamera: 'Адрес камеры не настроен',
    cameraHint: 'Укажите IP камеры в настройках.',
    aiCore: 'Агро AI',
    aiScan: 'AI скан',
    water: 'Полив',
    autoIrrigation: 'Автополив',
    climateControl: 'Контроль климата',
    systemSecure: 'Система защищена',
    modulesOnline: 'Проверка состояния модулей',
    telemetry: 'Поток телеметрии',
    temperature: 'Температура',
    humidity: 'Влажность',
    soil: 'Влажность почвы',
    air: 'Качество воздуха',
    live: 'В реальном времени',
    noSignal: 'Нет сигнала',
    critical: 'Критично',
    chart: 'График датчиков',
    systemLogs: 'Системный журнал',
    diagnosticsTitle: 'AI диагностика',
    diagnosticsLead: 'Сделайте или загрузите фото растения для анализа.',
    camera: 'Камера',
    closeCamera: 'Закрыть камеру',
    upload: 'Загрузить фото',
    noImage: 'Фото не выбрано',
    imageHint: 'Сделайте чёткое фото листа или растения.',
    ready: 'Фото готово к анализу',
    chooseImage: 'Загрузите или сделайте фото, чтобы начать анализ.',
    analyzing: 'Выполняется анализ…',
    analyze: 'Начать AI анализ',
    analysisSaved: 'Анализ сохранён в журнал',
    result: 'Результат диагностики',
    crop: 'Распознанная культура',
    diagnosis: 'Биологическое состояние',
    treatment: 'Рекомендуемое решение',
    irrigation: 'Статус полива',
    report: 'Полный анализ и заключение',
    healthy: 'Здоровое',
    warning: 'Предупреждение',
    all: 'Все',
    filters: 'Фильтры',
    clear: 'Очистить всё',
    clearConfirm: 'Удалить все сохранённые анализы?',
    emptyJournal: 'Сохранённых анализов пока нет',
    emptyJournalHint: 'Запустите анализ на странице диагностики.',
    detectedAt: 'Время',
    cropType: 'Культура',
    diagnosisColumn: 'Диагноз',
    treatmentColumn: 'Решение',
    irrigationColumn: 'Полив',
    severity: 'Уровень',
    delete: 'Удалить',
    deviceSettings: 'Настройки устройств',
    sensorIp: 'Адрес ESP датчиков',
    cameraIp: 'Адрес ESP камеры',
    deviceHint: 'Укажите IP или host. Браузер подключается к устройству в этой сети.',
    save: 'Сохранить',
    saved: 'Сохранено',
    interfaceLanguage: 'Язык интерфейса',
    systemInfo: 'Информация о системе',
    storage: 'Хранилище анализов',
    provider: 'AI провайдер',
    serverSide: 'Настраивается на сервере',
    localStorage: 'Этот браузер',
    logout: 'Выйти',
    login: 'Войти',
    register: 'Регистрация',
    username: 'Имя пользователя',
    password: 'Пароль',
    guest: 'Продолжить как гость',
    noAccount: 'Нет аккаунта? Зарегистрируйтесь',
    hasAccount: 'Уже есть аккаунт? Войдите',
    localOnly: 'Это локальный профиль только для этого браузера.',
    invalidLogin: 'Неверное имя пользователя или пароль.',
    accountExists: 'Это имя пользователя уже занято.',
    accountCreated: 'Локальный профиль создан. Теперь войдите.',
    imageError: 'Не удалось подготовить изображение.',
    cameraError: 'Не удалось открыть камеру. Проверьте разрешение и HTTPS.',
    analysisError: 'AI-анализ сейчас недоступен. Попробуйте позже.',
    configured: 'Настроено',
    notConfigured: 'Не настроено',
  },
  en: {
    language: 'English',
    subtitle: 'Smart agricultural management system',
    monitor: 'AgroRobo',
    diagnostics: 'Diagnostics',
    journal: 'Analysis journal',
    settings: 'Settings',
    online: 'Online',
    offline: 'Offline',
    monitoring: 'Monitoring',
    dashboardTitle: 'Smart Dala Control',
    dashboardLead: 'Real-time agricultural monitoring and field control',
    session: 'Session',
    signal: 'Signal',
    active: 'Active',
    lost: 'Lost',
    cameraFeed: 'Live camera',
    reconnect: 'Reconnect',
    noCamera: 'Camera address is not configured',
    cameraHint: 'Enter the camera address in Settings.',
    aiCore: 'Agro AI',
    aiScan: 'AI scan',
    water: 'Water',
    autoIrrigation: 'Auto irrigation',
    climateControl: 'Climate control',
    systemSecure: 'System secure',
    modulesOnline: 'Checking module status',
    telemetry: 'Telemetry stream',
    temperature: 'Temperature',
    humidity: 'Humidity',
    soil: 'Soil moisture',
    air: 'Air quality',
    live: 'Live',
    noSignal: 'No signal',
    critical: 'Critical',
    chart: 'Sensor chart',
    systemLogs: 'System logs',
    diagnosticsTitle: 'AI diagnostics',
    diagnosticsLead: 'Take or upload a crop photo for analysis.',
    camera: 'Camera',
    closeCamera: 'Close camera',
    upload: 'Upload image',
    noImage: 'No image selected',
    imageHint: 'Capture a clear leaf or plant photo.',
    ready: 'Image ready for analysis',
    chooseImage: 'Upload or capture an image to start analysis.',
    analyzing: 'Analyzing…',
    analyze: 'Start AI analysis',
    analysisSaved: 'Analysis saved to your journal',
    result: 'Diagnostic result',
    crop: 'Detected crop',
    diagnosis: 'Biological status',
    treatment: 'Recommended solution',
    irrigation: 'Irrigation status',
    report: 'Full analysis and guidance',
    healthy: 'Healthy',
    warning: 'Warning',
    all: 'All',
    filters: 'Filters',
    clear: 'Clear all',
    clearConfirm: 'Delete all saved analyses?',
    emptyJournal: 'No saved analyses yet',
    emptyJournalHint: 'Run an analysis on the Diagnostics page.',
    detectedAt: 'Time',
    cropType: 'Crop',
    diagnosisColumn: 'Diagnosis',
    treatmentColumn: 'Solution',
    irrigationColumn: 'Irrigation',
    severity: 'Severity',
    delete: 'Delete',
    deviceSettings: 'Device settings',
    sensorIp: 'ESP sensor address',
    cameraIp: 'ESP camera address',
    deviceHint: 'Enter an IP address or host. Your browser connects to the device on this network.',
    save: 'Save',
    saved: 'Saved',
    interfaceLanguage: 'Interface language',
    systemInfo: 'System information',
    storage: 'Analysis storage',
    provider: 'AI provider',
    serverSide: 'Configured server-side',
    localStorage: 'This browser',
    logout: 'Log out',
    login: 'Log in',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    guest: 'Continue as guest',
    noAccount: 'No account? Register',
    hasAccount: 'Already have an account? Log in',
    localOnly: 'This is a local profile for this browser only.',
    invalidLogin: 'Incorrect username or password.',
    accountExists: 'That username is already in use.',
    accountCreated: 'Local profile created. You can now log in.',
    imageError: 'The image could not be prepared.',
    cameraError: 'The camera could not be opened. Check permission and HTTPS.',
    analysisError: 'AI analysis is unavailable right now. Please try again later.',
    configured: 'Configured',
    notConfigured: 'Not configured',
  },
};

function cx(...values) {
  return values.filter(Boolean).join(' ');
}

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
}

async function hashLocalPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getCopy(language) {
  return COPY[language] || COPY.uz;
}

function normalizeLanguage(language) {
  return Object.hasOwn(COPY, language) ? language : 'uz';
}

function normaliseSensors(raw) {
  const temperature = asNumber(raw?.harorat ?? raw?.temperature ?? raw?.temp);
  const humidity = asNumber(raw?.namlik ?? raw?.humidity ?? raw?.hum);
  const gas = asNumber(raw?.gaz_qiymat ?? raw?.gas ?? raw?.air);
  const moisture = asNumber(raw?.tuproq_raw ?? raw?.moisture ?? raw?.soil);
  return { temperature, humidity, gas, moisture };
}

function soilPercent(sensors) {
  const raw = sensors?.moisture;
  if (raw === null || raw === undefined) {
    return null;
  }
  if (raw >= 0 && raw <= 100) {
    return Math.round(raw);
  }
  return Math.max(0, Math.min(100, Math.round(((4095 - raw) / 2595) * 100)));
}

function displayValue(value, digits = 0) {
  return value === null || value === undefined ? '—' : Number(value).toFixed(digits);
}

function deviceUrl(address, path = '/') {
  const entered = String(address || '').trim().replace(/\/+$/, '');
  if (!entered) {
    return '';
  }

  try {
    const url = new URL(/^https?:\/\//i.test(entered) ? entered : 'http://' + entered);
    url.pathname = path;
    url.search = '';
    return url.toString();
  } catch {
    return '';
  }
}

function cameraUrl(address, cacheBuster) {
  const entered = String(address || '').trim().replace(/\/+$/, '');
  if (!entered) {
    return '';
  }

  try {
    const url = new URL(/^https?:\/\//i.test(entered) ? entered : 'http://' + entered);
    if (!url.port) {
      url.port = '81';
    }
    url.pathname = '/';
    url.search = cacheBuster ? 'refresh=' + cacheBuster : '';
    return url.toString();
  } catch {
    return '';
  }
}

function statusLabel(severity, copy) {
  if (severity === 'HEALTHY') return copy.healthy;
  if (severity === 'CRITICAL') return copy.critical;
  return copy.warning;
}

function formatRecordTime(record, language) {
  const locale = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-GB' : 'uz-UZ';
  const date = new Date(record.createdAt || Date.now());
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function clampRecord(record) {
  const severity = ['HEALTHY', 'WARNING', 'CRITICAL'].includes(record?.severity)
    ? record.severity
    : 'WARNING';
  return {
    id: record?.id || makeId(),
    createdAt: record?.createdAt || Date.now(),
    image: typeof record?.image === 'string' ? record.image : '',
    crop: String(record?.crop || '—').slice(0, 160),
    diagnosis: String(record?.diagnosis || '—').slice(0, 240),
    treatment: String(record?.treatment || '—').slice(0, 600),
    irrigation: String(record?.irrigation || '—').slice(0, 160),
    severity,
    report: String(record?.report || '—').slice(0, 6000),
    sensorData: record?.sensorData || null,
    provider: typeof record?.provider === 'string' ? record.provider : '',
  };
}

export default function App() {
  const [language, setLanguage] = useState(() => normalizeLanguage(readStoredJson(STORAGE.language, 'uz')));
  const [activePage, setActivePage] = useState(PAGES.monitor);
  const [user, setUser] = useState(() => readStoredJson(STORAGE.user, DEFAULT_USER));
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...readStoredJson(STORAGE.settings, DEFAULT_SETTINGS),
  }));
  const [sensors, setSensors] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [journal, setJournal] = useState(() => {
    const records = readStoredJson(STORAGE.journal, []);
    return Array.isArray(records) ? records.map(clampRecord) : [];
  });
  const [lastResult, setLastResult] = useState(null);

  const copy = getCopy(language);

  useEffect(() => {
    document.documentElement.lang = language;
    writeStoredJson(STORAGE.language, language);
  }, [language]);

  useEffect(() => {
    writeStoredJson(STORAGE.settings, settings);
  }, [settings]);

  useEffect(() => {
    writeStoredJson(STORAGE.journal, journal);
  }, [journal]);

  const pollSensors = useCallback(async () => {
    const endpoint = deviceUrl(settings.sensorIp, '/api');
    if (!endpoint) {
      setIsConnected(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        mode: 'cors',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Device returned ' + response.status);
      }

      const payload = await response.json();
      setSensors(normaliseSensors(payload));
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    } finally {
      window.clearTimeout(timer);
    }
  }, [settings.sensorIp]);

  useEffect(() => {
    void pollSensors();
    const interval = window.setInterval(() => void pollSensors(), 3000);
    return () => window.clearInterval(interval);
  }, [pollSensors]);

  const saveSettings = useCallback((nextSettings) => {
    setSettings({
      sensorIp: String(nextSettings.sensorIp || '').trim(),
      cameraIp: String(nextSettings.cameraIp || '').trim(),
    });
  }, []);

  const login = useCallback((nextUser) => {
    const safeUser = {
      id: nextUser?.id || makeId(),
      username: String(nextUser?.username || 'Guest').trim().slice(0, 40) || 'Guest',
      role: 'user',
    };
    setUser(safeUser);
    writeStoredJson(STORAGE.user, safeUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    removeStoredValue(STORAGE.user);
    setActivePage(PAGES.monitor);
  }, []);

  const deleteRecord = useCallback((id) => {
    setJournal((records) => records.filter((record) => record.id !== id));
    setLastResult((record) => (record?.id === id ? null : record));
  }, []);

  const clearJournal = useCallback(() => {
    setJournal([]);
    setLastResult(null);
  }, []);

  const analyseImage = useCallback(
    async (image) => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          language,
          sensorData: sensors
            ? {
                temperature: sensors.temperature,
                humidity: sensors.humidity,
                gas: sensors.gas,
                moisture: soilPercent(sensors),
              }
            : null,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.result) {
        throw new Error(data?.error || copy.analysisError);
      }

      const record = clampRecord({
        ...data.result,
        id: makeId(),
        image,
        createdAt: Date.now(),
        sensorData: sensors
          ? {
              temperature: sensors.temperature,
              humidity: sensors.humidity,
              gas: sensors.gas,
              moisture: soilPercent(sensors),
            }
          : null,
        provider: data.provider,
      });

      setJournal((records) => [record, ...records].slice(0, 50));
      setLastResult(record);
      return record;
    },
    [copy.analysisError, language, sensors],
  );

  if (!user) {
    return <LoginScreen copy={copy} language={language} onLanguageChange={setLanguage} onLogin={login} />;
  }

  return (
    <AppShell
      copy={copy}
      language={language}
      onLanguageChange={setLanguage}
      activePage={activePage}
      onPageChange={setActivePage}
      user={user}
      connected={isConnected}
      onLogout={logout}
    >
      {activePage === PAGES.monitor && (
        <MonitorPage
          copy={copy}
          sensors={sensors}
          connected={isConnected}
          cameraAddress={settings.cameraIp}
          onPageChange={setActivePage}
        />
      )}
      {activePage === PAGES.diagnostics && (
        <DiagnosticsPage
          copy={copy}
          onAnalyse={analyseImage}
          result={lastResult}
          onResultChange={setLastResult}
        />
      )}
      {activePage === PAGES.journal && (
        <JournalPage
          copy={copy}
          language={language}
          records={journal}
          onDelete={deleteRecord}
          onClear={clearJournal}
        />
      )}
      {activePage === PAGES.settings && (
        <SettingsPage
          copy={copy}
          language={language}
          onLanguageChange={setLanguage}
          settings={settings}
          onSave={saveSettings}
          user={user}
          onLogout={logout}
        />
      )}
    </AppShell>
  );
}

function AppShell({
  children,
  copy,
  language,
  onLanguageChange,
  activePage,
  onPageChange,
  user,
  connected,
  onLogout,
}) {
  const navItems = [
    { id: PAGES.monitor, label: copy.monitor, icon: Activity },
    { id: PAGES.diagnostics, label: copy.diagnostics, icon: ScanLine },
    { id: PAGES.journal, label: copy.journal, icon: BookOpen },
    { id: PAGES.settings, label: copy.settings, icon: SettingsIcon },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand brand-sidebar">
          <div className="brand-mark"><Sprout size={27} /></div>
          <div>
            <strong>Smart Dala</strong>
            <span>Agro System v2.5</span>
          </div>
        </div>

        <div className="sidebar-status">
          <span>Device status</span>
          <StatusBadge connected={connected} copy={copy} compact />
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <p>Navigation</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={cx('nav-button', activePage === id && 'active')}
              onClick={() => onPageChange(id)}
            >
              <span className="nav-icon"><Icon size={19} /></span>
              <span>{label}</span>
              {activePage === id && <ChevronRight size={16} className="nav-arrow" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="logout-button" onClick={onLogout}>
            <LogOut size={18} />
            {copy.logout}
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div className="topbar-brand">
            <div className="brand-mark small"><Sprout size={19} /></div>
            <div>
              <strong>Smart Dala</strong>
              <span>{copy.subtitle}</span>
            </div>
          </div>
          <div className="topbar-actions">
            <StatusBadge connected={connected} copy={copy} />
            <div className="user-pill" title={user.username}>
              <span>{user.username.slice(0, 2).toUpperCase()}</span>
              <strong>{user.username}</strong>
            </div>
          </div>
        </header>

        <main className="main-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={cx('mobile-nav-button', activePage === id && 'active')}
            onClick={() => onPageChange(id)}
            aria-label={label}
          >
            <Icon size={21} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="language-utility" aria-label="Language">
        <Languages size={15} />
        {Object.keys(COPY).map((code) => (
          <button
            type="button"
            key={code}
            onClick={() => onLanguageChange(code)}
            className={language === code ? 'active' : ''}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ connected, copy, compact = false }) {
  return (
    <div className={cx('status-badge', connected ? 'online' : 'offline', compact && 'compact')}>
      {connected ? <Wifi size={compact ? 13 : 14} /> : <WifiOff size={compact ? 13 : 14} />}
      <span>{connected ? copy.online : copy.offline}</span>
    </div>
  );
}

function MonitorPage({ copy, sensors, connected, cameraAddress, onPageChange }) {
  const [cameraRefresh, setCameraRefresh] = useState(0);
  const [cameraFailed, setCameraFailed] = useState(false);
  const stream = cameraUrl(cameraAddress, cameraRefresh);
  const soil = soilPercent(sensors);
  const hasSensors = Boolean(sensors);

  useEffect(() => {
    setCameraFailed(false);
  }, [cameraAddress, cameraRefresh]);

  const telemetry = [
    {
      key: 'temperature',
      icon: Thermometer,
      label: copy.temperature,
      value: displayValue(sensors?.temperature, 1),
      unit: '°C',
      tone: 'red',
      trend: hasSensors ? copy.live : copy.noSignal,
    },
    {
      key: 'humidity',
      icon: Droplets,
      label: copy.humidity,
      value: displayValue(sensors?.humidity),
      unit: '%',
      tone: 'cyan',
      trend: hasSensors ? copy.live : copy.noSignal,
    },
    {
      key: 'soil',
      icon: Leaf,
      label: copy.soil,
      value: displayValue(soil),
      unit: '%',
      tone: soil !== null && soil < 30 ? 'amber' : 'green',
      trend: hasSensors ? (soil !== null && soil < 30 ? copy.critical : copy.live) : copy.noSignal,
    },
    {
      key: 'air',
      icon: Wind,
      label: copy.air,
      value: displayValue(sensors?.gas),
      unit: 'ppm',
      tone: sensors?.gas !== null && sensors?.gas > 1000 ? 'amber' : 'teal',
      trend: hasSensors ? copy.live : copy.noSignal,
    },
  ];

  return (
    <section className="page-enter monitor-page">
      <div className="page-heading monitor-heading">
        <div>
          <p className="eyebrow">{copy.monitoring}</p>
          <h1>{copy.dashboardTitle}</h1>
          <p>{copy.dashboardLead}</p>
        </div>
        <div className="heading-metrics">
          <MetricPill label={copy.session} value={new Date().toLocaleTimeString()} />
          <MetricPill label={copy.signal} value={connected ? copy.active : copy.lost} alert={!connected} />
        </div>
      </div>

      <div className="monitor-grid">
        <article className="camera-card">
          <div className="camera-frame">
            {stream && !cameraFailed ? (
              <img
                src={stream}
                alt={copy.cameraFeed}
                onError={() => setCameraFailed(true)}
              />
            ) : (
              <div className="camera-empty">
                <Video size={48} />
                <strong>{copy.noCamera}</strong>
                <span>{copy.cameraHint}</span>
              </div>
            )}
            <div className="camera-overlay">
              <div className="camera-live">
                <i />
                <span>Live</span>
                <b>CAM_01</b>
              </div>
              <button type="button" onClick={() => setCameraRefresh(Date.now())}>
                <RefreshCw size={15} />
                <span>{copy.reconnect}</span>
              </button>
            </div>
          </div>
          <div className="camera-meta">
            <span>IP: {cameraAddress || '—'}</span>
            <span>MJPEG · 30 FPS</span>
          </div>
        </article>

        <article className="ai-core-card">
          <div className="card-title-row">
            <div>
              <span className="section-marker" />
              <h2>{copy.aiCore}</h2>
            </div>
            <span className="active-dot"><i />{copy.active}</span>
          </div>
          <div className="core-actions">
            <button type="button" onClick={() => onPageChange(PAGES.diagnostics)}>
              <ScanLine size={25} />
              {copy.aiScan}
            </button>
            <button type="button" onClick={() => onPageChange(PAGES.settings)}>
              <Droplets size={25} />
              {copy.water}
            </button>
          </div>
          <div className="switch-row">
            <span>{copy.autoIrrigation}</span>
            <i className="switch on"><b /></i>
          </div>
          <div className="switch-row">
            <span>{copy.climateControl}</span>
            <i className="switch"><b /></i>
          </div>
          <div className="secure-row">
            <span className="secure-icon"><ShieldCheck size={20} /></span>
            <div>
              <b>{copy.systemSecure}</b>
              <span>{copy.modulesOnline}</span>
            </div>
            <ChevronRight size={17} />
          </div>
        </article>
      </div>

      <div className="telemetry-section">
        <div className="section-title">
          <span className="section-marker thin" />
          <h2>{copy.telemetry}</h2>
        </div>
        <div className="sensor-grid">
          {telemetry.map((item) => <SensorCard key={item.key} {...item} />)}
        </div>
      </div>

      <div className="lower-monitor-grid">
        <article className="chart-card">
          <div className="card-title-row">
            <div>
              <span className="section-marker" />
              <h2>{copy.chart}</h2>
            </div>
          </div>
          <TelemetryChart sensors={sensors} soil={soil} />
        </article>
        <article className="logs-card">
          <div className="card-title-row">
            <div>
              <span className="section-marker" />
              <h2>{copy.systemLogs}</h2>
            </div>
          </div>
          <SystemLogs connected={connected} />
        </article>
      </div>
    </section>
  );
}

function MetricPill({ label, value, alert }) {
  return (
    <div className={cx('metric-pill', alert && 'alert')}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SensorCard({ icon: Icon, label, value, unit, tone, trend }) {
  return (
    <article className={cx('sensor-card', tone)}>
      <span className="sensor-icon"><Icon size={22} /></span>
      <p>{label}</p>
      <div><strong>{value}</strong><small>{unit}</small></div>
      <footer>
        <span>{trend}</span>
        <ChevronRight size={14} />
      </footer>
    </article>
  );
}

function TelemetryChart({ sensors, soil }) {
  const baseTemperature = sensors?.temperature ?? 0;
  const baseHumidity = sensors?.humidity ?? 0;
  const baseSoil = soil ?? 0;
  const series = [
    { color: '#f87171', values: [baseTemperature - 0.4, baseTemperature - 0.2, baseTemperature] },
    { color: '#22d3ee', values: [baseHumidity - 1, baseHumidity, baseHumidity] },
    { color: '#4ade80', values: [baseSoil - 1, baseSoil, baseSoil] },
  ];
  const max = Math.max(100, ...series.flatMap((item) => item.values));
  const min = Math.min(0, ...series.flatMap((item) => item.values));
  const range = Math.max(max - min, 1);
  const pointsFor = (values) => values.map((value, index) => {
    const x = 38 + index * 248;
    const y = 192 - ((value - min) / range) * 150;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');

  return (
    <div className="telemetry-chart">
      <svg viewBox="0 0 560 225" role="img" aria-label="Three point telemetry trend">
        {[42, 92, 142, 192].map((y) => <line key={y} x1="38" x2="534" y1={y} y2={y} />)}
        {series.map((seriesItem) => (
          <polyline
            key={seriesItem.color}
            fill="none"
            stroke={seriesItem.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsFor(seriesItem.values)}
          />
        ))}
        {['2m', '1m', 'now'].map((label, index) => (
          <text key={label} x={38 + index * 248} y="215">{label}</text>
        ))}
      </svg>
      <div className="chart-legend">
        <span><i className="temperature" />Temp</span>
        <span><i className="humidity" />Hum</span>
        <span><i className="soil" />Soil</span>
      </div>
    </div>
  );
}

function SystemLogs({ connected }) {
  const entries = [
    ['SYS', 'System boot sequence complete'],
    ['SYS', 'Polling ESP telemetry endpoint'],
    [connected ? 'SYS' : 'ERR', connected ? 'Sensor link acknowledged' : 'Sensor link unavailable'],
    ['WARN', 'Auto-irrigation rules ready'],
    ['SYS', 'Camera stream waiting for connection'],
  ];

  return (
    <div className="system-logs">
      {entries.map(([type, text], index) => (
        <div key={text}>
          <time>14:2{index}:0{index + 1}</time>
          <b className={type.toLowerCase()}>{type === 'ERR' ? '×' : '›'}</b>
          <span>{text}</span>
        </div>
      ))}
      <footer>
        <span>Buffer</span>
        <i><b /></i>
        <strong>94%</strong>
      </footer>
    </div>
  );
}

function DiagnosticsPage({ copy, onAnalyse, result, onResultChange }) {
  const [image, setImage] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const video = useRef(null);
  const stream = useRef(null);

  const stopCamera = useCallback(() => {
    stream.current?.getTracks?.().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) {
      video.current.srcObject = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const selectImage = useCallback(async (file) => {
    if (!file) return;
    setError('');
    onResultChange(null);
    try {
      const prepared = await optimizeImageFile(file);
      setImage(prepared);
      stopCamera();
    } catch (caught) {
      setError(caught?.message || copy.imageError);
    }
  }, [copy.imageError, onResultChange, stopCamera]);

  const openCamera = useCallback(async () => {
    setError('');
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      stream.current = media;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (video.current) video.current.srcObject = media;
      }, 0);
    } catch {
      setError(copy.cameraError);
    }
  }, [copy.cameraError]);

  const capture = useCallback(() => {
    try {
      const frame = captureVideoFrame(video.current);
      setImage(frame);
      setError('');
      onResultChange(null);
      stopCamera();
    } catch (caught) {
      setError(caught?.message || copy.cameraError);
    }
  }, [copy.cameraError, onResultChange, stopCamera]);

  const startAnalysis = useCallback(async () => {
    if (!image || isWorking) return;
    setError('');
    setIsWorking(true);
    try {
      await onAnalyse(image);
    } catch (caught) {
      setError(caught?.message || copy.analysisError);
    } finally {
      setIsWorking(false);
    }
  }, [copy.analysisError, image, isWorking, onAnalyse]);

  return (
    <section className="page-enter diagnostics-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Plant vision</p>
          <h1>{copy.diagnosticsTitle}</h1>
          <p>{copy.diagnosticsLead}</p>
        </div>
      </div>

      <div className="diagnostics-grid">
        <article className="diagnostics-card">
          <div className="card-title-row diagnostics-actions">
            <div>
              <span className="section-marker" />
              <h2>{copy.diagnosticsTitle}</h2>
            </div>
            <div className="action-buttons">
              {cameraOpen ? (
                <button type="button" className="button danger" onClick={stopCamera}>
                  <X size={17} />{copy.closeCamera}
                </button>
              ) : (
                <button type="button" className="button dark" onClick={openCamera}>
                  <Camera size={17} />{copy.camera}
                </button>
              )}
              <button type="button" className="button outline" onClick={() => fileInput.current?.click()}>
                <Upload size={17} />{copy.upload}
              </button>
            </div>
          </div>

          <div className="diagnostics-workspace">
            <div className="image-stage">
              {cameraOpen ? (
                <div className="camera-capture">
                  <video ref={video} autoPlay playsInline muted />
                  <button type="button" className="capture-button" onClick={capture} aria-label="Capture photo"><i /></button>
                </div>
              ) : image ? (
                <div className="image-preview">
                  <img src={image} alt="Selected crop" />
                  <button type="button" onClick={() => { setImage(''); onResultChange(null); }} aria-label="Remove image">
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="image-placeholder">
                  <Camera size={48} />
                  <strong>{copy.noImage}</strong>
                  <span>{copy.imageHint}</span>
                </div>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  void selectImage(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </div>

            <div className="diagnostics-side">
              <div className="diagnostics-status">
                <p>System status</p>
                <strong>{image ? copy.ready : copy.chooseImage}</strong>
                {image && <span><CheckCircle2 size={14} />{copy.analysisSaved}</span>}
              </div>
              {error && <div className="inline-error"><AlertCircle size={16} />{error}</div>}
              <button
                type="button"
                className="analyse-button"
                disabled={!image || isWorking}
                onClick={startAnalysis}
              >
                {isWorking ? <LoaderCircle className="spin" size={25} /> : <ScanLine size={25} />}
                {isWorking ? copy.analyzing : copy.analyze}
              </button>
            </div>
          </div>
        </article>
      </div>

      {result && <ResultCard record={result} copy={copy} />}
    </section>
  );
}

function ResultCard({ record, copy }) {
  return (
    <article className={cx('result-card', record.severity.toLowerCase())}>
      <header>
        <div>
          <span className="result-icon"><FlaskConical size={27} /></span>
          <div>
            <p>{copy.result}</p>
            <h2>{statusLabel(record.severity, copy)}</h2>
          </div>
        </div>
        <span className="severity-chip">{record.severity}</span>
      </header>
      <div className="result-facts">
        <ResultFact icon={Leaf} label={copy.crop} value={record.crop} />
        <ResultFact icon={AlertTriangle} label={copy.diagnosis} value={record.diagnosis} />
        <ResultFact icon={FlaskConical} label={copy.treatment} value={record.treatment} wide />
        <ResultFact icon={Droplets} label={copy.irrigation} value={record.irrigation} wide />
      </div>
      <div className="result-report">
        <h3><BookOpen size={17} />{copy.report}</h3>
        <p>{record.report}</p>
      </div>
    </article>
  );
}

function ResultFact({ icon: Icon, label, value, wide = false }) {
  return (
    <div className={cx('result-fact', wide && 'wide')}>
      <span><Icon size={17} /></span>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function JournalPage({ copy, language, records, onDelete, onClear }) {
  const [filter, setFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);
  const filtered = useMemo(
    () => (filter === 'ALL' ? records : records.filter((record) => record.severity === filter)),
    [filter, records],
  );
  const filters = [
    ['ALL', copy.all],
    ['HEALTHY', copy.healthy],
    ['WARNING', copy.warning],
    ['CRITICAL', copy.critical],
  ];

  return (
    <section className="page-enter journal-page">
      <div className="page-heading journal-heading">
        <div>
          <p className="eyebrow">Field history</p>
          <h1>{copy.journal}</h1>
          <p>{copy.report}</p>
        </div>
        <button
          type="button"
          className="button danger subtle"
          disabled={!records.length}
          onClick={() => {
            if (window.confirm(copy.clearConfirm)) onClear();
          }}
        >
          <Trash2 size={17} />{copy.clear}
        </button>
      </div>

      <div className="journal-toolbar">
        <span><History size={15} />{copy.filters}</span>
        <div>
          {filters.map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => setFilter(key)}
              className={cx('filter-button', filter === key && 'active', key.toLowerCase())}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!filtered.length ? (
        <div className="empty-state">
          <FileImage size={52} />
          <h2>{copy.emptyJournal}</h2>
          <p>{copy.emptyJournalHint}</p>
        </div>
      ) : (
        <div className="journal-table-wrap">
          <table className="journal-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{copy.detectedAt}</th>
                <th>{copy.cropType}</th>
                <th>{copy.diagnosisColumn}</th>
                <th>{copy.treatmentColumn}</th>
                <th>{copy.irrigationColumn}</th>
                <th>{copy.severity}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  index={index}
                  copy={copy}
                  language={language}
                  expanded={expanded === record.id}
                  onToggle={() => setExpanded((id) => (id === record.id ? null : record.id))}
                  onDelete={() => onDelete(record.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RecordRow({ record, index, copy, language, expanded, onToggle, onDelete }) {
  return (
    <>
      <tr className="record-row" onClick={onToggle}>
        <td>#{index + 1}</td>
        <td>{formatRecordTime(record, language)}</td>
        <td><span className="crop-cell"><Leaf size={15} />{record.crop}</span></td>
        <td>{record.diagnosis}</td>
        <td><span className="treatment-cell">{record.treatment}</span></td>
        <td>{record.irrigation}</td>
        <td><span className={cx('severity-chip', record.severity.toLowerCase())}>{record.severity}</span></td>
        <td className="table-actions">
          <Eye size={16} />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            aria-label={copy.delete}
          >
            <Trash2 size={15} />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="record-detail-row">
          <td colSpan="8">
            <div className="record-detail">
              {record.image && <img src={record.image} alt={record.crop} />}
              <div>
                {record.sensorData && (
                  <div className="sensor-snapshot">
                    <span><Thermometer size={14} />{displayValue(record.sensorData.temperature, 1)}°C</span>
                    <span><Droplets size={14} />{displayValue(record.sensorData.humidity)}%</span>
                    <span><Leaf size={14} />{displayValue(record.sensorData.moisture)}%</span>
                    <span><Wind size={14} />{displayValue(record.sensorData.gas)} ppm</span>
                  </div>
                )}
                <p>{record.report}</p>
                {record.provider && <small>AI: {record.provider}</small>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SettingsPage({ copy, language, onLanguageChange, settings, onSave, user, onLogout }) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(settings), [settings]);

  const save = () => {
    onSave(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <section className="page-enter settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1>{copy.settings}</h1>
        </div>
      </div>

      <article className="profile-card">
        <div className="profile-avatar">{user.username.slice(0, 2).toUpperCase()}</div>
        <div>
          <h2>{user.username}</h2>
          <p>Smart Dala operator</p>
          <span>ID: {user.id}</span>
        </div>
      </article>

      <article className="settings-card">
        <header><span><Gauge size={19} /></span><div><h2>{copy.deviceSettings}</h2><p>{copy.deviceHint}</p></div></header>
        <div className="settings-form">
          <label>
            <span>{copy.sensorIp}</span>
            <input
              value={draft.sensorIp}
              placeholder="192.168.1.50"
              onChange={(event) => setDraft((value) => ({ ...value, sensorIp: event.target.value }))}
            />
          </label>
          <label>
            <span>{copy.cameraIp}</span>
            <input
              value={draft.cameraIp}
              placeholder="192.168.1.51"
              onChange={(event) => setDraft((value) => ({ ...value, cameraIp: event.target.value }))}
            />
          </label>
          <button type="button" className="button primary wide" onClick={save}>
            {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {saved ? copy.saved : copy.save}
          </button>
        </div>
      </article>

      <article className="settings-card">
        <header><span><Languages size={19} /></span><div><h2>{copy.interfaceLanguage}</h2><p>UZ · RU · EN</p></div></header>
        <div className="language-grid">
          {Object.entries(COPY).map(([code, text]) => (
            <button
              type="button"
              key={code}
              className={language === code ? 'selected' : ''}
              onClick={() => onLanguageChange(code)}
            >
              <b>{code === 'uz' ? '🇺🇿' : code === 'ru' ? '🇷🇺' : '🇬🇧'}</b>
              {text.language}
            </button>
          ))}
        </div>
      </article>

      <article className="settings-card system-info">
        <header><span><Cpu size={19} /></span><div><h2>{copy.systemInfo}</h2><p>Smart Dala v2.5.1</p></div></header>
        <InfoRow icon={Database} label={copy.storage} value={copy.localStorage} />
        <InfoRow icon={ShieldCheck} label={copy.provider} value={copy.serverSide} />
        <InfoRow icon={Activity} label={copy.sensorIp} value={settings.sensorIp ? copy.configured : copy.notConfigured} />
      </article>

      <button type="button" className="logout-large" onClick={onLogout}>
        <LogOut size={19} />{copy.logout}<ChevronRight size={17} />
      </button>
    </section>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="info-row">
      <span><Icon size={18} /></span>
      <div><b>{label}</b><small>{value}</small></div>
      <ChevronRight size={16} />
    </div>
  );
}

function LoginScreen({ copy, language, onLanguageChange, onLogin }) {
  const [registering, setRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const safeName = username.trim();
    if (!safeName || !password) {
      setError(copy.invalidLogin);
      return;
    }

    const users = readStoredJson(STORAGE.users, []);
    const localUsers = Array.isArray(users) ? users : [];
    const passwordHash = await hashLocalPassword(password);

    if (registering) {
      if (localUsers.some((item) => item.username.toLowerCase() === safeName.toLowerCase())) {
        setError(copy.accountExists);
        return;
      }
      writeStoredJson(STORAGE.users, [...localUsers, { username: safeName, passwordHash }]);
      setRegistering(false);
      setPassword('');
      setError(copy.accountCreated);
      return;
    }

    const match = localUsers.find((item) => item.username === safeName && item.passwordHash === passwordHash);
    if (!match) {
      setError(copy.invalidLogin);
      return;
    }
    onLogin({ id: makeId(), username: match.username });
  };

  return (
    <main className="login-screen">
      <div className="login-glow one" />
      <div className="login-glow two" />
      <div className="login-card">
        <div className="login-brand">
          <span><Sprout size={43} /></span>
          <h1>Agro Core</h1>
          <p>{copy.subtitle}</p>
        </div>
        <form onSubmit={submit}>
          <h2>{registering ? copy.register : copy.login}</h2>
          <label><UserRound size={18} /><input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={copy.username} /></label>
          <label><ShieldCheck size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={copy.password} /></label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit">{registering ? copy.register : copy.login}<ChevronRight size={18} /></button>
          {!registering && (
            <button type="button" className="guest-button" onClick={() => onLogin(DEFAULT_USER)}>
              {copy.guest}
            </button>
          )}
          <button type="button" className="login-switch" onClick={() => { setRegistering((value) => !value); setError(''); }}>
            {registering ? copy.hasAccount : copy.noAccount}
          </button>
        </form>
        <p className="local-note">{copy.localOnly}</p>
        <div className="login-languages">
          {Object.keys(COPY).map((code) => (
            <button type="button" key={code} className={language === code ? 'active' : ''} onClick={() => onLanguageChange(code)}>
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
