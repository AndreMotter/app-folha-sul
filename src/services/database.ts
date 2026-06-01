import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

export type HistoryItem = {
  id: string;
  date: string;
  disease: string;
  confidence: string;
  recommendation: string;
  image: string | null;
  latitude?: number;
  longitude?: number;
};

type DbRow = {
  id: number;
  date: string;
  disease: string;
  confidence: string;
  recommendation: string;
  imageUri: string | null;
  latitude: number | null;
  longitude: number | null;
};

let db: SQLite.SQLiteDatabase | null = null;

async function ensureDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('folhasul.db');
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        disease TEXT NOT NULL,
        confidence TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        imageUri TEXT,
        latitude REAL,
        longitude REAL
      )`
    );
  }
  return db;
}

function ensureFilePrefix(uri: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith('file://') || uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  return 'file://' + uri;
}

function mapRow(row: DbRow): HistoryItem {
  return {
    id: String(row.id),
    date: formatDisplayDate(row.date),
    disease: row.disease,
    confidence: row.confidence,
    recommendation: row.recommendation,
    image: ensureFilePrefix(row.imageUri),
    ...(row.latitude != null && { latitude: row.latitude }),
    ...(row.longitude != null && { longitude: row.longitude }),
  };
}

function formatDisplayDate(value: string): string {
  const date = new Date(value);

  const today = new Date();
  const isSameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isSameDay) {
    return `Hoje ${time}`;
  }

  const day = date.toLocaleDateString('pt-BR');
  return `${day} ${time}`;
}

export async function copyImageToPermanent(uri: string): Promise<string> {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) return uri;

  const dir = docDir + 'images/';
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const ext = uri.split('.').pop();
  const safeExt = ext && ext.length <= 5 ? ext : 'jpg';
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const dest = dir + filename;

  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
  } catch {
    const response = await fetch(uri);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    await FileSystem.writeAsStringAsync(dest, base64, { encoding: 'base64' });
  }

  return dest;
}

export async function saveAnalysis(
  data: Omit<HistoryItem, 'id'>
): Promise<HistoryItem> {
  const database = await ensureDb();

  const result = await database.runAsync(
    `INSERT INTO analyses (date, disease, confidence, recommendation, imageUri, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      new Date().toISOString(),
      data.disease,
      data.confidence,
      data.recommendation,
      data.image,
      data.latitude ?? null,
      data.longitude ?? null,
    ]
  );

  const row = await database.getFirstAsync<DbRow>(
    `SELECT * FROM analyses WHERE id = ?`,
    [result.lastInsertRowId]
  );

  if (!row) throw new Error('Failed to retrieve saved analysis');
  return mapRow(row);
}

export async function fetchAllAnalyses(): Promise<HistoryItem[]> {
  const database = await ensureDb();
  const rows = await database.getAllAsync<DbRow>(
    `SELECT * FROM analyses ORDER BY id DESC`
  );
  return rows.map(mapRow);
}

export async function deleteAnalysis(id: string): Promise<void> {
  const database = await ensureDb();
  await database.runAsync(`DELETE FROM analyses WHERE id = ?`, [Number(id)]);
}
