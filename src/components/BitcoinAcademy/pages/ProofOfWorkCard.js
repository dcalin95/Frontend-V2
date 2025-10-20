import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ProofOfWorkCard = () => {
  const [hovered, setHovered] = useState(false);
  const [txRate, setTxRate] = useState(180);
  const [burstId, setBurstId] = useState(0);
  const [burstActive, setBurstActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const baseMin = hovered ? 220 : 140;
      const baseMax = hovered ? 480 : 300;
      const value = Math.round((baseMin + Math.random() * (baseMax - baseMin)));
      setTxRate(value);
    }, 1100);
    return () => clearInterval(interval);
  }, [hovered]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="group relative w-full overflow-visible rounded-3xl p-0"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => {
        setBurstId((b) => b + 1);
        setBurstActive(true);
        window.setTimeout(() => setBurstActive(false), 1300);
      }}
    >
      {/* Subtle animated border only, no opaque background */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-3xl"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(79,129,255,.25), rgba(124,58,237,.2), rgba(247,147,30,.2), rgba(79,129,255,.25))',
          mask: 'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
          WebkitMask:
            'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px'
        }}
        initial={{ rotate: 0, opacity: 0.25 }}
        animate={{ rotate: 360, opacity: 0.4 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
        {/* Left: Animated Infographic */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative w-full"
        >
          {/* Clarity code runner overlay (right top of infographic) */}
          <div className="hidden xl:block absolute right-0 -top-4 w-72">
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-indigo-300">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Clarity Runner
              </span>
              <span className="text-slate-400">Stacks</span>
            </div>
            <div className="relative h-36 overflow-hidden rounded-xl bg-slate-950/70 ring-1 ring-indigo-500/30 shadow-lg">
              <motion.div className="absolute inset-x-0" animate={{ y: ['0%', '-120%'] }} transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}>
                <div className="p-3 font-mono text-[11px] leading-5 text-indigo-100">
                  <div><span className="text-green-400">(define-constant</span> BTC <span className="text-orange-300">'SP000000000000000000002Q6VF78.btc</span>)</div>
                  <div><span className="text-green-400">(define-public</span> (mine <span className="text-cyan-300">(nonce uint)</span>)</div>
                  <div className="pl-4">(let ((header <span className="text-purple-300">(concat</span> <span className="text-cyan-300">(to-utf8 "bitcoin")</span> <span className="text-cyan-300">(buff nonce)</span>)))</div>
                  <div className="pl-8">(hash <span className="text-purple-300">(sha256</span> <span className="text-purple-300">(sha256</span> header<span className="text-purple-300">)</span><span className="text-purple-300">)</span>)</div>
                  <div className="pl-4">)</div>
                  <div className="pl-4">(<span className="text-green-400">ok</span> hash))</div>
                  <div><span className="text-green-400">)</span></div>
                  <div className="mt-2">;; emit event when below target</div>
                  <div>(<span className="text-green-400">begin</span></div>
                  <div className="pl-4">(<span className="text-green-400">print</span> <span className="text-cyan-300">{'{'}"pow": "valid", "chain": "bitcoin"{'}'}</span>)</div>
                  <div className="pl-4">(<span className="text-green-400">ok</span> <span className="text-cyan-300">true</span>)</div>
                  <div>)</div>
                  <div className="mt-3 opacity-60">(comment "Stacks + Bitcoin security")</div>
                </div>
              </motion.div>
              <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-slate-400">running...</div>
            </div>
          </div>
          {/* HTML fallback overlay for Matrix stream (ensures visibility across browsers) */}
          <motion.div
            className="pointer-events-none absolute hidden md:block"
            style={{ left: 168, top: 60, width: 72, height: 140 }}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: hovered ? 1 : 0.85 }}
          >
            <div className="absolute inset-0 rounded-md bg-gradient-to-b from-transparent to-[#0b1220]/70" />
            {Array.from({ length: 8 }).map((_, colIdx) => (
              <motion.div
                key={`html-mx-col-${colIdx}`}
                className="absolute text-[13px] font-mono leading-4 text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                style={{ left: 4 + colIdx * 9, top: 0 }}
                animate={{ y: [-160, 160] }}
                transition={{ duration: (hovered ? 2.0 : 4.0) + colIdx * (hovered ? 0.18 : 0.35), repeat: Infinity, ease: 'linear' }}
              >
                {Array.from({ length: 20 }).map((__, rowIdx) => (
                  <div key={`html-mx-cell-${colIdx}-${rowIdx}`} className="[text-shadow:0_0_6px_#16a34a]">
                    {['₿','A','3','F','9','C','0','7','B','E','1','D'][(rowIdx + colIdx) % 12]}
                  </div>
                ))}
              </motion.div>
            ))}
          </motion.div>

          <motion.svg
            viewBox="0 0 720 360"
            className="w-full h-[260px] sm:h-[300px] md:h-[340px]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background grid */}
            <defs>
              <linearGradient id="pow-grad-blue" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#4f81ff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="pow-grad-orange" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#f7931e" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffb347" stopOpacity="0.9" />
              </linearGradient>
              <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowOrange" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowGreenPow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="matrixBgPow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0b1220" stopOpacity="0" />
                <stop offset="100%" stopColor="#0b1220" stopOpacity="0.22" />
              </linearGradient>
            </defs>

            {/* --- Left: Block header construction --- */}
            {/* Labels */}
            <text x="40" y="30" fill="#a5b4fc" fontSize="12" fontWeight="700">1) Build Block Header</text>
            <text x="170" y="48" fill="#34d399" fontSize="10" fontWeight="700">Transactions</text>

            {/* Inputs */}
            <rect x="40" y="52" width="120" height="34" rx="6" fill="#0b1220" stroke="#4f81ff" strokeWidth="2">
              <title>Previous Block Hash (links block to the chain)</title>
            </rect>
            <text x="52" y="73" fill="#e2e8f0" fontSize="12">Prev Hash</text>

            <rect x="40" y="98" width="120" height="34" rx="6" fill="#0b1220" stroke="#4f81ff" strokeWidth="2">
              <title>Merkle Root (hash of all transactions)</title>
            </rect>
            <text x="52" y="119" fill="#e2e8f0" fontSize="12">Merkle Root</text>

            <rect x="40" y="144" width="120" height="34" rx="6" fill="#0b1220" stroke="#4f81ff" strokeWidth="2">
              <title>Nonce (number miners change to find a valid hash)</title>
            </rect>
            <text x="52" y="165" fill="#e2e8f0" fontSize="12">Nonce</text>

            {/* Animated nonce dial */}
            <g transform="translate(170, 144)">
              <clipPath id="nonceClipPow">
                <rect x="0" y="0" width="28" height="34" rx="4" />
              </clipPath>
              <rect x="0" y="0" width="28" height="34" rx="4" fill="#0b1220" stroke="#7c3aed" strokeWidth="1.5" />
              <motion.g clipPath="url(#nonceClipPow)" animate={{ y: [0, -300, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}>
                {Array.from({ length: 11 }).map((_, i) => (
                  <text key={`nz-${i}`} x="9" y={22 + i * 28} fill="#c7d2fe" fontSize="14" textAnchor="middle">{i % 10}</text>
                ))}
              </motion.g>
            </g>

            {/* Matrix-style transaction streams feeding into Merkle Root */}
            <clipPath id="txClipAreaPow">
              <rect x="168" y="60" width="72" height="140" rx="8" />
            </clipPath>
            {/* subtle bg to increase contrast */}
            <rect x="168" y="60" width="72" height="140" rx="8" fill="url(#matrixBgPow)" stroke="#053b2c" strokeWidth="1" opacity="0.9" />
            <g clipPath="url(#txClipAreaPow)">
              { /* Hover-controlled speed */ }
              {Array.from({ length: 8 }).map((_, colIdx) => (
                <motion.g
                  key={`mx-col-${colIdx}`}
                  transform={`translate(${172 + colIdx * 9}, 60)`}
                  animate={{ y: [-160, 160] }}
                  transition={{ duration: (hovered ? 2.0 : 4.0) + colIdx * (hovered ? 0.18 : 0.35), repeat: Infinity, ease: 'linear' }}
                >
                  {Array.from({ length: 16 }).map((__, rowIdx) => (
                    <motion.text
                      key={`mx-cell-${colIdx}-${rowIdx}`}
                      x={0}
                      y={rowIdx * 14}
                      fill={hovered ? '#bbf7d0' : '#22c55e'}
                      stroke="#073b1a"
                      strokeWidth="0.6"
                      fontSize="14"
                      fontFamily="monospace"
                      textAnchor="middle"
                      filter="url(#glowGreenPow)"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: hovered ? 0.7 : 1.1, delay: rowIdx * 0.06 + colIdx * 0.04, repeat: Infinity }}
                    >
                      {['₿','A','3','F','9','C','0','7','B','E','1','D'][(rowIdx + colIdx) % 12]}
                    </motion.text>
                  ))}
                </motion.g>
              ))}
            </g>

            {/* TX burst wave on click */}
            {burstActive && (
              <g key={`burst-${burstId}`}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <motion.circle
                    key={`burst-dot-${i}`}
                    cx={170 + (i % 3) * 6}
                    cy={70 + i * 8}
                    r={2.2}
                    fill={i % 2 === 0 ? '#86efac' : '#22c55e'}
                    filter="url(#glowGreenPow)"
                    initial={{ opacity: 0 }}
                    animate={{
                      x: [0, 40, 80, 120],
                      y: [0, 0, 4, 6],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ duration: 1.1 + i * 0.03, ease: 'easeOut' }}
                  />
                ))}
              </g>
            )}

            {/* Merkle Root pulse on hover */}
            <motion.rect
              x="40"
              y="98"
              width="120"
              height="34"
              rx="6"
              fill="transparent"
              stroke="#34d399"
              strokeWidth={2}
              filter="url(#glowGreen)"
              animate={{ opacity: hovered ? [0, 0.8, 0] : 0, strokeWidth: hovered ? [1, 2, 1] : 1 }}
              transition={{ duration: 1.2, repeat: hovered ? Infinity : 0 }}
            />

            {/* Arrows to hasher */}
            {[70, 116, 162].map((yy, i) => (
              <g key={`arr-${i}`}> 
                <motion.line x1="160" y1={yy-8} x2="215" y2={yy-8} stroke="#64748b" strokeWidth="2" strokeDasharray="6 6" animate={{ strokeDashoffset: [12, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <polygon points={`${215},${yy-12} ${215},${yy-4} ${222},${yy-8}`} fill="#64748b" />
              </g>
            ))}

            {/* Hasher */}
            <rect x="230" y="68" width="128" height="76" rx="12" fill="#0b1220" stroke="#7c3aed" strokeWidth="2" filter="url(#glowBlue)">
              <title>Double SHA-256: the header is hashed twice for security</title>
            </rect>
            <text x="242" y="95" fill="#ddd6fe" fontSize="12">SHA-256</text>
            <text x="242" y="113" fill="#ddd6fe" fontSize="12">SHA-256</text>
            <line x1="280" y1="89" x2="280" y2="108" stroke="#7c3aed" strokeWidth="2" />
            <polygon points="280,108 276,104 284,104" fill="#7c3aed" />
            <text x="242" y="128" fill="#94a3b8" fontSize="11">Hash Header</text>

            {/* Moving dot through hasher */}
            <motion.circle cx="230" cy="86" r="3" fill="#7c3aed" animate={{ cx: [230, 358, 358], cy: [86, 86, 112] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />

            {/* Output hash */}
            <rect x="390" y="84" width="210" height="36" rx="8" fill="#0b1220" stroke="#4f81ff" strokeWidth="2">
              <title>Block header hash (must be below target)</title>
            </rect>
            <motion.text x="400" y="106" fill="#93c5fd" fontSize="12" letterSpacing="1" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.6, repeat: Infinity }}>
              000000ab93f1c4...9e
            </motion.text>

            {/* Target gauge */}
            <text x="390" y="138" fill="#a5b4fc" fontSize="12" fontWeight="700">2) Compare to Target</text>
            <rect x="390" y="148" width="210" height="10" rx="5" fill="#0b1220" stroke="#334155" />
            <rect x="390" y="148" width="96" height="10" rx="5" fill="url(#pow-grad-blue)" />
            <text x="602" y="157" fill="#e2e8f0" fontSize="10" textAnchor="end">Target</text>
            <motion.text x="390" y="166" fill="#94a3b8" fontSize="10" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}>Attempting...</motion.text>

            {/* Success pulse */}
            <motion.circle cx="604" cy="153" r="4" fill="#22c55e" animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />

            {/* New block appended */}
            <text x="40" y="212" fill="#a5b4fc" fontSize="12" fontWeight="700">3) Add New Block</text>
            {/* Existing chain */}
            {Array.from({ length: 3 }).map((_, i) => (
              <rect key={`cb-${i}`} x={40 + i * 70} y={228} width="60" height="32" rx="6" fill="#0b1220" stroke="#4f81ff" />
            ))}
            {/* Appending block animation */}
            <motion.rect x="270" y="228" width="60" height="32" rx="6" fill="#0b1220" stroke="url(#pow-grad-orange)" filter="url(#glowOrange)" animate={{ x: [270, 250, 250, 270], opacity: [0.9, 1, 0, 0.9] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.25, 0.3, 1] }} />
            <motion.line x1="230" y1="244" x2="250" y2="244" stroke="#f7931e" strokeWidth="2" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.6, repeat: Infinity }} />
            <motion.g transform="translate(320, 220)" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 4, repeat: Infinity, times: [0.23, 0.35, 0.4] }}>
              <circle cx="0" cy="0" r="10" fill="none" stroke="#22c55e" strokeWidth="2" />
              <path d="M -4 0 l 3 3 l 6 -6" stroke="#22c55e" strokeWidth="2" fill="none" />
            </motion.g>

            {/* Broadcast label */}
            <text x="40" y="286" fill="#a5b4fc" fontSize="12" fontWeight="700">4) Broadcast to Network</text>
            <motion.circle cx="40" cy="304" r="8" fill="#0b1220" stroke="#4f81ff" />
            <motion.circle cx="80" cy="304" r="8" fill="#0b1220" stroke="#4f81ff" />
            <motion.circle cx="120" cy="304" r="8" fill="#0b1220" stroke="#4f81ff" />
            {[40, 80].map((x, i) => (
              <motion.line key={`bc-${i}`} x1={x+8} y1="304" x2={x+32} y2="304" stroke="#4f81ff" strokeWidth="2" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.4 + i * 0.3, repeat: Infinity }} />
            ))}
          </motion.svg>
        </motion.div>

        {/* Right: Title and description */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 ring-1 ring-blue-400/30">
              AI-Powered Visualization
            </span>
            <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold text-orange-300 ring-1 ring-orange-400/30">
              Live
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-300">
            Bitcoin Mining – Proof of Work & Network Security
          </h2>
          <p className="text-slate-200/95 text-base sm:text-lg leading-relaxed">
            <span className="text-slate-100">Proof of Work</span> is Bitcoin's consensus mechanism where <span className="text-blue-300">miners</span> compete to solve
            computational puzzles. This process <span className="text-orange-300">secures the network</span> and validates transactions on the
            <span className="text-blue-300"> blockchain</span>.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_theme(colors.blue.400/.7)]" />
              <span className="text-slate-100/95">Miners use computational power to solve complex math problems.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_10px_theme(colors.orange.400/.7)]" />
              <span className="text-slate-100/95">The first miner to solve the puzzle adds a block to the blockchain.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_theme(colors.blue.400/.7)]" />
              <span className="text-slate-100/95">This process secures the network and prevents double spending.</span>
            </li>
          </ul>

          <div className="pt-2 text-xs text-slate-400">AI-styled infographic • Hover or tap to see glow and motion effects</div>
        </motion.div>
      </div>
      {/* Mini Legend (right side) */}
      <div className="mt-4 md:mt-2 md:absolute md:right-3 md:bottom-3 md:top-auto flex flex-wrap gap-2 md:flex-col md:items-end md:bg-slate-900/40 md:ring-1 md:ring-slate-700 md:rounded-xl md:px-2 md:py-2 md:max-w-[230px] z-10 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-full bg-slate-900/60 ring-1 ring-slate-700 px-3 py-1">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">TX/sec</span>
          <span className="font-mono text-sm text-blue-300">{txRate}</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-900/60 ring-1 ring-slate-700 px-3 py-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-400" />
          <span className="text-xs text-slate-300">Hash/Block</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-900/60 ring-1 ring-slate-700 px-3 py-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-indigo-400" />
          <span className="text-xs text-slate-300">Hasher</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-900/60 ring-1 ring-slate-700 px-3 py-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-orange-400" />
          <span className="text-xs text-slate-300">Incoming Block</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-900/60 ring-1 ring-slate-700 px-3 py-1">
          <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
          <span className="text-xs text-slate-300">Valid (below target)</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProofOfWorkCard;


