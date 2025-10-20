import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SidebarMenu.css";

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
      <button className="btn-swap" disabled>
        <i className="fas fa-sync-alt"></i> Swap <span className="soon">SOON</span>
      </button>

      <button className="btn-pool" disabled>
        <i className="fas fa-database"></i> Pool <span className="soon">SOON</span>
      </button>

      <button
        className={`btn-how-to-buy ${isActive("howToBuy")}`}
        onClick={() => handleClick("howToBuy", "/how-to-buy")}
      >
        <i className="fas fa-shopping-cart"></i> How to Buy
      </button>

      <button
        className={`btn-tokenomics ${isActive("tokenomics")}`}
        onClick={() => handleClick("tokenomics", "/tokenomics")}
      >
        <i className="fas fa-chart-bar"></i> Tokenomics
      </button>

      <button
        className={`btn-how-it-works ${isActive("howItWorks")}`}
        onClick={() => handleClick("howItWorks", "/how-it-works")}
      >
        <i className="fas fa-cogs"></i> How It Works
      </button>

      <button
        className={`btn-roadmap ${isActive("roadmap")}`}
        onClick={() => handleClick("roadmap", "/roadmap")}
      >
        <i className="fas fa-route"></i> Roadmap
      </button>

      <button
        className={`btn-invite ${isActive("invite")}`}
        onClick={() => handleClick("invite", "/invite")}
      >
        <i className="fas fa-user-plus"></i> Invite
      </button>

      <button
        className={`btn-about ${isActive("about")}`}
        onClick={() => handleClick("about", "/about")}
      >
        <i className="fas fa-info-circle"></i> About
      </button>

      <button
        className={`btn-mindmirror ${isActive("mindMirror")}`}
        onClick={() => handleClick("mindMirror", "/mind-mirror")}
      >
        <i className="fas fa-brain"></i> Mind Mirror
      </button>

      <button className="btn-go-main" onClick={() => {
        clickSound.currentTime = 0;
        clickSound.play();
        navigate("/");
      }}>
        <i className="fas fa-home"></i> Go to Main Page
      </button>
    </div>
  );
};

export default SidebarMenu;
