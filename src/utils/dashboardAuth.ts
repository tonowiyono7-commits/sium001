export type UserRole = 'admin' | 'user';

export interface DashboardUserSession {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
  isPrimaryAdmin: boolean;
  loggedInAt: string;
  remembered: boolean;
}

export interface LocalAccountEntry {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
  active: boolean;
  isPrimaryAdmin: boolean;
  isDefaultPassword: boolean;
  updatedAtIso: string;
}

interface StoredAccountRecord extends LocalAccountEntry {
  passwordHash: string;
}

interface StoredAccountsDirectory {
  version: 2;
  accounts: StoredAccountRecord[];
}

const LEGACY_AUTH_CONFIG_KEY = 'piket_dashboard_auth_v1';
const ACCOUNTS_STORAGE_KEY = 'piket_offline_accounts_v2';
const SESSION_STORAGE_KEY = 'piket_dashboard_session_v2';
const LEGACY_SESSION_KEY = 'piket_dashboard_session_v1';

export const PRIMARY_ADMIN_ID = 'acc_primary_admin';
export const DEFAULT_LOGIN_USERNAME = 'admin';
export const DEFAULT_LOGIN_PASSWORD = 'piket2026';

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function fallbackHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    'fb_' +
    (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0')
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salted = `sium_salt_2026::${password}`;
  try {
    if (
      typeof crypto !== 'undefined' &&
      crypto.subtle &&
      typeof TextEncoder !== 'undefined'
    ) {
      const data = new TextEncoder().encode(salted);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const bytes = Array.from(new Uint8Array(digest));
      return (
        'sha256_' + bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
      );
    }
  } catch {
    // Fallback to deterministic local hash if subtle crypto is unavailable
  }
  return fallbackHash(salted);
}

async function verifyPasswordHash(
  plainInput: string,
  storedHash: string,
  isDefaultPassword: boolean
): Promise<boolean> {
  const sha = await hashPassword(plainInput);
  const fb = fallbackHash(`sium_salt_2026::${plainInput}`);
  return (
    sha === storedHash ||
    fb === storedHash ||
    (isDefaultPassword && plainInput === DEFAULT_LOGIN_PASSWORD)
  );
}

async function createDefaultPrimaryAdmin(): Promise<StoredAccountRecord> {
  return {
    id: PRIMARY_ADMIN_ID,
    username: DEFAULT_LOGIN_USERNAME,
    displayName: 'Admin Utama SIUM',
    role: 'admin',
    roleLabel: 'Administrator Utama',
    active: true,
    isPrimaryAdmin: true,
    isDefaultPassword: true,
    passwordHash: await hashPassword(DEFAULT_LOGIN_PASSWORD),
    updatedAtIso: new Date().toISOString(),
  };
}

async function loadDirectory(): Promise<StoredAccountsDirectory> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAccountsDirectory;
      if (
        parsed &&
        parsed.version === 2 &&
        Array.isArray(parsed.accounts) &&
        parsed.accounts.length > 0
      ) {
        const hasPrimary = parsed.accounts.some(
          (a) => a.isPrimaryAdmin || a.id === PRIMARY_ADMIN_ID
        );
        if (hasPrimary) {
          return parsed;
        }
      }
    }

    // Migrate v1 single-admin config if it exists
    const legacyRaw = localStorage.getItem(LEGACY_AUTH_CONFIG_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as {
        username?: string;
        displayName?: string;
        roleLabel?: string;
        passwordHash?: string;
        isDefaultPassword?: boolean;
        updatedAt?: string;
      };
      if (legacy?.username && legacy?.passwordHash) {
        const migrated: StoredAccountsDirectory = {
          version: 2,
          accounts: [
            {
              id: PRIMARY_ADMIN_ID,
              username: normalizeUsername(legacy.username),
              displayName: legacy.displayName?.trim() || 'Admin Utama SIUM',
              role: 'admin',
              roleLabel: legacy.roleLabel?.trim() || 'Administrator Utama',
              active: true,
              isPrimaryAdmin: true,
              isDefaultPassword: Boolean(legacy.isDefaultPassword),
              passwordHash: legacy.passwordHash,
              updatedAtIso: legacy.updatedAt || new Date().toISOString(),
            },
          ],
        };
        saveDirectory(migrated);
        return migrated;
      }
    }
  } catch {
    // Abaikan error storage
  }

  const primary = await createDefaultPrimaryAdmin();
  const initialDir: StoredAccountsDirectory = {
    version: 2,
    accounts: [primary],
  };
  saveDirectory(initialDir);
  return initialDir;
}

