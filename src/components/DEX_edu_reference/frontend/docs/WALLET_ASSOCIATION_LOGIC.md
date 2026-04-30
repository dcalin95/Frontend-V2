# 🔗 Wallet Association Logic - Complete Documentation

## Overview

This document describes the complete wallet association logic across Telegram Bot and Frontend systems.

## Database Schema

### Telegram Bot Database (`telegram_user_activity` table)
- **telegram_id** (TEXT UNIQUE) - Primary identifier for Telegram user
- **wallet_address** (TEXT) - Single wallet address linked via `/linkwallet` command
- **username** (TEXT) - Telegram username
- **first_name** (TEXT) - Telegram first name
- **last_name** (TEXT) - Telegram last name

**Note:** Telegram bot stores ONE wallet per user in `wallet_address` field.

### Frontend Database (`wallets` or `user_wallets` table - backend)
- **user_id** (INTEGER) - References users table
- **wallet_address** (TEXT) - Wallet address
- **wallet_type** (TEXT) - 'evm', 'solana', etc.
- **network** (TEXT) - Network name
- **created_at** (TIMESTAMP) - When wallet was associated

**Note:** Frontend supports MULTIPLE wallets per user.

### Users Table (Frontend)
- **id** (INTEGER) - Primary key
- **telegram_id** (BIGINT/TEXT) - Telegram ID if user registered via Telegram
- **email** (TEXT) - Email address
- **walletAddress** (TEXT) - Primary wallet from OAuth or initial registration

## Wallet Sources

A user can have wallets from multiple sources:

1. **Telegram Wallet** (`telegram_user_activity.wallet_address`)
   - Linked via `/linkwallet` command in Telegram bot
   - Stored in `telegram_user_activity` table
   - ONE wallet per Telegram user

2. **Frontend Associated Wallets** (`wallets` table)
   - Linked via frontend UI (Profile page, wallet connection)
   - Stored in `wallets` or `user_wallets` table
   - MULTIPLE wallets per user

3. **OAuth/Email Registration Wallet** (`users.walletAddress`)
   - Wallet from initial registration (OAuth, email)
   - Stored in `users` table
   - ONE primary wallet per user

4. **Currently Connected Wallet** (MetaMask/Web3)
   - Wallet connected via MetaMask in browser
   - NOT stored in database until associated
   - Can be different from any registered wallet

## Association Logic

### Current Implementation (Frontend)

**Profile.jsx:**
1. Loads wallets from `/api/auth/wallets` endpoint
2. Checks if connected wallet (`walletAddress` from `useDexAuth`) is in associated wallets list
3. Auto-associates connected wallet if not already associated
4. Shows appropriate messages based on wallet status

**useOTARegistration.js:**
1. Auto-associates connected wallet when wallet address changes
2. Checks wallet association before OTA registration

### Required Backend Logic

**`GET /api/auth/wallets` endpoint should:**

1. **Get wallets from frontend `wallets` table:**
   ```sql
   SELECT * FROM wallets WHERE user_id = $1
   ```

2. **If user has `telegram_id`, sync Telegram wallet:**
   ```sql
   SELECT wallet_address FROM telegram_user_activity 
   WHERE telegram_id = $1 AND wallet_address IS NOT NULL
   ```
   - If Telegram wallet exists and is NOT in `wallets` table, INSERT it:
   ```sql
   INSERT INTO wallets (user_id, wallet_address, wallet_type, network, source)
   VALUES ($1, $2, 'evm', 'BSC', 'telegram')
   ON CONFLICT DO NOTHING
   ```

3. **Include `users.walletAddress` if exists:**
   - If user has `walletAddress` in `users` table and it's not in `wallets`, include it

4. **Return combined list:**
   ```json
   {
     "wallets": [
       {
         "wallet_address": "0x...",
         "wallet_type": "evm",
         "network": "BSC",
         "source": "telegram" | "frontend" | "oauth" | "email"
       }
     ]
   }
   ```

**`POST /api/auth/wallets` endpoint (associateWallet):**

1. **Check if wallet already associated:**
   ```sql
   SELECT * FROM wallets 
   WHERE user_id = $1 AND LOWER(wallet_address) = LOWER($2)
   ```

2. **If not, insert new association:**
   ```sql
   INSERT INTO wallets (user_id, wallet_address, wallet_type, network, source)
   VALUES ($1, $2, $3, 'BSC', 'frontend')
   ```

3. **Handle conflicts gracefully:**
   - If wallet already exists for another user, return error
   - If wallet already exists for same user, return success (idempotent)

## Edge Cases

### Case 1: User has Telegram wallet but not in frontend DB
**Scenario:** User linked wallet in Telegram (`/linkwallet`), then logged into frontend
**Solution:** Backend should auto-sync Telegram wallet when returning wallets

### Case 2: User connects different wallet in frontend
**Scenario:** User has Telegram wallet `0xAAA`, but connects `0xBBB` in MetaMask
**Solution:** 
- `0xBBB` is auto-associated if not already in list
- Both wallets appear in "Associated Wallets" section
- User can use either wallet for OTA registration

### Case 3: User connects wallet that's not registered anywhere
**Scenario:** User connects `0xCCC` which is not in Telegram DB or frontend DB
**Solution:**
- Wallet is auto-associated with user account
- Appears in "Associated Wallets" section
- Can be used for OTA registration

### Case 4: User changes wallet in Telegram
**Scenario:** User changes Telegram wallet from `0xAAA` to `0xBBB` via `/linkwallet`
**Solution:**
- Backend should detect change and update `wallets` table
- Old wallet remains in `wallets` table (history)
- New wallet is added/updated

## Frontend Display Logic

**Profile.jsx "Associated Wallets" section:**

1. **If wallets loading:** Show loading spinner
2. **If wallets exist:** Display list with:
   - Wallet address (truncated)
   - Wallet type and network
   - Source indicator (Telegram, Frontend, OAuth)
   - Copy button
3. **If no wallets but wallet connected:**
   - Show "Wallet connected: 0x..."
   - Show "Associating..." if in progress
   - Show info about Telegram sync if user has `telegram_id`
4. **If no wallets and no wallet connected:**
   - Show "No wallets associated yet"
   - Show Telegram info if user has `telegram_id`
   - Show "Connect wallet" instruction

## OTA Registration Logic

**useOTARegistration.js:**

1. When wallet connects, auto-associate if not already associated
2. Check registration status using connected wallet address
3. If user has multiple wallets, registration is per-wallet (on-chain)

## Recommendations

### Backend Changes Required:

1. **Modify `GET /api/auth/wallets` to:**
   - Auto-sync Telegram wallet if user has `telegram_id`
   - Include `users.walletAddress` in response
   - Return `source` field for each wallet

2. **Add `source` field to wallets table:**
   - `'telegram'` - From Telegram bot
   - `'frontend'` - From frontend UI
   - `'oauth'` - From OAuth registration
   - `'email'` - From email registration

3. **Add sync endpoint (optional):**
   - `POST /api/auth/wallets/sync-telegram` - Force sync Telegram wallet

### Frontend Changes (Already Implemented):

1. ✅ Auto-associate connected wallet
2. ✅ Check wallet association status
3. ✅ Display appropriate messages
4. ✅ Handle Telegram wallet sync (if backend supports)

## Testing Checklist

- [ ] User with Telegram wallet logs into frontend → Telegram wallet appears
- [ ] User connects new wallet → Auto-associated
- [ ] User has multiple wallets → All appear in list
- [ ] User changes Telegram wallet → Frontend updates
- [ ] User connects unregistered wallet → Auto-associated
- [ ] OTA registration works with any associated wallet
