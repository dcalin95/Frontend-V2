import React, { useEffect, useState } from "react";
import "./WelcomePage.css";
import { trackTikTokEvent } from "../utils/tiktok";
import orbitIllustration from "../assets/orbit-background.webp";

const Typewriter = ({ text, speed = 20, startDelay = 0 }) => {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => {
        if (!mounted) { clearInterval(id); return; }
        i++;
        setDisplay(text.slice(0, i));
        if (i >= text.length) clearInterval(id);
      }, speed);
    }, startDelay);
    return () => { mounted = false; clearTimeout(timer); };
  }, [text, speed, startDelay]);
  return <span>{display}</span>;
};

const setOrUpdateMeta = (name, content, attr = "name") => {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const WelcomePage = () => {
  useEffect(() => {
    // SEO meta tags (runtime update for SPA)
    document.title = "BitSwapDEX AI — Decentralized Intelligence Hub";
    setOrUpdateMeta(
      "description",
      "Explore the next generation of AI-powered decentralized trading. Join BitSwapDEX AI and unlock the fusion of neural computation and blockchain analytics.",
      "name"
    );
    setOrUpdateMeta("og:title", "BitSwapDEX AI — Decentralized Intelligence Hub", "property");
    setOrUpdateMeta(
      "og:description",
      "Explore the next generation of AI-powered decentralized trading. Join BitSwapDEX AI and unlock the fusion of neural computation and blockchain analytics.",
      "property"
    );
    setOrUpdateMeta("og:type", "website", "property");
    setOrUpdateMeta("og:url", "https://bits-ai.io/welcome", "property");
    setOrUpdateMeta("og:image", "https://bits-ai.io/og-image.jpg", "property");

    // nothing else to init for static illustration
  }, []);

  const titleLine1 = "Welcome to BitSwapDEX AI —";
  const titleLine2 = "The Future of Decentralized Intelligence";
  const subtitleText = "Discover the AI-driven crypto ecosystem that merges blockchain precision with neuro-adaptive trading intelligence.";

  const renderWord = (word, idxPrefix) => (
    <span className="word" key={`w-${idxPrefix}`}>{Array.from(word).map((ch, i) => (
      <span className="glyph" key={`g-${idxPrefix}-${i}`}>{ch}</span>
    ))}</span>
  );

  const renderLine = (text, lineKey) => {
    const parts = text.split(" ");
    return parts.map((w, i) => (
      <React.Fragment key={`${lineKey}-${i}`}>
        {renderWord(w, `${lineKey}-${i}`)}{i < parts.length - 1 ? ' ' : ''}
      </React.Fragment>
    ));
  };

  return (
    <div className="welcome-root">
      <main className="welcome-wrapper" role="main">
        <section className="welcome-center" aria-label="Welcome to BitSwapDEX AI">
          <h1 className="welcome-title" aria-label={`${titleLine1} ${titleLine2}`}>
            <span className="line">{renderLine(titleLine1, 'l1')}</span>
            <span className="line">{renderLine(titleLine2, 'l2')}</span>
          </h1>
          <p className="welcome-subtitle" aria-label={subtitleText}><Typewriter text={subtitleText} speed={16} /></p>

          <section className="welcome-info" aria-label="About BitSwapDEX AI">
            <p className="info-lead"><Typewriter text="A streamlined gateway to our AI‑assisted, on‑chain analytics and learning tools." speed={16} /></p>
            <ul className="info-list">
              <li><strong>Neural Analytics</strong>: <Typewriter text="real‑time patterns and context for informed decisions." speed={16} startDelay={150} /></li>
              <li><strong>Unified Dashboard</strong>: <Typewriter text="portfolio view, signals and interactive learning in one place." speed={16} startDelay={300} /></li>
              <li><strong>Transparent by Design</strong>: <Typewriter text="on‑chain interactions and auditable components." speed={16} startDelay={450} /></li>
              <li><strong>Community First</strong>: <Typewriter text="updates via our official channels and opt‑in notifications." speed={16} startDelay={600} /></li>
            </ul>
            <p className="info-risk"><strong>Risk & Responsibility</strong>: <Typewriter text="Digital assets can be volatile. Do your own research and use best‑practice security. This page is informational and not financial advice." speed={16} startDelay={800} /></p>
          </section>

          {/* Supplied marketing copy with split layout around the central image */}
          <section className="welcome-hero-copy" aria-label="BitSwapDEX AI overview">
            <h2 className="hero-title" translate="no">
              <span className="hero-line">🧠 BitSwapDEX AI</span>
              <span className="hero-subline">The Dawn of Decentralized Intelligence</span>
            </h2>
            <p className="hero-sub" translate="no">Step into the future where Artificial Intelligence meets Blockchain. BitSwapDEX AI is more than a platform — it’s an autonomous ecosystem built to learn, predict, and evolve with every transaction.</p>

            <div className="split-wrap">
              <div className="split-col left panel">
                <ul className="hero-list type">
                  <li translate="no"><span className="dot">💠</span> <Typewriter text="AI-Driven Trading: Neural algorithms analyze live market data to assist human-level decision-making." speed={18} /></li>
                  <li translate="no"><span className="dot">💠</span> <Typewriter text="Cross-Chain Staking: Earn dynamic rewards through a unified $BITS economy." speed={18} startDelay={400} /></li>
                  <li translate="no"><span className="dot">💠</span> <Typewriter text="Behavioral Analytics: Understand investor psychology and optimize your portfolio in real-time." speed={18} startDelay={800} /></li>
                  <li translate="no"><span className="dot">💠</span> <Typewriter text="Education & Research: Empowering traders with transparent AI models and real crypto knowledge." speed={18} startDelay={1200} /></li>
                </ul>
              </div>

              <div className="split-col center">
                <div
                  className="image-guard"
                  onContextMenu={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <img
                    className="welcome-illustration"
                    src={orbitIllustration}
                    alt="BitPulse Orbit Illustration"
                    draggable={false}
                  />
                  <div className="image-shield" aria-hidden="true" />
                </div>
              </div>

              <div className="split-col right panel">
                <h3 className="hero-why" translate="no">🌍 Why BitSwapDEX AI?</h3>
                <p className="hero-sub small" translate="no"><Typewriter text="Because the future of finance isn’t centralized — it’s cognitive. We build technology that thinks, adapts, and rewards intelligence." speed={16} /></p>
                <p className="hero-cta-note" translate="no"><Typewriter text="Join the movement redefining decentralized trading." speed={16} startDelay={600} /></p>
              </div>
            </div>

            <div className="hero-sep" aria-hidden="true" />
          </section>

          <a
            className="welcome-cta small"
            href="https://t.me/BitSwapDEX_AI_BITS"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open BitSwapDEX AI Telegram channel"
            style={{ marginRight: 10 }}
            onClick={() => { trackTikTokEvent('CompleteRegistration', { content_name: 'Telegram Join', method: 'welcome_page' }, { retry: true }); }}
          >
            Join Telegram Channel
          </a>

          <a
            className="welcome-cta"
            href="https://t.me/BitSwapDEX_AI_BITS"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open BitSwapDEX AI Telegram channel"
            onClick={() => { try { if (window.ttq && typeof window.ttq.track === 'function') { window.ttq.track('ClickButton', { button_name: 'EnterDashboard' }); } } catch(_){} }}
          >
            Enter Dashboard
          </a>
          <div className="welcome-legal">
            <a href="/terms">Terms</a>
            <a href="/privacy-policy">Privacy</a>
            <a href="mailto:contact@bits-ai.io">Contact</a>
          </div>
          <div className="welcome-note">By continuing, you’ll access the BitSwapDEX AI Telegram channel.</div>

          <div className="welcome-footer">© 2025 BitSwapDEX AI. All rights reserved. Powered by Neural Web Protocols.</div>
        </section>
      </main>
    </div>
  );
};

export default WelcomePage;


