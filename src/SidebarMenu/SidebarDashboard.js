// src/SidebarMenu/SidebarDashboard.js

import React, { useState } from "react";
import SidebarMenu from "./SidebarMenu";
import TokenomicsChart from "../components/TokenomicsChart";
import HowToBuy from "../components/HowToBuy";
import About from "../components/About";
import HowItWorks from "../components/HowItWorks";
import Whitepaper from "../components/Whitepaper";
import InvitePage from "../components/Invite/InvitePage";

const SidebarDashboard = () => {
  const [currentSection, setCurrentSection] = useState("tokenomics");

  const renderSection = () => {
    switch (currentSection) {
      case "tokenomics":
        return <TokenomicsChart />;
      case "howToBuy":
        return <HowToBuy />;
      case "about":
        return <About />;
      case "howItWorks":
        return <HowItWorks />;
      case "whitepaper":
        return <Whitepaper />;
        case "invite":
  return <InvitePage />;
      default:
        return <div style={{ color: "#fff", padding: "20px" }}>📄 Select a section from the sidebar.</div>;
    }
  };

  return (
    <div className="dashboard-layout" style={{ display: "flex" }}>
      <SidebarMenu
        isMenuOpen={true}
        setCurrentSection={setCurrentSection}
        currentSection={currentSection}
      />
      <div className="dashboard-content" style={{ flex: 1, padding: "20px" }}>
        {renderSection()}
      </div>
    </div>
  );
};

export default SidebarDashboard;
