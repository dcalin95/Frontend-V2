import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SidebarMenu.css";
import SmartTooltip from "../Presale/components/SmartTooltip"; // Import SmartTooltip

// Load click sound
const clickSound = new Audio(process.env.PUBLIC_URL + "/sounds/click.mp3");

const SidebarMenu = ({ isMenuOpen, setCurrentSection, currentSection }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Detectează pagina curentă din URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path === "/how-to-buy") return "howToBuy";
    if (path === "/about") return "about";
    if (path === "/tokenomics") return "tokenomics";
    if (path === "/how-it-works") return "howItWorks";
    if (path === "/roadmap") return "roadmap";
    if (path === "/invite") return "invite";
    if (path === "/mind-mirror") return "mindMirror";
    return "home";
  };

  const currentPage = getCurrentPage();
  const isActive = (section) => currentPage === section ? "selected" : "";

  const handleClick = (section, path) => {
    clickSound.currentTime = 0;
    clickSound.play();
    setCurrentSection(section);
    navigate(path);
  };

  return (
    <div className={`sidebar ${isMenuOpen ? "open" : ""}`}>
      <SmartTooltip content={`Swap Protocol\nTry the Live DEX Demo (Beta).\nStatus: Demo Active`}>
      <button className="btn-swap" onClick={() => handleClick("swap", "/dex-demo")}>
        <i className="fas fa-sync-alt"></i> Swap <span className="soon" style={{background:'#00FFA3', color:'#000', fontSize:'0.6rem', padding:'2px 4px'}}>(demo)</span>
      </button>
      </SmartTooltip>

      <SmartTooltip content={`Liquidity Pools\nProvide liquidity and earn fees.\nStatus: Coming Soon`}>
      <button className="btn-pool" disabled>
        <i className="fas fa-database"></i> Pool <span className="soon">SOON</span>
      </button>
      </SmartTooltip>

      <SmartTooltip content={`Purchase Guide\nStep-by-step instructions to buy BITS.`}>
      <button
        className={`btn-how-to-buy ${isActive("howToBuy")}`}
        onClick={() => handleClick("howToBuy", "/how-to-buy")}
      >
        <i className="fas fa-shopping-cart"></i> How to Buy
      </button>
      </SmartTooltip>

      <SmartTooltip content={`Token Economy\nDistribution, vesting, and utility details.`}>
      <button
        className={`btn-tokenomics ${isActive("tokenomics")}`}
        onClick={() => handleClick("tokenomics", "/tokenomics")}
      >
        <i className="fas fa-chart-bar"></i> Tokenomics
      </button>
      </SmartTooltip>

      <SmartTooltip content={`System Architecture\nHow the BitSwapDEX protocol works under the hood.`}>
      <button
        className={`btn-how-it-works ${isActive("howItWorks")}`}
        onClick={() => handleClick("howItWorks", "/how-it-works")}
      >
        <i className="fas fa-cogs"></i> How It Works
      </button>
      </SmartTooltip>

      <SmartTooltip content={`Project Timeline\nPast achievements and future milestones.`}>
      <button
        className={`btn-roadmap ${isActive("roadmap")}`}
        onClick={() => handleClick("roadmap", "/roadmap")}
      >
        <i className="fas fa-route"></i> Roadmap
      </button>
      </SmartTooltip>

      <SmartTooltip content={`Referral Program\nInvite friends and earn rewards.`}>
      <button
        className={`btn-invite ${isActive("invite")}`}
        onClick={() => handleClick("invite", "/invite")}
      >
        <i className="fas fa-user-plus"></i> Invite
      </button>
      </SmartTooltip>

      <SmartTooltip content={`About Us\nOur mission, vision, and team.`}>
      <button
        className={`btn-about ${isActive("about")}`}
        onClick={() => handleClick("about", "/about")}
      >
        <i className="fas fa-info-circle"></i> About
      </button>
      </SmartTooltip>

      <SmartTooltip content={`Mind Mirror AI\nAnalyze your psychological trading profile.`}>
      <button
        className={`btn-mindmirror ${isActive("mindMirror")}`}
        onClick={() => handleClick("mindMirror", "/mind-mirror")}
      >
        <i className="fas fa-brain"></i> Mind Mirror
      </button>
      </SmartTooltip>

      <SmartTooltip content={`Back to Dashboard\nReturn to the main landing page.`}>
      <button className="btn-go-main" onClick={() => {
        clickSound.currentTime = 0;
        clickSound.play();
        navigate("/");
      }}>
        <i className="fas fa-home"></i> Go to Main Page
      </button>
      </SmartTooltip>
    </div>
  );
};

export default SidebarMenu;
