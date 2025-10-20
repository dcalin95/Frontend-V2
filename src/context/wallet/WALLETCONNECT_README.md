# WalletConnect Integration

## Configurare

Pentru a folosi WalletConnect în aplicația ta, trebuie să configurezi următoarele:

### 1. Infura Project ID (pentru Ethereum Mainnet)

Dacă vrei să suporți Ethereum Mainnet, trebuie să obții un Project ID de la Infura:

1. Mergi la https://infura.io/
2. Creează un cont și un proiect nou
3. Copiază Project ID-ul
4. Înlocuiește `YOUR-PROJECT-ID` din `walletConnectConfig.js` cu ID-ul tău

### 2. RPC Endpoints

Fișierul `walletConnectConfig.js` conține deja RPC endpoints pentru:
- BSC Mainnet (56)
- BSC Testnet (97) 
- Polygon (137)
- Avalanche (43114)

### 3. Utilizare

Utilizatorii pot acum să se conecteze folosind:
- Orice wallet care suportă WalletConnect (MetaMask Mobile, Trust Wallet, etc.)
- Prin scanarea QR code-ului care apare
- Fără să fie forțați să folosească browserul din wallet

### 4. Funcționalități

- ✅ Conectare prin QR code
- ✅ Suport pentru multiple rețele
- ✅ Disconnect automat
- ✅ Persistența sesiunii
- ✅ Compatibilitate cu ethers.js

### 5. Testare

Pentru a testa:
1. Deschide aplicația pe desktop
2. Apasă "Connect Wallet" → "WalletConnect"
3. Scanează QR code-ul cu wallet-ul tău mobil
4. Aprobi conexiunea în wallet

### 6. Troubleshooting

Dacă întâmpini probleme:
- Verifică că wallet-ul suportă WalletConnect
- Asigură-te că ești pe aceeași rețea
- Încearcă să resetezi sesiunea prin disconnect/reconnect 