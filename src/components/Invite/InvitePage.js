// src/components/Invite/InvitePage.jsx
import React from "react";
import ClaimInviteComponent from "./ClaimInviteComponent";
import InviteButton from "./InviteButton";
import "./ClaimInviteComponent.css";
import "./InviteButton.css";
import "./InvitePage.css";


const InvitePage = () => {
  return (
    <div className="invite-page-container">
      <h1 className="invite-page-title">Claim Your Invite</h1>

      <div className="invite-button-wrapper">
        <InviteButton />
      </div>

      <ClaimInviteComponent />
    </div>
  );
};

export default InvitePage;
