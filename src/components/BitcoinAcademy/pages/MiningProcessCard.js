import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MiningProcessCard = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative w-full max-w-4xl mx-auto rounded-3xl p-4 sm:p-6 md:p-8 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 1.05 }}
    >


      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
        {/* Left side - Content */}
        <div className="space-y-4 sm:space-y-6 text-center lg:text-left order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
              Bitcoin Mining Process
            </h2>
            <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 mx-auto lg:mx-0" />
          </motion.div>

          <motion.p
            className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Miners compete to solve cryptographic puzzles using computational power. 
            The first to find a valid solution broadcasts the new block to the network.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 text-sm text-slate-400"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Network Security</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Proof of Work</span>
            </div>
          </motion.div>
        </div>

        {/* Right side - Enhanced Infographic */}
        <motion.div
          className="relative h-64 sm:h-80 lg:h-96 flex items-center justify-center order-1 lg:order-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <svg
            viewBox="0 0 400 380"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Enhanced background with circuit patterns */}
            <defs>
              <pattern id="circuit" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 0 20 L 20 20 L 20 0 M 20 20 L 40 20 M 20 20 L 20 40" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="0.8"/>
                <circle cx="20" cy="20" r="1.5" fill="rgba(59,130,246,0.15)"/>
              </pattern>
            </defs>
            <rect width="400" height="380" fill="url(#circuit)" />

            {/* Step 1: Advanced Mining Node */}
            <g>
              {/* Mining rig visual */}
              <motion.g
                animate={{ 
                  scale: isHovered ? 1.1 : 1,
                  rotate: isHovered ? 2 : 0
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Main mining container */}
                <rect x="170" y="30" width="60" height="40" rx="8" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="2"/>
                
                {/* GPU cards simulation */}
                <rect x="175" y="35" width="8" height="30" rx="2" fill="#22c55e" opacity="0.7"/>
                <rect x="185" y="35" width="8" height="30" rx="2" fill="#22c55e" opacity="0.8"/>
                <rect x="195" y="35" width="8" height="30" rx="2" fill="#22c55e" opacity="0.9"/>
                <rect x="205" y="35" width="8" height="30" rx="2" fill="#22c55e"/>
                <rect x="215" y="35" width="8" height="30" rx="2" fill="#22c55e" opacity="0.8"/>
                
                {/* Power indicator */}
                <motion.circle
                  cx="200" cy="45"
                  r="3"
                  fill="#22c55e"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                
                {/* Hash rate display */}
                <motion.rect
                  x="175" y="52" width="50" height="8" rx="2"
                  fill="rgba(34,197,94,0.2)"
                  animate={{ 
                    fill: ["rgba(34,197,94,0.2)", "rgba(34,197,94,0.4)", "rgba(34,197,94,0.2)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.g>
              
              {/* Clear descriptive text */}
              <text x="200" y="85" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="bold" className="sm:text-sm">MINING RIG</text>
              <text x="200" y="100" textAnchor="middle" fill="#94a3b8" fontSize="9" className="sm:text-xs">Computing power solving</text>
              <text x="200" y="112" textAnchor="middle" fill="#94a3b8" fontSize="9" className="sm:text-xs">cryptographic puzzles</text>
            </g>

            {/* Enhanced connecting flow */}
            <motion.path
              d="M 200 112 Q 200 130 200 145"
              stroke="url(#flow1)"
              strokeWidth="4"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Step 2: Enhanced Puzzle Solving */}
            <g>
              <motion.g
                animate={{ 
                  scale: isHovered ? 1.08 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Main puzzle container */}
                <rect x="160" y="150" width="80" height="50" rx="12" fill="rgba(168,85,247,0.15)" stroke="#a855f7" strokeWidth="2"/>
                
                {/* Hash visualization */}
                <text x="200" y="168" textAnchor="middle" fill="#a855f7" fontSize="10" fontFamily="monospace">SHA-256</text>
                
                {/* Puzzle pieces animation */}
                <motion.path
                  d="M 170 175 L 185 175 L 185 190 L 170 190 Z"
                  fill="rgba(168,85,247,0.3)"
                  stroke="#a855f7"
                  strokeWidth="1"
                  animate={{ 
                    x: [0, 5, 0],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.path
                  d="M 190 175 L 205 175 L 205 190 L 190 190 Z"
                  fill="rgba(168,85,247,0.4)"
                  stroke="#a855f7"
                  strokeWidth="1"
                  animate={{ 
                    x: [0, -3, 0],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
                <motion.path
                  d="M 215 175 L 230 175 L 230 190 L 215 190 Z"
                  fill="rgba(168,85,247,0.5)"
                  stroke="#a855f7"
                  strokeWidth="1"
                  animate={{ 
                    x: [0, 3, 0],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                />
                
                {/* Nonce counter simulation */}
                <text x="200" y="185" textAnchor="middle" fill="#a855f7" fontSize="8" fontFamily="monospace">nonce: {Math.floor(Math.random() * 999999)}</text>
              </motion.g>
              
              {/* Enhanced descriptive text */}
              <text x="200" y="220" textAnchor="middle" fill="#a855f7" fontSize="12" fontWeight="bold" className="sm:text-sm">PROOF OF WORK</text>
              <text x="200" y="235" textAnchor="middle" fill="#94a3b8" fontSize="9" className="sm:text-xs">Finding hash below target</text>
              <text x="200" y="247" textAnchor="middle" fill="#94a3b8" fontSize="9" className="sm:text-xs">through trial & error</text>
            </g>

            {/* Enhanced connecting flow */}
            <motion.path
              d="M 200 247 Q 200 265 200 280"
              stroke="url(#flow2)"
              strokeWidth="4"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
            />

            {/* Step 3: Enhanced Block Creation */}
            <g>
              <motion.g
                animate={{ 
                  scale: isHovered ? 1.08 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Block chain visualization */}
                <rect x="150" y="285" width="35" height="30" rx="6" fill="rgba(6,182,212,0.1)" stroke="#06b6d4" strokeWidth="1" opacity="0.5"/>
                <rect x="165" y="285" width="35" height="30" rx="6" fill="rgba(6,182,212,0.15)" stroke="#06b6d4" strokeWidth="1.5" opacity="0.7"/>
                <motion.rect
                  x="180" y="285" width="35" height="30" rx="6"
                  fill="rgba(6,182,212,0.2)"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  animate={{ 
                    fill: ["rgba(6,182,212,0.2)", "rgba(6,182,212,0.4)", "rgba(6,182,212,0.2)"],
                    strokeWidth: [2, 3, 2]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Block content indicators */}
                <text x="197" y="297" textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="bold">TX</text>
                <text x="197" y="306" textAnchor="middle" fill="#06b6d4" fontSize="6">HASH</text>
                
                {/* Chain links */}
                <motion.path
                  d="M 185 300 L 180 300"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <motion.path
                  d="M 200 300 L 215 300"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                />
              </motion.g>
              
              {/* Enhanced descriptive text */}
              <text x="200" y="335" textAnchor="middle" fill="#06b6d4" fontSize="12" fontWeight="bold" className="sm:text-sm">NEW BLOCK</text>
              <text x="200" y="350" textAnchor="middle" fill="#94a3b8" fontSize="9" className="sm:text-xs">Valid solution found,</text>
              <text x="200" y="362" textAnchor="middle" fill="#94a3b8" fontSize="9" className="sm:text-xs">block added to chain</text>
            </g>

            {/* Final enhanced flow */}
            <motion.path
              d="M 200 362 Q 220 375 250 375 Q 280 375 300 360"
              stroke="url(#flow3)"
              strokeWidth="4"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            />

            {/* Step 4: Enhanced Network Broadcast */}
            <g>
              <motion.g
                animate={{ 
                  scale: isHovered ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Central broadcast node */}
                <circle cx="320" cy="340" r="25" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="2"/>
                
                {/* Broadcast waves */}
                <motion.circle
                  cx="320" cy="340" r="20"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  animate={{ 
                    r: [20, 35, 20],
                    opacity: [1, 0.3, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.circle
                  cx="320" cy="340" r="15"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1"
                  animate={{ 
                    r: [15, 30, 15],
                    opacity: [1, 0.2, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                
                {/* Network nodes */}
                <motion.circle cx="290" cy="320" r="4" fill="#fbbf24" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}/>
                <motion.circle cx="350" cy="320" r="4" fill="#fbbf24" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}/>
                <motion.circle cx="300" cy="360" r="4" fill="#fbbf24" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}/>
                <motion.circle cx="340" cy="360" r="4" fill="#fbbf24" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}/>
                
                <text x="320" y="345" textAnchor="middle" fill="#fbbf24" fontSize="12">🌐</text>
              </motion.g>
              
              {/* Enhanced descriptive text */}
              <text x="320" y="295" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold" className="sm:text-sm">NETWORK SYNC</text>
              <text x="320" y="280" textAnchor="middle" fill="#94a3b8" fontSize="9" className="sm:text-xs">Broadcasting solution</text>
              <text x="320" y="268" textAnchor="middle" fill="#94a3b8" fontSize="9" className="sm:text-xs">to all network nodes</text>
            </g>

            {/* Enhanced gradient definitions */}
            <defs>
              <linearGradient id="flow1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="1"/>
                <stop offset="50%" stopColor="#16a34a" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#a855f7" stopOpacity="1"/>
              </linearGradient>
              <linearGradient id="flow2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="1"/>
                <stop offset="50%" stopColor="#9333ea" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="1"/>
              </linearGradient>
              <linearGradient id="flow3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="1"/>
                <stop offset="50%" stopColor="#0891b2" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="1"/>
              </linearGradient>
            </defs>
          </svg>

          {/* Enhanced floating data particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                left: `${15 + i * 7}%`,
                top: `${25 + (i % 4) * 20}%`,
                backgroundColor: ['#22c55e', '#a855f7', '#06b6d4', '#fbbf24'][i % 4],
              }}
              animate={{
                y: [-15, 15, -15],
                x: [-5, 5, -5],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 3 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        className="mt-6 sm:mt-8 pt-3 sm:pt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-xs sm:text-sm text-slate-500">
          Part of Bitcoin Academy educational module • <span className="text-blue-400">bits-ai.io</span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default MiningProcessCard;