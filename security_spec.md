# Security Specification — Multi-Account Admin & User (SIUM)

## 1. Data Invariants
1. **Closed Whitelist Access**: Only Google-authenticated users with `email_verified == true` who match either the bootstrapped super-admin (`alimahfud5@gmail.com`) or an active record in `/accounts/{emailKey}` may read shared workspace documents.
2. **Strict Separation of Roster/Personnel Authority**:
   - Only `admin` accounts (and the bootstrapped admin) can create, update, or delete `/workspace/roster_config` (personnel data, unit order, PAWAS anchor, organizational header) and `/workspace/roster_overrides` (duty schedule overrides).
   - `user` accounts have strictly **read-only** (`get`) access to `roster_config` and `roster_overrides`, while retaining read/update access to operational documents (`rengiat_state`, `pam_state`, `surat_state`).
3. **Zero Privilege Escalation**:
   - Only `admin` accounts can create, update, or delete `/accounts/{accountId}` and `/workspace_admin/account_directory`.
   - `user` accounts cannot read other users' PII in `/accounts/{accountId}` or `/workspace_admin/account_directory`.
   - Even an `admin` cannot deactivate, demote, or delete the bootstrapped admin account (`alimahfud5_gmail_com`).
4. **No Blanket List Scraping**: All collections set `allow list: if false;` and operate on deterministic document paths.
5. **Temporal & Identity Integrity**: Every create/update validates `updatedAt == request.time`, `updatedByUid == request.auth.uid`, and preserves immutable `createdAt` and `createdByUid` on update.

## 2. Dirty Dozen Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated read on `/workspace/roster_config`** (`request.auth == null`).
2. **Unregistered Google user read on `/workspace/roster_config`** (`email` not in `/accounts` and not bootstrapped admin).
3. **Unverified email spoofing admin** (`email == 'alimahfud5@gmail.com'`, `email_verified == false`).
4. **User role trying to update `/workspace/roster_config`** (modify personnel list).
5. **User role trying to update `/workspace/roster_overrides`** (modify duty shift overrides).
6. **User role trying to self-promote in `/accounts/{ownEmailKey}`** (`role: 'admin'`).
7. **User role trying to read another user's `/accounts/{otherEmailKey}`** (PII leak).
8. **User role trying to read `/workspace_admin/account_directory`** (directory PII leak).
9. **Shadow/Ghost field injection on `/accounts/{id}` create** (`{ ..., isSuperAdmin: true }`).
10. **Admin trying to demote or delete `/accounts/alimahfud5_gmail_com`** (`role: 'user'` or `active: false` or `delete`).
11. **Oversized/Poisoned Document ID** (`/accounts/<200-char-junk>` failing `isValidId`).
12. **Forged client timestamp on `/workspace/rengiat_state` update** (`updatedAt != request.time` or mutating `createdAt` / `createdByUid`).
