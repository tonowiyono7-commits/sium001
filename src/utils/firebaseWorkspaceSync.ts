import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  PawasAnchor,
  Personnel,
  RosterOrgHeader,
  ShiftOverrides,
  UnitKey,
} from '../types/polriRoster';

export interface CloudRosterConfigData {
  header: RosterOrgHeader;
  personnel: Personnel[];
  unitOrder: UnitKey[];
  pawasAnchor: PawasAnchor;
  lastBackupAt: string;
}

export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

async function saveWorkspaceDoc(
  docId: string,
  payload: Record<string, unknown>,
  uid: string,
  knownExists?: boolean
): Promise<void> {
  const path = `workspace/${docId}`;
  const ref = doc(db, 'workspace', docId);
  const cleanPayload = stripUndefinedDeep(payload);

  let exists = knownExists;
  if (exists === undefined) {
    try {
      const snap = await getDoc(ref);
      exists = snap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }

  if (exists) {
    try {
      await updateDoc(ref, {
        ...cleanPayload,
        updatedAt: serverTimestamp(),
        updatedByUid: uid,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    try {
      await setDoc(ref, {
        ...cleanPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdByUid: uid,
        updatedByUid: uid,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export function subscribeRosterConfig(
  onData: (data: CloudRosterConfigData | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'workspace/roster_config';
  const ref = doc(db, 'workspace', 'roster_config');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      if (d && d.header && Array.isArray(d.personnel)) {
        onData({
          header: d.header as RosterOrgHeader,
          personnel: d.personnel as Personnel[],
          unitOrder: Array.isArray(d.unitOrder)
            ? (d.unitOrder as UnitKey[])
            : [],
          pawasAnchor: d.pawasAnchor as PawasAnchor,
          lastBackupAt:
            typeof d.lastBackupAt === 'string' ? d.lastBackupAt : '',
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError) onError(wrapped);
      }
    }
  );
}

export async function saveRosterConfigToCloud(
  data: CloudRosterConfigData,
  uid: string,
  knownExists?: boolean
): Promise<void> {
  await saveWorkspaceDoc(
    'roster_config',
    {
      header: data.header,
      personnel: data.personnel.slice(0, 500),
      unitOrder: data.unitOrder.slice(0, 30),
      pawasAnchor: data.pawasAnchor,
      lastBackupAt: (data.lastBackupAt || '').slice(0, 64),
    },
    uid,
    knownExists
  );
}

export function subscribeRosterOverrides(
  onData: (overrides: ShiftOverrides | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'workspace/roster_overrides';
  const ref = doc(db, 'workspace', 'roster_overrides');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      onData((d?.overrides as ShiftOverrides) ?? {});
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError) onError(wrapped);
      }
    }
  );
}

export async function saveRosterOverridesToCloud(
  overrides: ShiftOverrides,
  uid: string,
  knownExists?: boolean
): Promise<void> {
  await saveWorkspaceDoc(
    'roster_overrides',
    { overrides },
    uid,
    knownExists
  );
}

export function subscribeOperationalDoc<T extends Record<string, unknown>>(
  docId: 'rengiat_state' | 'pam_state' | 'surat_state',
  onData: (data: T | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = `workspace/${docId}`;
  const ref = doc(db, 'workspace', docId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData(snap.data() as T);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError) onError(wrapped);
      }
    }
  );
}

export async function saveOperationalDoc(
  docId: 'rengiat_state' | 'pam_state' | 'surat_state',
  payload: Record<string, unknown>,
  uid: string,
  knownExists?: boolean
): Promise<void> {
  await saveWorkspaceDoc(docId, payload, uid, knownExists);
}
