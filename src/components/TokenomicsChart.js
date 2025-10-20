import React, { useState, useRef, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import "./TokenomicsChart.css";

/**
 * Props:
 * - totalSupply (num)    -> total BITS (default 3_000_000_000)
 * - initialPrice (num)   -> USD per BITS (ex: 0.0001)
 * - sections (array)     -> dacă vrei să suprascrii distribuția implicită
 *
 * Notă: amount se calculează automat din procent * totalSupply.
 */
const DEFAULT_SECTIONS = [
  { name: "CEX & DEX Liquidity", value: 12, color: "#00ffe0", description: "Liquidity for trading pairs" },
  { name: "Public Presale",      value: 35, color: "#e040fb", description: "Public token sale" },
  { name: "Team & Advisors",     value: 7,  color: "#9c27ff", description: "Team allocation (with vesting)" },
  { name: "Treasury",            value: 16, color: "#2196f3", description: "Project treasury & runway" },
  { name: "Ecosystem Growth",    value: 18, color: "#ff9800", description: "Ecosystem development & grants" },
  { name: "Marketing & Community", value: 12, color: "#f50057", description: "Marketing initiatives & community" },
];

const formatNumber = (n) =>
  Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const TokenomicsChart = ({
  totalSupply = 3_000_000_000,
  initialPrice = 0.0001,
  sections = DEFAULT_SECTIONS,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [explodedIndex, setExplodedIndex] = useState(null);
  const chartRef = useRef(null);

  // calculează amount pentru fiecare secțiune dinamic, pe baza totalSupply
  const data = useMemo(
    () =>
      sections.map((s) => ({
        ...s,
        amount: Math.round((s.value / 100) * totalSupply),
        amountLabel: `${formatNumber(Math.round((s.value / 100) * totalSupply))}`,
      })),
    [sections, totalSupply]
  );

  const totalPercent = useMemo(
    () => data.reduce((acc, d) => acc + d.value, 0),
    [data]
  );

  const handleMouseEnter = (index) => {
    setActiveIndex(index);
    setExplodedIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
    setExplodedIndex(null);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, index }) => {
    if (explodedIndex === index) {
      const RADIAN = Math.PI / 180;
      const radius = outerRadius * 1.3;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <motion.text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="exploded-label"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </motion.text>
      );
    }
    return null;
  };

  // împărțire stânga/dreapta în mod echilibrat
  const leftData = data.slice(0, Math.ceil(data.length / 2));
  const rightData = data.slice(Math.ceil(data.length / 2));

  return (
    <Box className="tokenomics-container">
      <Typography
        variant="h4"
        className="tokenomics-title"
        sx={{
          marginTop: "3rem",
          marginBottom: "2rem",
          color: "#00ffe0",
          textShadow: "0 0 15px #00ffe0, 0 0 30px #9c27ff, 0 0 45px #e040fb",
          fontSize: "3.2rem",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        BitSwapDEX AI Tokenomics
      </Typography>

      {/* info suplimentară deasupra graficului (fără Initial Price) */}
      <Box sx={{ textAlign: "center", marginBottom: "1rem", opacity: 0.9 }}>
        <Typography variant="body1">
          Total Supply: <b>{formatNumber(totalSupply)}</b> $BITS &nbsp;•&nbsp; Coverage: <b>{totalPercent}%</b>
        </Typography>
      </Box>

      <Box className="chart-wrapper">
        {/* Carduri stânga */}
        <Box className="left-cards">
          {leftData.map((entry, idx) => {
            const index = idx; // index relativ în data
            return (
              <motion.div
                key={entry.name}
                className={`floating-card ${activeIndex === index ? "active" : ""} ${explodedIndex === index ? "exploded" : ""}`}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0.85,
                  scale: activeIndex === index ? 1.05 : 1,
                  y: 0,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${entry.color}` }}
              >
                <div className="card-glow" style={{ backgroundColor: entry.color }} />
                <h3 style={{ color: entry.color }}>{entry.name}</h3>
                <p className="amount">{entry.amountLabel} $BITS</p>
                <p className="percentage">{entry.value}%</p>
                {explodedIndex === index && (
                  <motion.p
                    className="description"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.25 }}
                  >
                    {entry.description}
                  </motion.p>
                )}
              </motion.div>
            );
          })}
        </Box>

        {/* Grafic */}
        <Box className="chart-center">
          <div className="chart-glow-effect"></div>
          <ResponsiveContainer width="100%" height={520}>
            <PieChart ref={chartRef}>
              <Pie
                data={data}
                innerRadius={explodedIndex !== null ? 60 : 90}
                outerRadius={explodedIndex !== null ? 160 : 140}
                paddingAngle={explodedIndex !== null ? 15 : 5}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={false}
                isAnimationActive
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={entry.color}
                    className={`chart-cell ${activeIndex === index ? "active" : ""} ${explodedIndex === index ? "exploded" : ""}`}
                    style={{
                      filter: activeIndex === index ? `drop-shadow(0 0 15px ${entry.color})` : "none",
                      transform: explodedIndex === index ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.25s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* centru – înlocuit textul cu faviconul BITS */}
          <div className="energy-core">
            <div className="energy-core-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/favicon.ico" alt="$BITS" className="bits-core-icon" />
            </div>
          </div>
        </Box>

        {/* Carduri dreapta */}
        <Box className="right-cards">
          {rightData.map((entry, idx) => {
            const index = idx + leftData.length;
            return (
              <motion.div
                key={entry.name}
                className={`floating-card ${activeIndex === index ? "active" : ""} ${explodedIndex === index ? "exploded" : ""}`}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: activeIndex === index ? 1 : 0.85,
                  scale: activeIndex === index ? 1.05 : 1,
                  y: 0,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${entry.color}` }}
              >
                <div className="card-glow" style={{ backgroundColor: entry.color }} />
                <h3 style={{ color: entry.color }}>{entry.name}</h3>
                <p className="amount">{entry.amountLabel} $BITS</p>
                <p className="percentage">{entry.value}%</p>
                {explodedIndex === index && (
                  <motion.p
                    className="description"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.25 }}
                  >
                    {entry.description}
                  </motion.p>
                )}
              </motion.div>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default TokenomicsChart;