function saveDirectory(dir: StoredAccountsDirectory): boolean {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(dir));
    return true;
  } catch {
    return false;
  }
}

function toPublicEntry(record: StoredAccountRecord): LocalAccountEntry {
  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    role: record.role,
    roleLabel: record.roleLabel,
    active: record.active,
    isPrimaryAdmin: record.isPrimaryAdmin,
    isDefaultPassword: record.isDefaultPassword,
    updatedAtIso: record.updatedAtIso,
  };
}

function recordToSession(
  record: StoredAccountRecord,
  remembered: boolean
): DashboardUserSession {
  return {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    role: record.role,
    roleLabel: record.roleLabel,
    isPrimaryAdmin: record.isPrimaryAdmin,
    loggedInAt: new Date().toISOString(),
    remembered,
  };
}

export function getActiveSession(): DashboardUserSession | null {
  try {
    const sessionRaw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as DashboardUserSession;
      if (parsed?.username && parsed?.id) return parsed;
    }
    const localRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as DashboardUserSession;
      if (parsed?.username && parsed?.id) return parsed;
    }
  } catch {
    // Abaikan error storage
  }
  return null;
}

function saveSession(session: DashboardUserSession): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    const payload = JSON.stringify(session);
    if (session.remembered) {
      localStorage.setItem(SESSION_STORAGE_KEY, payload);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, payload);
    }
  } catch {
    // Abaikan error kuota
  }
}

export function logoutSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // Abaikan error
  }
}

export async function isPrimaryAdminDefaultCredentials(): Promise<boolean> {
  const dir = await loadDirectory();
  const primary = dir.accounts.find(
    (a) => a.isPrimaryAdmin || a.id === PRIMARY_ADMIN_ID
  );
  if (!primary) return true;
  return (
    primary.isDefaultPassword &&
    normalizeUsername(primary.username) === DEFAULT_LOGIN_USERNAME
  );
}

export async function verifyLogin(
  usernameInput: string,
  passwordInput: string,
  remember: boolean
): Promise<
  | { ok: true; session: DashboardUserSession }
  | { ok: false; error: string }
> {
  const cleanUsername = normalizeUsername(usernameInput);
  if (!cleanUsername || !passwordInput) {
    return {
      ok: false,
      error: 'Masukkan username dan kata sandi terlebih dahulu.',
    };
  }

  const dir = await loadDirectory();
  const match = dir.accounts.find(
    (a) => normalizeUsername(a.username) === cleanUsername
  );

  if (!match) {
    return {
      ok: false,
      error: 'Username atau kata sandi tidak sesuai.',
    };
  }

  const passwordValid = await verifyPasswordHash(
    passwordInput,
    match.passwordHash,
    match.isDefaultPassword
  );

  if (!passwordValid) {
    return {
      ok: false,
      error: 'Username atau kata sandi tidak sesuai.',
    };
  }

  if (!match.active && !match.isPrimaryAdmin) {
    return {
      ok: false,
      error:
        'Akun ini sedang dinonaktifkan oleh Admin. Hubungi Admin perangkat ini.',
    };
  }

  const session = recordToSession(match, remember);
  saveSession(session);
  return { ok: true, session };
}

export async function quickLoginDefaultAdmin(
  remember: boolean
): Promise<
  | { ok: true; session: DashboardUserSession }
  | { ok: false; error: string }
