/**
 * Order History – rută dedicată: /dex-edu/order-history
 * Afișare sub header, toolbar: Half screen, Popup, Copy, Email, Save to computer.
 */

import React, { useState } from 'react';
import Modal from '../components/common/Modal/Modal';
import OrdersListView from '../components/trade/OrdersListView';
import '../styles/pages.css';
import '../styles/components/orders-list-view.css';

const OrderHistoryPage = () => {
  const [showPopup, setShowPopup] = useState(false);

  const handleHalfScreen = () => {
    window.open(
      `${window.location.origin}/dex-edu/order-history`,
      '_blank',
      'width=900,height=700,scrollbars=yes,resizable=yes'
    );
  };

  return (
    <div className="orders-page">
      <OrdersListView
        type="orderHistory"
        title="Order History"
        onOpenHalfScreen={handleHalfScreen}
        onOpenPopup={() => setShowPopup(true)}
      />
      {showPopup && (
        <Modal
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          title="Order History"
          size="large"
          className="orders-list-modal"
        >
          <OrdersListView type="orderHistory" embedded title={null} />
        </Modal>
      )}
    </div>
  );
};

export default OrderHistoryPage;
