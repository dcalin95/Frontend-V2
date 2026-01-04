# TikTok Ads Manager - Setare Conversion Event Corect

## Problema Actuală
Ad Group-ul existent are setat "Initiate checkouts" ca Conversion Event, dar vrei să plătești DOAR pentru:
- **CompletePayment** (cumpărături reale)
- **CompleteRegistration** (intrări în Telegram)

## Soluție: Creează Ad Group Nou

### Pas 1: Mergi la Campaigns
1. Deschide TikTok Ads Manager
2. Click pe **"Campaigns"** în meniul din stânga
3. Selectează Campaign-ul tău existent

### Pas 2: Creează Ad Group Nou
1. Click pe **"+ Create"** sau butonul de creare
2. Selectează **"Ad group"** (nu Campaign, nu Ad)
3. Alege Campaign-ul tău existent ca părinte

### Pas 3: Setează Conversion Event Corect
În timpul creării Ad Group-ului, când ajungi la secțiunea **"Bidding and optimization"**:

1. **Optimization goal:** Selectează **"Conversion"**
2. **Conversion Event:** Alege **"CompletePayment"** sau **"CompleteRegistration"**
   - Dacă vezi dropdown, selectează **"CompletePayment"** (pentru cumpărături)
   - Dacă vezi căutare, caută **"CompletePayment"**

### Pas 4: Configurează Restul Setărilor
- Copiază setările din Ad Group-ul vechi (Budget, Targeting, etc.)
- Folosește același Ad (creative) sau creează unul nou
- Salvează Ad Group-ul nou

### Pas 5: Oprește Ad Group-ul Vechi
1. Mergi în lista de Ad Groups
2. Găsește Ad Group-ul vechi (care are "Initiate checkouts")
3. Oprește-l (toggle OFF) sau șterge-l dacă nu mai vrei să ruleze

## Verificare

### Event-urile sunt deja implementate în cod:
- ✅ **CompletePayment** - se trimite automat când cineva cumpără BITS (Stripe, BNB, SOL, MATIC, ETH, USDT, USDC, SHIB)
- ✅ **CompleteRegistration** - se trimite automat când cineva dă click pe link-ul Telegram

### Event-urile vor apărea în Events Manager:
1. Mergi la **Events Manager** (din meniul din stânga → Management → Events Manager)
2. După ce site-ul primește trafic, event-urile **CompletePayment** și **CompleteRegistration** vor apărea automat în listă
3. Aceste event-uri vor fi disponibile pentru selecție în Ad Groups noi

## Notă Importantă
- **NU POȚI** schimba Conversion Event-ul într-un Ad Group existent
- Trebuie să creezi un Ad Group **NOU** cu Conversion Event setat corect
- Ad Group-ul vechi cu "Initiate checkouts" poate rula în paralel, dar tu vei plăti pentru ambele tipuri de event-uri dacă îl lași activ

## Recomandare Finală
1. **Creează Ad Group nou** cu Conversion Event = "CompletePayment"
2. **Oprește Ad Group-ul vechi** (sau șterge-l)
3. **Monitorizează** în Events Manager că event-urile CompletePayment și CompleteRegistration apar corect