> {
  const isDefault = await isPrimaryAdminDefaultCredentials();
  if (!isDefault) {
    return {
      ok: false,
      error:
        'Kredensial default sudah diubah. Silakan masuk menggunakan username dan kata sandi Anda.',
    };
  }
  return verifyLogin(DEFAULT_LOGIN_USERNAME, DEFAULT_LOGIN_PASSWORD, remember);
}

export async function getLocalAccountDirectory(): Promise<LocalAccountEntry[]> {
  const dir = await loadDirectory();
  return dir.accounts.map(toPublicEntry).sort((a, b) => {
    if (a.isPrimaryAdmin) return -1;
    if (b.isPrimaryAdmin) return 1;
    if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, 'id');
  });
}

export async function updateOwnProfileAndPassword(params: {
  accountId: string;
  currentPassword: string;
  newUsername: string;
  newDisplayName: string;
  newRoleLabel: string;
  newPassword?: string;
  remembered: boolean;
}): Promise<
  | { ok: true; session: DashboardUserSession }
  | { ok: false; error: string }
> {
  const dir = await loadDirectory();
  const idx = dir.accounts.findIndex((a) => a.id === params.accountId);
  if (idx === -1) {
    return { ok: false, error: 'Akun aktif tidak ditemukan di perangkat.' };
  }

  const current = dir.accounts[idx];
  const currentValid = await verifyPasswordHash(
    params.currentPassword,
    current.passwordHash,
    current.isDefaultPassword
  );
  if (!currentValid) {
    return {
      ok: false,
      error: 'Kata sandi saat ini salah. Perubahan dibatalkan.',
    };
  }

  const cleanUsername = normalizeUsername(params.newUsername);
  const cleanDisplayName = params.newDisplayName.trim().slice(0, 100);
  const cleanRoleLabel =
    params.newRoleLabel.trim().slice(0, 80) || current.roleLabel;

  if (cleanUsername.length < 3 || !/^[a-z0-9._-]+$/.test(cleanUsername)) {
    return {
      ok: false,
      error:
        'Username minimal 3 karakter (huruf, angka, titik, garis bawah, atau tanda hubung).',
    };
  }

  if (!cleanDisplayName) {
    return { ok: false, error: 'Nama tampilan tidak boleh kosong.' };
  }

  const duplicate = dir.accounts.some(
    (a) =>
      a.id !== current.id && normalizeUsername(a.username) === cleanUsername
  );
  if (duplicate) {
    return { ok: false, error: `Username "${cleanUsername}" sudah dipakai.` };
  }

  if (params.newPassword && params.newPassword.length < 6) {
    return { ok: false, error: 'Kata sandi baru minimal 6 karakter.' };
  }

  const nextHash = params.newPassword
    ? await hashPassword(params.newPassword)
    : current.passwordHash;
  const nextIsDefault = current.isPrimaryAdmin
    ? params.newPassword
      ? params.newPassword === DEFAULT_LOGIN_PASSWORD &&
        cleanUsername === DEFAULT_LOGIN_USERNAME
      : current.isDefaultPassword && cleanUsername === DEFAULT_LOGIN_USERNAME
    : false;

  const updated: StoredAccountRecord = {
    ...current,
    username: cleanUsername,
    displayName: cleanDisplayName,
    roleLabel: cleanRoleLabel,
    passwordHash: nextHash,
    isDefaultPassword: nextIsDefault,
    updatedAtIso: new Date().toISOString(),
  };

  dir.accounts[idx] = updated;
  if (!saveDirectory(dir)) {
    return {
      ok: false,
      error: 'Gagal menyimpan perubahan akun ke penyimpanan lokal.',
    };
  }

  const nextSession = recordToSession(updated, params.remembered);
  saveSession(nextSession);
  return { ok: true, session: nextSession };
}

