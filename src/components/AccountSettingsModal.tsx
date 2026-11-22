import { FormEvent, useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Edit3,
  KeyRound,
  LogOut,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  DashboardUserSession,
  deleteLocalAccountMember,
  getLocalAccountDirectory,
  LocalAccountEntry,
  PRIMARY_ADMIN_ID,
  updateOwnProfileAndPassword,
  upsertLocalAccountMember,
  UserRole,
} from '../utils/dashboardAuth';

interface AccountSettingsModalProps {
  session: DashboardUserSession;
  onSessionUpdated: (nextSession: DashboardUserSession) => void;
  onClose: () => void;
  onLogout: () => void;
  onNotice: (message: string) => void;
}

export function AccountSettingsModal({
  session,
  onSessionUpdated,
  onClose,
  onLogout,
  onNotice,
}: AccountSettingsModalProps) {
  const isAdmin = session.role === 'admin';

  // Own profile & password state
  const [ownUsername, setOwnUsername] = useState(session.username);
  const [ownDisplayName, setOwnDisplayName] = useState(session.displayName);
  const [ownRoleLabel, setOwnRoleLabel] = useState(session.roleLabel);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newOwnPassword, setNewOwnPassword] = useState('');
  const [savingOwn, setSavingOwn] = useState(false);
  const [ownError, setOwnError] = useState<string | null>(null);

  // Local directory state (Admin only)
  const [accounts, setAccounts] = useState<LocalAccountEntry[]>([]);
  const [loadingDir, setLoadingDir] = useState<boolean>(isAdmin);
  const [dirError, setDirError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<UserRole>('user');
  const [roleLabelInput, setRoleLabelInput] = useState('User Operasional');
  const [passwordInput, setPasswordInput] = useState('');
  const [activeInput, setActiveInput] = useState(true);
  const [savingMember, setSavingMember] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const refreshDirectory = async () => {
    if (!isAdmin) return;
    setLoadingDir(true);
    try {
      const list = await getLocalAccountDirectory();
      setAccounts(list);
      setDirError(null);
    } catch (err) {
      setDirError(
        err instanceof Error ? err.message : 'Gagal memuat daftar akun lokal.'
      );
    } finally {
      setLoadingDir(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void refreshDirectory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleSaveOwnProfile = async (e: FormEvent) => {
    e.preventDefault();
    setOwnError(null);
    setSavingOwn(true);
    try {
      const res = await updateOwnProfileAndPassword({
        accountId: session.id,
        currentPassword,
        newUsername: ownUsername,
        newDisplayName: ownDisplayName,
        newRoleLabel: ownRoleLabel,
        newPassword: newOwnPassword.trim() ? newOwnPassword : undefined,
        remembered: session.remembered,
      });
      if (!res.ok) {
        setOwnError(res.error);
        return;
      }
      onSessionUpdated(res.session);
      setCurrentPassword('');
      setNewOwnPassword('');
      onNotice('Profil dan kata sandi akun lokal berhasil diperbarui.');
      if (isAdmin) {
        await refreshDirectory();
      }
    } finally {
      setSavingOwn(false);
    }
  };

  const resetMemberForm = () => {
    setEditingId(null);
    setUsernameInput('');
    setDisplayNameInput('');
    setRoleInput('user');
    setRoleLabelInput('User Operasional');
    setPasswordInput('');
    setActiveInput(true);
    setFormError(null);
  };

  const handleStartEdit = (entry: LocalAccountEntry) => {
    setEditingId(entry.id);
    setUsernameInput(entry.username);
    setDisplayNameInput(entry.displayName);
    setRoleInput(entry.role);
    setRoleLabelInput(entry.roleLabel);
    setPasswordInput('');
    setActiveInput(entry.active);
    setFormError(null);
  };

  const handleRoleSelectChange = (nextRole: UserRole) => {
    setRoleInput(nextRole);
    if (
      !editingId ||
      roleLabelInput === 'User Operasional' ||
      roleLabelInput === 'Administrator Jadwal'
    ) {
      setRoleLabelInput(
        nextRole === 'admin' ? 'Administrator Jadwal' : 'User Operasional'
      );
    }
  };

  const handleSaveMember = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSavingMember(true);
    try {
      const saved = await upsertLocalAccountMember({
        editId: editingId,
        username: usernameInput,
        displayName: displayNameInput,
        role: roleInput,
        roleLabel: roleLabelInput,
        active: activeInput,
        password: passwordInput.trim() ? passwordInput : undefined,
      });
      if (saved.id === session.id) {
        onSessionUpdated({
          ...session,
          username: saved.username,
          displayName: saved.displayName,
          role: saved.role,
          roleLabel: saved.roleLabel,
        });
        setOwnUsername(saved.username);
        setOwnDisplayName(saved.displayName);
        setOwnRoleLabel(saved.roleLabel);
      }
      onNotice(
        editingId
          ? `Akun @${saved.username} berhasil diperbarui.`
          : `Akun lokal @${saved.username} (${saved.role.toUpperCase()}) berhasil ditambahkan.`
      );
      resetMemberForm();
      await refreshDirectory();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan akun lokal.'
      );
    } finally {
      setSavingMember(false);
    }
  };

  const handleQuickToggleRole = async (entry: LocalAccountEntry) => {
    if (entry.isPrimaryAdmin) return;
    setSavingMember(true);
    setFormError(null);
    const nextRole: UserRole = entry.role === 'admin' ? 'user' : 'admin';
    try {
      await upsertLocalAccountMember({
        editId: entry.id,
        username: entry.username,
        displayName: entry.displayName,
        role: nextRole,
        roleLabel:
          nextRole === 'admin' ? 'Administrator Jadwal' : 'User Operasional',
        active: entry.active,
      });
      onNotice(
        `Peran ${entry.displayName} diubah menjadi ${nextRole.toUpperCase()}.`
      );
      await refreshDirectory();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal mengubah peran akun.'
      );
    } finally {
      setSavingMember(false);
    }
  };

  const handleQuickToggleActive = async (entry: LocalAccountEntry) => {
    if (entry.isPrimaryAdmin) return;
    setSavingMember(true);
    setFormError(null);
    try {
      await upsertLocalAccountMember({
        editId: entry.id,
        username: entry.username,
        displayName: entry.displayName,
        role: entry.role,
        roleLabel: entry.roleLabel,
        active: !entry.active,
      });
      onNotice(
        `Akun ${entry.displayName} ${!entry.active ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      await refreshDirectory();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal mengubah status akun.'
      );
    } finally {
      setSavingMember(false);
    }
  };

  const handleDelete = async (entry: LocalAccountEntry) => {
    setSavingMember(true);
    setFormError(null);
    try {
      await deleteLocalAccountMember(entry.id);
      setConfirmDeleteId(null);
      if (editingId === entry.id) resetMemberForm();
      onNotice(`Akun @${entry.username} dihapus dari perangkat ini.`);
      await refreshDirectory();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menghapus akun.'
      );
    } finally {
      setSavingMember(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#191510] border border-[#3a2f20] text-[#f3ede4] rounded-xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2f271d] shrink-0">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-[#dfb365] shrink-0" />
            <h2
              id="account-modal-title"
              className="text-sm font-bold uppercase tracking-wide text-[#dfb365]"
            >
              {isAdmin
                ? 'Akun Offline Saya & Kelola Akun Perangkat'
                : 'Profil Akun Offline & Hak Akses'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#9b8f80] hover:text-[#f3ede4] rounded-lg"
            aria-label="Tutup pengaturan akun"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Current Session Card */}
          <div className="rounded-xl border border-[#32291d] bg-[#120f0b] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[#f5efe6] truncate">
                  {session.displayName}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded border ${
                    isAdmin
                      ? 'bg-[#2a2114] border-[#8d6b38] text-[#ecc478]'
                      : 'bg-sky-950/60 border-sky-700/60 text-sky-300'
                  }`}
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-3 h-3" />
                  ) : (
                    <Users className="w-3 h-3" />
                  )}
                  <span>
                    {session.isPrimaryAdmin
                      ? 'ADMIN UTAMA'
                      : session.role.toUpperCase()}
                  </span>
                </span>
              </div>
              <div className="text-xs font-mono text-[#b8aa97] truncate">
                @{session.username} · Penyimpanan Lokal (Offline)
              </div>
              <div className="text-[11px] text-[#9b8f80]">
                {session.roleLabel} ·{' '}
                {isAdmin
                  ? 'Akses penuh seluruh menu, Data Personel, Jadwal Piket & Kelola Akun.'
                  : 'Akses semua menu operasional kecuali mengubah Data Personel dan mengubah Jadwal Piket.'}
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-200 bg-red-950/50 border border-red-500/40 hover:bg-red-900/60 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar / Ganti Akun</span>
            </button>
          </div>

          {/* Own Profile & Password Update */}
          <form
            onSubmit={handleSaveOwnProfile}
            className="rounded-xl border border-[#352b1f] bg-[#14110d] p-4 space-y-3.5"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-[#dfb365]">
              Ubah Profil &amp; Kata Sandi Saya
            </div>

            {ownError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-950/60 px-3 py-2 text-xs text-red-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{ownError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="own-acc-username"
                  className="block text-[11px] font-medium text-[#b8aa97]"
                >
                  Username Login
                </label>
                <input
                  id="own-acc-username"
                  type="text"
                  required
                  minLength={3}
                  value={ownUsername}
                  onChange={(e) => setOwnUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#0e0c09] border border-[#352b1f] text-[#f3ede4] rounded-lg focus:outline-none focus:border-[#c99645]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="own-acc-displayname"
                  className="block text-[11px] font-medium text-[#b8aa97]"
                >
                  Nama Tampilan
                </label>
                <input
                  id="own-acc-displayname"
                  type="text"
                  required
                  maxLength={100}
                  value={ownDisplayName}
                  onChange={(e) => setOwnDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0e0c09] border border-[#352b1f] text-[#f3ede4] rounded-lg focus:outline-none focus:border-[#c99645]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="own-acc-rolelabel"
                  className="block text-[11px] font-medium text-[#b8aa97]"
                >
                  Jabatan / Keterangan
                </label>
                <input
                  id="own-acc-rolelabel"
                  type="text"
                  maxLength={80}
                  value={ownRoleLabel}
                  onChange={(e) => setOwnRoleLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0e0c09] border border-[#352b1f] text-[#f3ede4] rounded-lg focus:outline-none focus:border-[#c99645]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="own-acc-newpass"
                  className="block text-[11px] font-medium text-[#b8aa97]"
                >
                  Kata Sandi Baru (kosongkan jika tetap)
                </label>
                <input
                  id="own-acc-newpass"
                  type="password"
                  minLength={6}
                  value={newOwnPassword}
                  onChange={(e) => setNewOwnPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 text-xs bg-[#0e0c09] border border-[#352b1f] text-[#f3ede4] placeholder:text-[#6e6456] rounded-lg focus:outline-none focus:border-[#c99645]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
              <div className="space-y-1 flex-1 max-w-sm">
                <label
                  htmlFor="own-acc-currpass"
                  className="block text-[11px] font-medium text-[#b8aa97]"
                >
                  Konfirmasi Kata Sandi Saat Ini
                </label>
                <input
                  id="own-acc-currpass"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full px-3 py-2 text-xs bg-[#0e0c09] border border-[#352b1f] text-[#f3ede4] placeholder:text-[#6e6456] rounded-lg focus:outline-none focus:border-[#c99645]"
                />
              </div>

              <button
                type="submit"
                disabled={savingOwn}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#a6783e] hover:bg-[#b88647] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {savingOwn ? 'Menyimpan...' : 'Simpan Profil Saya'}
                </span>
              </button>
            </div>
          </form>

          {!isAdmin && (
            <div className="rounded-xl border border-[#2f271d] bg-[#15120d] p-4 space-y-2 text-xs text-[#cbb899]">
              <div className="font-semibold text-[#f0cf89]">
                Ringkasan Izin Akun User
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[#b8aa97]">
                <li>
                  Dapat membuka <strong>Beranda Dashboard</strong>,{' '}
                  <strong>Matriks Bulanan (Lihat Saja)</strong>,{' '}
                  <strong>Piket Harian &amp; WhatsApp</strong>,{' '}
                  <strong>Rengiat</strong>, <strong>Daftar Pers PAM</strong>,{' '}
                  <strong>Buat Surat</strong>, dan{' '}
                  <strong>Cetak &amp; Excel</strong>.
                </li>
                <li>
                  Perubahan pada <strong>Data Personel</strong> dan{' '}
                  <strong>Jadwal Piket</strong> (klik ubah shift, urutan
                  satuan, PAWAS, backup/restore) hanya dapat dilakukan oleh akun{' '}
                  <strong>Admin</strong>.
                </li>
              </ul>
            </div>
          )}

          {/* Admin Local Account Directory Management */}
          {isAdmin && (
            <div className="space-y-4">
              <form
                onSubmit={handleSaveMember}
                className="rounded-xl border border-[#352b1f] bg-[#14110d] p-4 space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#dfb365]">
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {editingId
                        ? `Edit Akun Lokal: @${usernameInput}`
                        : 'Tambah Akun Admin / User Lokal'}
                    </span>
                  </div>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetMemberForm}
                      className="text-xs text-[#9b8f80] hover:text-[#f3ede4]"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-950/60 px-3 py-2 text-xs text-red-200"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="acc-member-username"
                      className="block text-[11px] font-medium text-[#b8aa97]"
                    >
                      Username Login
                    </label>
                    <input
                      id="acc-member-username"
                      type="text"
                      required
                      minLength={3}
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="contoh: operator1"
                      className="w-full px-3 py-2 text-xs font-mono bg-[#0e0c09] border border-[#352b1f] text-[#f3ede4] placeholder:text-[#6e6456] rounded-lg focus:outline-none focus:border-[#c99645]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="acc-member-name"
                      className="block text-[11px] font-medium text-[#b8aa97]"
                    >
                      Nama Tampilan
                    </label>
                    <input
                      id="acc-member-name"
                      type="text"
                      required
                      maxLength={100}
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="Contoh: Bripka Budi Santoso"
                      className="w-full px-3 py-2 text-xs bg-[#0e0c09] border border-[#352b1f] text-[#f3ede4] placeholder:text-[#6e6456] rounded-lg focus:outline-none focus:border-[#c99645]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="acc-member-role"
                      className="block text-[11px] font-medium text-[#b8aa97]"
                    >
                      Peran Hak Akses
                    </label>
                    <select
                      id="acc-member-role"
                      disabled={editingId === PRIMARY_ADMIN_ID}
                      value={roleInput}
                      onChange={(e) =>
                        handleRoleSelectChange(e.target.value as UserRole)
                      }
                      className="w-full px-3 py-2 text-xs bg-[#0e0c09] border border-[#352b1f] disabled:opacity-60 text-[#f3ede4] rounded-lg focus:outline-none focus:border-[#c99645]"
                    >
                      <option value="user">
                        User — Menu operasional (tanpa ubah Personel &amp;
                        Jadwal)
                      </option>
                      <option value="admin">
                        Admin — Akses Penuh (Ubah Personel, Jadwal &amp; Akun)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="acc-member-label"
                      className="block text-[11px] font-medium text-[#b8aa97]"
                    >
                      Jabatan / Keterangan Peran
                    </label>
                    <input
                      id="acc-member-label"
                      type="text"
                      maxLength={80}
                      value={roleLabelInput}
                      onChange={(e) => setRoleLabelInput(e.target.value)}
                      placeholder="User Operasional / Admin Sium"
                      className="w-full px-3 py-2 text-xs bg-[#0e0c09] border border-[#352b1f] text-[#f3ede4] placeholder:text-[#6e6456] rounded-lg focus:outline-none focus:border-[#c99645]"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label
                      htmlFor="acc-member-password"
                      className="block text-[11px] font-medium text-[#b8aa97]"
                    >
                      {editingId
                        ? 'Kata Sandi Baru (kosongkan jika tidak ingin mengubah)'
                        : 'Kata Sandi Login'}
                    </label>
                    <input
                      id="acc-member-password"
                      type="password"
                      required={!editingId}
                      minLength={6}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3 py-2 text-xs bg-[#0e0c09] border border-[#352b1f] text-[#f3ede4] placeholder:text-[#6e6456] rounded-lg focus:outline-none focus:border-[#c99645]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-[#cbb899] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={editingId === PRIMARY_ADMIN_ID}
                      checked={activeInput}
                      onChange={(e) => setActiveInput(e.target.checked)}
                      className="rounded border-[#4a3b28] bg-[#0e0c09] text-[#a6783e]"
                    />
                    <span>Akun Aktif (diizinkan masuk)</span>
                  </label>

                  <button
                    type="submit"
                    disabled={savingMember}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#a6783e] hover:bg-[#b88647] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {savingMember
                        ? 'Menyimpan...'
                        : editingId
                          ? 'Simpan Perubahan Akun'
                          : 'Tambahkan Akun Lokal'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Registered Local Accounts List */}
              <div className="rounded-xl border border-[#352b1f] bg-[#14110d] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2c241b] flex items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#dfb365]">
                    Daftar Akun Perangkat ({accounts.length})
                  </div>
                  <span className="text-[11px] text-[#9b8f80]">
                    Tersimpan lokal di perangkat (Mode Offline)
                  </span>
                </div>

                {dirError && (
                  <div className="p-3 text-xs text-red-300 bg-red-950/50">
                    {dirError}
                  </div>
                )}

                {loadingDir ? (
                  <div className="p-5 text-center text-xs text-[#9b8f80]">
                    Memuat daftar akun...
                  </div>
                ) : (
                  <div className="divide-y divide-[#262017]">
                    {accounts.map((entry) => {
                      const isConfirmDel = confirmDeleteId === entry.id;

                      return (
                        <div
                          key={entry.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-[#f3ede4]">
                                {entry.displayName}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${
                                  entry.role === 'admin'
                                    ? 'bg-[#2a2114] border-[#8d6b38] text-[#ecc478]'
                                    : 'bg-sky-950/60 border-sky-700/60 text-sky-300'
                                }`}
                              >
                                {entry.isPrimaryAdmin
                                  ? 'ADMIN UTAMA'
                                  : entry.role.toUpperCase()}
                              </span>
                              {!entry.active && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-950/70 border border-red-500/40 text-red-300">
                                  NONAKTIF
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-[#b8aa97] truncate">
                              @{entry.username}
                            </div>
                            <div className="text-[11px] text-[#8e8273]">
                              {entry.roleLabel}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {!entry.isPrimaryAdmin && (
                              <>
                                <button
                                  type="button"
                                  disabled={savingMember}
                                  onClick={() => handleQuickToggleRole(entry)}
                                  className="px-2.5 py-1 text-[11px] font-medium bg-[#1f1912] border border-[#3a2f20] hover:border-[#8d6b38] text-[#e6dfd3] rounded-md whitespace-nowrap"
                                  title="Tukar peran Admin / User"
                                >
                                  Jadikan{' '}
                                  {entry.role === 'admin' ? 'User' : 'Admin'}
                                </button>
                                <button
                                  type="button"
                                  disabled={savingMember}
                                  onClick={() => handleQuickToggleActive(entry)}
                                  className="px-2.5 py-1 text-[11px] font-medium bg-[#1f1912] border border-[#3a2f20] hover:border-[#8d6b38] text-[#e6dfd3] rounded-md whitespace-nowrap"
                                >
                                  {entry.active ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              disabled={savingMember}
                              onClick={() => handleStartEdit(entry)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#1f1912] border border-[#3a2f20] hover:border-[#8d6b38] text-[#e6dfd3] rounded-md"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            {!entry.isPrimaryAdmin &&
                              (isConfirmDel ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={savingMember}
                                    onClick={() => handleDelete(entry)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-red-700 hover:bg-red-600 text-white rounded-md"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Hapus</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 text-[11px] text-[#9b8f80] hover:text-white"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={savingMember}
                                  onClick={() => setConfirmDeleteId(entry.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-[#1f1912] border border-[#3a2f20] hover:border-red-500/50 text-red-300 rounded-md"
                                  aria-label={`Hapus @${entry.username}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
