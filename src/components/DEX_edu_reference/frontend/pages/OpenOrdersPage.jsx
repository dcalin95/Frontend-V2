/**
 * Open Orders – rută dedicată: /dex-edu/open-orders
 * Afișare sub header, toolbar: Half screen, Popup, Copy, Email, Save to computer.
 */

import React, { useState } from 'react';
import Modal from '../components/common/Modal/Modal';
import OrdersListView from '../components/trade/OrdersListView';
import '../styles/pages.css';
import '../styles/components/orders-list-view.css';

const OpenOrdersPage = () => {
  const [showPopup, setShowPopup] = useState(false);

  const handleHalfScreen = () => {
    window.open(
      `${window.location.origin}/dex-edu/open-orders`,
      '_blank',
      'width=900,height=700,scrollbars=yes,resizable=yes'
    );
  };

  return (
    <div className="orders-page">
      <OrdersListView
        type="openOrders"
        title="Open Orders"
        onOpenHalfScreen={handleHalfScreen}
        onOpenPopup={() => setShowPopup(true)}
      />
      {showPopup && (
        <Modal
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          title="Open Orders"
          size="large"
          className="orders-list-modal"
        >
          <OrdersListView type="openOrders" embedded title={null} />
        </Modal>
      )}
    </div>
  );
};

export default OpenOrdersPage;
