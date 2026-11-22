import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';

export type UserRole = 'admin' | 'user';

export interface DashboardUserSession {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
  isPrimaryAdmin: boolean;
  photoURL?: string;
  loggedInAt: string;
}

export interface AccountDirectoryEntry {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
  active: boolean;
  updatedAtIso?: string;
}

export type AuthResolutionResult =
  | { status: 'signed_out' }
  | { status: 'unverified'; email: string }
  | { status: 'unregistered'; email: string; displayName: string }
  | { status: 'disabled'; email: string; displayName: string }
  | { status: 'authorized'; session: DashboardUserSession };

export const PRIMARY_ADMIN_EMAIL = 'alimahfud5@gmail.com';
const DIRECTORY_DOC_PATH = 'workspace_admin/account_directory';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailToAccountId(email: string): string {
  return normalizeEmail(email).replace(/[^a-z0-9]/g, '_');
}

export function isValidEmailFormat(email: string): boolean {
  const clean = normalizeEmail(email);
  return (
    clean.length >= 5 &&
    clean.length <= 120 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)
  );
}

export function subscribeFirebaseAuth(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogleAccount(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

async function ensurePrimaryAdminBootstrapped(
  firebaseUser: User,
  displayName: string,
  roleLabel: string
): Promise<void> {
  const accountId = emailToAccountId(PRIMARY_ADMIN_EMAIL);
  const accountPath = `accounts/${accountId}`;
  const accountRef = doc(db, 'accounts', accountId);
  const dirRef = doc(db, 'workspace_admin', 'account_directory');

  let accountSnap;
  try {
    accountSnap = await getDoc(accountRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, accountPath);
  }

  let dirSnap;
  try {
    dirSnap = await getDoc(dirRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, DIRECTORY_DOC_PATH);
  }

  if (accountSnap.exists() && dirSnap.exists()) {
    return;
  }

  const batch = writeBatch(db);
  const safeDisplayName =
    displayName.trim().slice(0, 100) || 'Admin Utama SIUM';
  const safeRoleLabel = roleLabel.trim().slice(0, 80) || 'Administrator Jadwal';

  if (!accountSnap.exists()) {
    batch.set(accountRef, {
      email: PRIMARY_ADMIN_EMAIL,
      displayName: safeDisplayName,
      role: 'admin',
      roleLabel: safeRoleLabel,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: firebaseUser.uid,
      updatedByUid: firebaseUser.uid,
    });
  }

  const existingItems: AccountDirectoryEntry[] =
    dirSnap.exists() && Array.isArray(dirSnap.data().items)
      ? (dirSnap.data().items as AccountDirectoryEntry[])
      : [];
  const hasPrimaryInDir = existingItems.some(
    (item) => item.id === accountId
  );
  const nextItems: AccountDirectoryEntry[] = hasPrimaryInDir
    ? existingItems
    : [
        {
          id: accountId,
          email: PRIMARY_ADMIN_EMAIL,
          displayName: safeDisplayName,
          role: 'admin',
          roleLabel: safeRoleLabel,
          active: true,
          updatedAtIso: new Date().toISOString(),
        },
        ...existingItems,
      ];

  if (!dirSnap.exists()) {
    batch.set(dirRef, {
      items: nextItems,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: firebaseUser.uid,
      updatedByUid: firebaseUser.uid,
    });
  } else if (!hasPrimaryInDir) {
    batch.update(dirRef, {
      items: nextItems,
      updatedAt: serverTimestamp(),
      updatedByUid: firebaseUser.uid,
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, DIRECTORY_DOC_PATH);
  }
}

export async function resolveUserRoleAndSession(
  firebaseUser: User | null
): Promise<AuthResolutionResult> {
  if (!firebaseUser) {
    return { status: 'signed_out' };
  }

  const rawEmail = firebaseUser.email ?? '';
  const email = normalizeEmail(rawEmail);
  const fallbackName =
    firebaseUser.displayName?.trim() || email.split('@')[0] || 'Operator';

  if (!email || !firebaseUser.emailVerified) {
    return { status: 'unverified', email };
  }

  const accountId = emailToAccountId(email);
  const accountPath = `accounts/${accountId}`;
  const accountRef = doc(db, 'accounts', accountId);

  let snap;
  try {
    snap = await getDoc(accountRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, accountPath);
  }

  const isPrimary = email === PRIMARY_ADMIN_EMAIL;

  if (isPrimary) {
    const data = snap.exists() ? snap.data() : null;
    const displayName =
      typeof data?.displayName === 'string' && data.displayName.trim()
        ? data.displayName.trim()
        : fallbackName;
    const roleLabel =
      typeof data?.roleLabel === 'string' && data.roleLabel.trim()
        ? data.roleLabel.trim()
        : 'Administrator Utama';

    await ensurePrimaryAdminBootstrapped(firebaseUser, displayName, roleLabel);

    return {
      status: 'authorized',
      session: {
        uid: firebaseUser.uid,
        email,
        username: email.split('@')[0] || 'admin',
        displayName,
        role: 'admin',
        roleLabel,
        isPrimaryAdmin: true,
        photoURL: firebaseUser.photoURL ?? undefined,
        loggedInAt: new Date().toISOString(),
      },
    };
  }

  if (!snap.exists()) {
    return {
      status: 'unregistered',
      email,
      displayName: fallbackName,
    };
  }

  const data = snap.data();
  if (data.active !== true) {
    return {
      status: 'disabled',
      email,
      displayName:
        typeof data.displayName === 'string' && data.displayName.trim()
          ? data.displayName.trim()
          : fallbackName,
    };
  }

  const role: UserRole = data.role === 'admin' ? 'admin' : 'user';
  const displayName =
    typeof data.displayName === 'string' && data.displayName.trim()
      ? data.displayName.trim()
      : fallbackName;
  const roleLabel =
    typeof data.roleLabel === 'string' && data.roleLabel.trim()
      ? data.roleLabel.trim()
      : role === 'admin'
        ? 'Administrator Jadwal'
        : 'User Operasional';

  return {
    status: 'authorized',
    session: {
      uid: firebaseUser.uid,
      email,
      username: email.split('@')[0] || 'user',
      displayName,
      role,
      roleLabel,
      isPrimaryAdmin: false,
      photoURL: firebaseUser.photoURL ?? undefined,
      loggedInAt: new Date().toISOString(),
    },
  };
}

export function subscribeAccountDirectory(
  onData: (entries: AccountDirectoryEntry[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const dirRef = doc(db, 'workspace_admin', 'account_directory');
  return onSnapshot(
    dirRef,
    (snap) => {
      if (!snap.exists()) {
        onData([]);
        return;
      }
      const rawItems = snap.data().items;
      if (Array.isArray(rawItems)) {
        onData(rawItems as AccountDirectoryEntry[]);
      } else {
        onData([]);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, DIRECTORY_DOC_PATH);
      } catch (wrapped) {
        if (onError) onError(wrapped);
      }
    }
  );
}

export async function upsertAccountMember(params: {
  adminUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  roleLabel: string;
  active: boolean;
}): Promise<void> {
  const cleanEmail = normalizeEmail(params.email);
  if (!isValidEmailFormat(cleanEmail)) {
    throw new Error('Format alamat email Google tidak valid.');
  }

  const cleanDisplayName = params.displayName.trim().slice(0, 100);
  if (!cleanDisplayName) {
    throw new Error('Nama tampilan tidak boleh kosong.');
  }

  const cleanRoleLabel =
    params.roleLabel.trim().slice(0, 80) ||
    (params.role === 'admin' ? 'Administrator Jadwal' : 'User Operasional');

  const accountId = emailToAccountId(cleanEmail);
  const safeRole: UserRole =
    cleanEmail === PRIMARY_ADMIN_EMAIL ? 'admin' : params.role;
  const safeActive = cleanEmail === PRIMARY_ADMIN_EMAIL ? true : params.active;

  const accountPath = `accounts/${accountId}`;
  const accountRef = doc(db, 'accounts', accountId);
  const dirRef = doc(db, 'workspace_admin', 'account_directory');

  let accountSnap;
  try {
    accountSnap = await getDoc(accountRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, accountPath);
  }

  let dirSnap;
  try {
    dirSnap = await getDoc(dirRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, DIRECTORY_DOC_PATH);
  }

  const existingItems: AccountDirectoryEntry[] =
    dirSnap.exists() && Array.isArray(dirSnap.data().items)
      ? (dirSnap.data().items as AccountDirectoryEntry[])
      : [];

  const nextEntry: AccountDirectoryEntry = {
    id: accountId,
    email: cleanEmail,
    displayName: cleanDisplayName,
    role: safeRole,
    roleLabel: cleanRoleLabel,
    active: safeActive,
    updatedAtIso: new Date().toISOString(),
  };

  const filtered = existingItems.filter((item) => item.id !== accountId);
  const nextItems = [...filtered, nextEntry].sort((a, b) => {
    if (a.email === PRIMARY_ADMIN_EMAIL) return -1;
    if (b.email === PRIMARY_ADMIN_EMAIL) return 1;
    if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, 'id');
  });

  if (nextItems.length > 200) {
    throw new Error('Batas maksimum 200 akun terdaftar telah tercapai.');
  }

  const batch = writeBatch(db);
  if (accountSnap.exists()) {
    batch.update(accountRef, {
      displayName: cleanDisplayName,
      role: safeRole,
      roleLabel: cleanRoleLabel,
      active: safeActive,
      updatedAt: serverTimestamp(),
      updatedByUid: params.adminUid,
    });
  } else {
    batch.set(accountRef, {
      email: cleanEmail,
      displayName: cleanDisplayName,
      role: safeRole,
      roleLabel: cleanRoleLabel,
      active: safeActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: params.adminUid,
      updatedByUid: params.adminUid,
    });
  }

  if (dirSnap.exists()) {
    batch.update(dirRef, {
      items: nextItems,
      updatedAt: serverTimestamp(),
      updatedByUid: params.adminUid,
    });
  } else {
    batch.set(dirRef, {
      items: nextItems,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: params.adminUid,
      updatedByUid: params.adminUid,
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, accountPath);
  }
}

export async function deleteAccountMember(
  adminUid: string,
  email: string
): Promise<void> {
  const cleanEmail = normalizeEmail(email);
  if (cleanEmail === PRIMARY_ADMIN_EMAIL) {
    throw new Error('Akun Admin Utama tidak dapat dihapus.');
  }

  const accountId = emailToAccountId(cleanEmail);
  const accountPath = `accounts/${accountId}`;
  const accountRef = doc(db, 'accounts', accountId);
  const dirRef = doc(db, 'workspace_admin', 'account_directory');

  let dirSnap;
  try {
    dirSnap = await getDoc(dirRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, DIRECTORY_DOC_PATH);
  }

  const existingItems: AccountDirectoryEntry[] =
    dirSnap.exists() && Array.isArray(dirSnap.data().items)
      ? (dirSnap.data().items as AccountDirectoryEntry[])
      : [];
  const nextItems = existingItems.filter((item) => item.id !== accountId);

  const batch = writeBatch(db);
  batch.delete(accountRef);
  if (dirSnap.exists()) {
    batch.update(dirRef, {
      items: nextItems,
      updatedAt: serverTimestamp(),
      updatedByUid: adminUid,
    });
  } else {
    await setDoc(dirRef, {
      items: nextItems,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdByUid: adminUid,
      updatedByUid: adminUid,
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, accountPath);
  }
}