export async function upsertLocalAccountMember(params: {
  editId?: string | null;
  username: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
  active: boolean;
  password?: string;
}): Promise<LocalAccountEntry> {
  const cleanUsername = normalizeUsername(params.username);
  if (cleanUsername.length < 3 || !/^[a-z0-9._-]+$/.test(cleanUsername)) {
    throw new Error(
      'Username minimal 3 karakter (huruf, angka, titik, garis bawah, atau tanda hubung).'
    );
  }

  const cleanDisplayName = params.displayName.trim().slice(0, 100);
  if (!cleanDisplayName) {
    throw new Error('Nama tampilan tidak boleh kosong.');
  }

  const cleanRoleLabel =
    params.roleLabel.trim().slice(0, 80) ||
    (params.role === 'admin' ? 'Administrator Jadwal' : 'User Operasional');

  const dir = await loadDirectory();
  const existingIdx = params.editId
    ? dir.accounts.findIndex((a) => a.id === params.editId)
    : -1;

  const duplicate = dir.accounts.some(
    (a) =>
      a.id !== (params.editId ?? '') &&
      normalizeUsername(a.username) === cleanUsername
  );
  if (duplicate) {
    throw new Error(`Username "${cleanUsername}" sudah terdaftar.`);
  }

  if (existingIdx !== -1) {
    const existing = dir.accounts[existingIdx];
    if (params.password && params.password.length < 6) {
      throw new Error('Kata sandi baru minimal 6 karakter.');
    }
    const nextHash = params.password
      ? await hashPassword(params.password)
      : existing.passwordHash;
    const isPrimary = existing.isPrimaryAdmin;
    const nextRecord: StoredAccountRecord = {
      ...existing,
      username: cleanUsername,
      displayName: cleanDisplayName,
      role: isPrimary ? 'admin' : params.role,
      roleLabel: cleanRoleLabel,
      active: isPrimary ? true : params.active,
      passwordHash: nextHash,
      isDefaultPassword: isPrimary
        ? params.password
          ? params.password === DEFAULT_LOGIN_PASSWORD &&
            cleanUsername === DEFAULT_LOGIN_USERNAME
          : existing.isDefaultPassword &&
            cleanUsername === DEFAULT_LOGIN_USERNAME
        : false,
      updatedAtIso: new Date().toISOString(),
    };
    dir.accounts[existingIdx] = nextRecord;
    if (!saveDirectory(dir)) {
      throw new Error('Gagal menyimpan akun ke penyimpanan lokal.');
    }
    return toPublicEntry(nextRecord);
  }

  if (!params.password || params.password.length < 6) {
    throw new Error('Kata sandi akun baru minimal 6 karakter.');
  }
  if (dir.accounts.length >= 200) {
    throw new Error('Batas maksimum 200 akun lokal telah tercapai.');
  }

  const newRecord: StoredAccountRecord = {
    id: `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    username: cleanUsername,
    displayName: cleanDisplayName,
    role: params.role,
    roleLabel: cleanRoleLabel,
    active: params.active,
    isPrimaryAdmin: false,
    isDefaultPassword: false,
    passwordHash: await hashPassword(params.password),
    updatedAtIso: new Date().toISOString(),
  };

  dir.accounts.push(newRecord);
  if (!saveDirectory(dir)) {
    throw new Error('Gagal menyimpan akun ke penyimpanan lokal.');
  }
  return toPublicEntry(newRecord);
}

export async function deleteLocalAccountMember(id: string): Promise<void> {
  const dir = await loadDirectory();
  const target = dir.accounts.find((a) => a.id === id);
  if (!target) return;
  if (target.isPrimaryAdmin || target.id === PRIMARY_ADMIN_ID) {
    throw new Error('Akun Admin Utama tidak dapat dihapus.');
  }
  dir.accounts = dir.accounts.filter((a) => a.id !== id);
  if (!saveDirectory(dir)) {
    throw new Error('Gagal menghapus akun dari penyimpanan lokal.');
  }
}

export async function resetPrimaryAdminToDefault(): Promise<void> {
  const dir = await loadDirectory();
  const primary = await createDefaultPrimaryAdmin();
  const others = dir.accounts.filter(
    (a) => !a.isPrimaryAdmin && a.id !== PRIMARY_ADMIN_ID
  );
  saveDirectory({
    version: 2,
    accounts: [primary, ...others],
  });
}
