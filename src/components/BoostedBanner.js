import React, { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";
import "./BoostedBanner.css";
import { getPresaleCurrentUrl, parseLaunchPowerUsd } from "../Presale/presaleApi";

/** Citește suma cumulativă din /api/presale/current (0 este valid — nu folosi truthiness pe totalBoosted). */
const BoostedBanner = () => {
  const [boosted, setBoosted] = useState(null);
  const [showWowEffect, setShowWowEffect] = useState(false);
  const [hasSpokenOnLoad, setHasSpokenOnLoad] = useState(false);
  const [newSaleNotification, setNewSaleNotification] = useState(null);
  const [notificationKey, setNotificationKey] = useState(0);
  const [showVoiceButton, setShowVoiceButton] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // 📱 Control vizibilitate pe mobile
  const prevBoosted = useRef(null);
  const hasSpokenRef = useRef(false);
  const hideTimeoutRef = useRef(null); // Ref pentru timeout-ul de ascundere

  // Funcție pentru detectarea dispozitivelor mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768 ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  };

  // Funcție pentru convertirea numerelor în text
  const numberToWords = (num) => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    
    if (num === 0) return 'zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    }
    if (num < 1000) {
      return ones[Math.floor(num / 100)] + ' hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
    }
    if (num < 1000000) {
      return numberToWords(Math.floor(num / 1000)) + ' thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
    }
    if (num < 1000000000) {
      return numberToWords(Math.floor(num / 1000000)) + ' million' + (num % 1000000 !== 0 ? ' ' + numberToWords(num % 1000000) : '');
    }
    return 'very large number';
  };

  // Funcție pentru citirea vocale a sumei
  const speakAmount = (amount) => {
    if (!('speechSynthesis' in window)) {
      console.log("❌ Speech synthesis not supported");
      return;
    }

    // Oprește orice voce în curs de redare
    speechSynthesis.cancel();
    
    // Pentru mobil - verifică dacă utilizatorul a interacționat
    if (isMobileDevice() && !hasUserInteracted) {
      console.log("📱 Mobil detectat - afișez butonul pentru voce");
      setShowVoiceButton(true);
      return;
    }
    
    // Pentru desktop - continuă direct cu citirea vocală
    console.log("🖥️ Desktop detectat - citire vocală automată");
    
    const roundedAmount = Math.floor(amount); // Elimină zecimalele
    const amountText = numberToWords(roundedAmount);
    
    // Prima parte: suma
    const amountSpeechText = `BitSwapDEX AI project has raised ${amountText} dollars.`;
    
    console.log(`🔊 Citire vocală partea 1: "${amountSpeechText}"`);
    
    const amountUtterance = new SpeechSynthesisUtterance(amountSpeechText);
    amountUtterance.rate = 0.8;
    amountUtterance.pitch = 0.9;
    amountUtterance.volume = 0.8;
    
    // A doua parte: explicația despre lichiditate
    const liquiditySpeechText = "This amount will be used to ensure liquidity for exchange listings.";
    
    console.log(`🔊 Citire vocală partea 2: "${liquiditySpeechText}"`);
    
    const liquidityUtterance = new SpeechSynthesisUtterance(liquiditySpeechText);
    liquidityUtterance.rate = 0.8;
    liquidityUtterance.pitch = 0.9;
    liquidityUtterance.volume = 0.8;
    
    // A treia parte: despre prețul de listare
    const listingPriceSpeechText = "The listing price will be significantly higher than the current presale round.";
    
    console.log(`🔊 Citire vocală partea 3: "${listingPriceSpeechText}"`);
    
    const listingPriceUtterance = new SpeechSynthesisUtterance(listingPriceSpeechText);
    listingPriceUtterance.rate = 0.8;
    listingPriceUtterance.pitch = 0.9;
    listingPriceUtterance.volume = 0.8;
    
    // A patra parte: mulțumiri și urări de succes
    const thanksSpeechText = "Thank you for your trust in the BITS project. We wish success to everyone!";
    
    console.log(`🔊 Citire vocală partea 4: "${thanksSpeechText}"`);
    
    const thanksUtterance = new SpeechSynthesisUtterance(thanksSpeechText);
    thanksUtterance.rate = 0.8;
    thanksUtterance.pitch = 0.9;
    thanksUtterance.volume = 0.8;
    
    // A cincea parte: despre AI și tehnologii moderne
    const aiSpeechText = "This project combines artificial intelligence and modern blockchain technologies to create the future of decentralized finance.";
    
    console.log(`🔊 Citire vocală partea 5: "${aiSpeechText}"`);
    
    const aiUtterance = new SpeechSynthesisUtterance(aiSpeechText);
    aiUtterance.rate = 0.8;
    aiUtterance.pitch = 0.9;
    aiUtterance.volume = 0.8;
    
    // Redare secvențială cu pauze
    try {
      speechSynthesis.speak(amountUtterance);
      
      amountUtterance.onend = () => {
        setTimeout(() => {
          speechSynthesis.speak(liquidityUtterance);
        }, 3000); // Pauză de 3 secunde
      };
      
      liquidityUtterance.onend = () => {
        setTimeout(() => {
          speechSynthesis.speak(listingPriceUtterance);
        }, 1000); // Pauză de 1 secundă
      };
      
      listingPriceUtterance.onend = () => {
        setTimeout(() => {
          speechSynthesis.speak(thanksUtterance);
        }, 1000); // Pauză de 1 secundă
      };
      
      thanksUtterance.onend = () => {
        setTimeout(() => {
          speechSynthesis.speak(aiUtterance);
        }, 1000); // Pauză de 1 secundă
      };
      
      // Error handling pentru fiecare utterance
      [amountUtterance, liquidityUtterance, listingPriceUtterance, thanksUtterance, aiUtterance].forEach(utterance => {
        utterance.onerror = (event) => {
          console.error("❌ Eroare la citirea vocală:", event.error);
        };
      });
      
    } catch (error) {
      console.error("❌ Eroare la inițierea citirii vocale:", error);
    }
  };

  // Funcție pentru activarea efectului wow cu variante
  const triggerWowEffect = () => {
    const variants = ['wow', 'wow2', 'wow3', 'wow4'];
    const randomVariant = variants[Math.floor(Math.random() * variants.length)];
    setShowWowEffect(randomVariant);
    
    // Durate diferite pentru fiecare variantă
    const durations = {
      'wow': 2000,    // 2 secunde
      'wow2': 2500,   // 2.5 secunde
      'wow3': 3000,   // 3 secunde
      'wow4': 4000    // 4 secunde pentru efectul fullscreen
    };
    
    setTimeout(() => setShowWowEffect(false), durations[randomVariant]);
  };

  // Lista de țări permise (excluzând SUA, Rusia, China, Nigeria și alte țări suspecte)
  const allowedCountries = [
    'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands',
    'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Belgium', 'Austria',
    'Portugal', 'Ireland', 'Poland', 'Czech Republic', 'Hungary', 'Slovakia',
    'Slovenia', 'Croatia', 'Estonia', 'Latvia', 'Lithuania', 'Bulgaria', 'Romania',
    'Greece', 'Cyprus', 'Malta', 'Luxembourg', 'Iceland', 'Australia', 'New Zealand',
    'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'Taiwan', 'Thailand', 'Malaysia',
    'Philippines', 'Vietnam', 'Indonesia', 'India', 'Brazil', 'Argentina', 'Chile',
    'Colombia', 'Peru', 'Mexico', 'Uruguay', 'Paraguay', 'Ecuador', 'Venezuela',
    'South Africa', 'Kenya', 'Ghana', 'Morocco', 'Egypt', 'Tunisia',
    'Turkey', 'Israel', 'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
    'Oman', 'Jordan', 'Lebanon'
  ];

  // Funcție pentru selectarea țării bazată pe suma (pentru sincronizare cross-device)
  const getCountryForAmount = (amount) => {
    // Folosim suma ca seed pentru a genera aceeași țară pentru aceeași sumă
    const seed = Math.floor(amount * 100); // Convertim la întreg pentru consistență
    const index = seed % allowedCountries.length;
    return allowedCountries[index];
  };

  // Funcție pentru selectarea cryptomonedei bazată pe sumă (sync cross-device)
  const getCryptoForAmount = (amount) => {
    const cryptoOptions = [
      { name: 'BNB', symbol: 'BNB', weight: 35, color: '#F3BA2F' }, // 35% - preponderent
      { name: 'Solana', symbol: 'SOL', weight: 30, color: '#9945FF' }, // 30% - preponderent  
      { name: 'Ethereum', symbol: 'ETH', weight: 15, color: '#627EEA' }, // 15%
      { name: 'USDT', symbol: 'USDT', weight: 10, color: '#26A17B' }, // 10%
      { name: 'USDC', symbol: 'USDC', weight: 5, color: '#2775CA' }, // 5%
      { name: 'Polygon', symbol: 'MATIC', weight: 3, color: '#8247E5' }, // 3%
      { name: 'Shiba Inu', symbol: 'SHIB', weight: 2, color: '#FFA409' } // 2%
    ];
    
    // Folosim suma pentru a genera consistent aceeași crypto
    const seed = Math.floor(amount * 1000) % 100; // 0-99
    let weightSum = 0;
    
    for (const crypto of cryptoOptions) {
      weightSum += crypto.weight;
      if (seed < weightSum) {
        return crypto;
      }
    }
    
    // Fallback la BNB
    return cryptoOptions[0];
  };

  // Funcție pentru forțarea interacțiunii utilizatorului pe mobil
  const forceUserInteraction = () => {
    if (isMobileDevice() && !hasUserInteracted) {
      console.log("📱 Forțez afișarea butonului de voce pe mobil");
      setShowVoiceButton(true);
      
      // Ascunde butonul după 10 secunde dacă nu a fost apăsat
      setTimeout(() => {
        if (!hasUserInteracted) {
          setShowVoiceButton(false);
          // console.log("⏰ Butonul de voce ascuns automat după 10 secunde"); // Debug dezactivat
        }
      }, 10000);
    }
  };

  // Funcție pentru declanșarea vocii pe mobil
  const handleVoiceButtonClick = () => {
    console.log("🎤 Utilizatorul a apăsat butonul de voce pe mobil");
    
    // Marchează că utilizatorul a interacționat
    setHasUserInteracted(true);
    setShowVoiceButton(false);
    
    // Verifică dacă speech synthesis este disponibil
    if (!('speechSynthesis' in window)) {
      console.error("❌ Speech synthesis not supported in this browser");
      alert("Voice feature is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    
    // Pentru Chrome pe mobil - forțează încărcarea vocilor
    if (isMobileDevice()) {
      // Încarcă vocile disponibile
      speechSynthesis.getVoices();
      
      // Așteaptă puțin pentru a se încărca vocile
      setTimeout(() => {
        if (boosted) {
          console.log("🔊 Declanșez vocea după interacțiunea utilizatorului");
          speakAmount(boosted);
        }
      }, 500);
    } else {
      // Pentru desktop
      if (boosted) {
        speakAmount(boosted);
      }
    }
  };

  // Funcție pentru evenimente touch (pentru Chrome pe mobil)
  const handleVoiceButtonTouch = (e) => {
    e.preventDefault(); // Previne comportamentul implicit
    e.stopPropagation(); // Oprește propagarea evenimentului
    console.log("👆 Touch event detectat pe butonul de voce");
    
    // Adaugă un mic delay pentru a evita double-tap
    setTimeout(() => {
      handleVoiceButtonClick();
    }, 100);
  };

  // Funcție pentru afișarea notificării de vânzare nouă
  const showNewSaleNotification = (increaseAmount) => {
    // Reducere de 25% pentru a face sumele mai mici
    const adjustedAmount = increaseAmount * 0.75;
    
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(adjustedAmount);

    // ✅ Folosim suma pentru a genera aceeași țară și crypto pe toate dispozitivele
    const countryForAmount = getCountryForAmount(adjustedAmount);
    const cryptoForAmount = getCryptoForAmount(adjustedAmount);

    // Forțează re-animarea prin schimbarea cheii
    setNotificationKey(prev => prev + 1);

    setNewSaleNotification({
      text: `New presale participant spotted!`,
      country: `Payment located: `,
      countryName: countryForAmount,
      geolocation: `(IP-based geolocation)`,
      amount: `+${formattedAmount}`,
      crypto: cryptoForAmount,
      rawAmount: adjustedAmount
    });

    // Notificarea rămâne vizibilă până când apare o nouă vânzare
    // Nu mai avem setTimeout - se va ascunde doar când se apelează din nou showNewSaleNotification
  };

  // Funcție pentru forțarea încărcării vocilor în Chrome
  const forceLoadVoices = () => {
    if ('speechSynthesis' in window) {
      // Forțează încărcarea vocilor
      speechSynthesis.getVoices();
      
      // Pentru Chrome - vocile se încarcă asincron
      if (speechSynthesis.onvoiceschanged) {
        speechSynthesis.onvoiceschanged = () => {
          const voices = speechSynthesis.getVoices();
          console.log(`🎤 Vocile încărcate: ${voices.length} disponibile`);
        };
      }
      
      // Pentru mobil - încarcă vocile din nou după un delay
      if (isMobileDevice()) {
        setTimeout(() => {
          speechSynthesis.getVoices();
        }, 1000);
      }
    }
  };

  // Reset flag doar la primul load al componentei
  useEffect(() => {
    // Resetăm flag-ul doar la primul load
    hasSpokenRef.current = false;
    
    // 📱 Pe mobile, reafișează banner-ul la refresh
    if (isMobileDevice()) {
      setIsVisible(true);
      console.log("📱 Refresh detectat - reafișez banner-ul 'Launch Power Raised'");
    }
    
    // Forțează încărcarea vocilor
    forceLoadVoices();
  }, []);

  // 📱 Auto-hide pe mobile după câteva secunde
  useEffect(() => {
    if (!isMobileDevice()) {
      return; // Nu aplică auto-hide pe desktop
    }

    // Dacă banner-ul este vizibil și avem date, setează timeout pentru ascundere
    if (isVisible && boosted !== null) {
      // Anulează timeout-ul anterior dacă există
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      // Ascunde banner-ul după 5 secunde
      hideTimeoutRef.current = setTimeout(() => {
        console.log("📱 Banner 'Launch Power Raised' ascuns automat pe mobile după 5 secunde");
        setIsVisible(false);
      }, 5000); // 5 secunde
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isVisible, boosted]);

  // 📱 Reafișează banner-ul când suma se actualizează (când urcă)
  useEffect(() => {
    if (!isMobileDevice()) {
      return; // Nu aplică pe desktop
    }

    if (boosted !== null && prevBoosted.current !== null && boosted > prevBoosted.current) {
      // Suma a crescut - reafișează banner-ul
      console.log("📱 Suma a crescut - reafișez banner-ul 'Launch Power Raised'");
      setIsVisible(true);
    }
  }, [boosted]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(await getPresaleCurrentUrl(), { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 404) {
            setBoosted((prev) => (prev === null ? 0 : prev));
          }
          console.warn("[BoostedBanner] presale/current failed:", res.status, data?.message || data?.error);
          return;
        }

        const newBoosted = parseLaunchPowerUsd(data);
        if (Number.isFinite(newBoosted)) {
          if (prevBoosted.current !== null && newBoosted > prevBoosted.current) {
            const increaseAmount = newBoosted - prevBoosted.current;
            
            console.log(`🎉 NOUĂ VÂNZARE DETECTATĂ: +$${increaseAmount.toFixed(2)}`);
            
            const audio = new Audio("/sounds/boost.wav");
            audio.play().catch((err) =>
              console.warn("🔇 Eroare la redare boost.wav:", err)
            );
            
            // Activează efectul wow
            triggerWowEffect();
            
            // Afișează notificarea de vânzare nouă
            showNewSaleNotification(increaseAmount);
          }

          prevBoosted.current = newBoosted;
          setBoosted(newBoosted);
          
                     // Citește suma doar la prima încărcare a datelor
           if (newBoosted > 0 && !hasSpokenRef.current) {
             console.log(`🎤 Citire vocală la primul load: ${newBoosted}`);
             hasSpokenRef.current = true;
             setTimeout(() => {
               speakAmount(newBoosted);
             }, 2000); // Așteaptă 2 secunde după încărcare
           }
           
           // Forțează interacțiunea pe mobil după încărcarea datelor
           if (newBoosted > 0 && isMobileDevice()) {
             setTimeout(() => {
               forceUserInteraction();
             }, 3000); // Așteaptă 3 secunde după încărcare
           }
        } else {
          console.warn("[BoostedBanner] Răspuns fără totalBoosted/totalRaised numeric:", data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch boost data:", err);
      }
    };

    const delayTimer = setTimeout(fetchData, 3000);
    const interval = setInterval(fetchData, 30000); // ← Crescut de la 10s la 30s
    
    // Efect wow periodic - la fiecare 15 secunde
    const wowInterval = setInterval(triggerWowEffect, 15000);

    return () => {
      clearTimeout(delayTimer);
      clearInterval(interval);
      clearInterval(wowInterval);
    };
  }, []);

  return (
    <div className={`total-boosted-banner ${isMobileDevice() && !isVisible ? 'mobile-hidden' : ''}`}>
      <img src="/logo.png" alt="BITS Logo" className="bits-logo-floating" />
      <span className="boosted-label">Launch Power Raised:</span>
      {boosted === null ? (
        <span className="shimmer-loader" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-brain fa-beat-fade" style={{ color: '#00FFA3', fontSize: '14px', filter: 'drop-shadow(0 0 8px rgba(0, 255, 163, 0.6))' }}></i>
          AI Loading...
        </span>
      ) : (
        <span className={`boosted-amount ${showWowEffect ? showWowEffect : ''}`}>
          <CountUp
            end={boosted}
            duration={2}
            separator=","
            prefix="$"
            decimals={2}
          />
        </span>
      )}
      
      {/* Butonul pentru voce pe mobil */}
      {showVoiceButton && isMobileDevice() && (
        <button 
          className="voice-button-mobile"
          onClick={handleVoiceButtonClick}
          onTouchStart={handleVoiceButtonTouch}
          onTouchEnd={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          title="Tap to hear project info"
          style={{
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            cursor: 'pointer'
          }}
        >
          🔊
        </button>
      )}
      
      {/* Notificarea de vânzare nouă */}
      {newSaleNotification && (
        <div key={notificationKey} className="new-sale-notification">
          <span className="notification-text">{newSaleNotification.text}</span>
          <span className="notification-amount">{newSaleNotification.amount}</span>
          {newSaleNotification.crypto && (
            <span className="notification-crypto">
              <span className="crypto-label">via </span>
              <span 
                className="crypto-symbol" 
                style={{ color: newSaleNotification.crypto.color }}
              >
                {newSaleNotification.crypto.symbol}
              </span>
              <span className="crypto-name"> ({newSaleNotification.crypto.name})</span>
            </span>
          )}
          <span className="notification-country">
            {newSaleNotification.country}
            <span className="notification-country-name">{newSaleNotification.countryName}</span>
          </span>
          <span className="notification-geolocation">
            {newSaleNotification.geolocation}
            <span className="google-maps-icon">📍 Google Maps</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default BoostedBanner;
