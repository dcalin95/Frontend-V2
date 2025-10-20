import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BitcoinTimeline = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const timelineEvents = [
    {
      id: 1,
      date: '2008-10-31',
      year: '2008',
      title: 'Bitcoin Whitepaper Published',
      description: 'Satoshi Nakamoto publishes "Bitcoin: A Peer-to-Peer Electronic Cash System"',
      price: '$0',
      importance: 'critical',
      icon: '📄',
      details: 'The foundational document that introduced Bitcoin to the world, describing a revolutionary peer-to-peer electronic cash system.',
      impact: 'Started the cryptocurrency revolution'
    },
    {
      id: 2,
      date: '2009-01-03',
      year: '2009',
      title: 'Genesis Block Mined',
      description: 'The first Bitcoin block is mined by Satoshi Nakamoto',
      price: '$0',
      importance: 'critical',
      icon: '⛏️',
      details: 'Block #0 contained the message: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"',
      impact: 'Bitcoin network officially launched'
    },
    {
      id: 3,
      date: '2010-05-22',
      year: '2010',
      title: 'First Bitcoin Transaction',
      description: 'Laszlo Hanyecz buys 2 pizzas for 10,000 BTC',
      price: '$0.0025',
      importance: 'high',
      icon: '🍕',
      details: 'First real-world transaction using Bitcoin. Those pizzas are now worth hundreds of millions!',
      impact: 'Established Bitcoin as a medium of exchange'
    },
    {
      id: 4,
      date: '2010-07-17',
      year: '2010',
      title: 'First Exchange Opens',
      description: 'Mt. Gox opens as Bitcoin exchange',
      price: '$0.05',
      importance: 'high',
      icon: '🏦',
      details: 'Originally a Magic: The Gathering card exchange, Mt. Gox became the first major Bitcoin exchange.',
      impact: 'Made Bitcoin trading accessible to the public'
    },
    {
      id: 5,
      date: '2013-04-01',
      year: '2013',
      title: 'Bitcoin Hits $100',
      description: 'Bitcoin reaches $100 for the first time',
      price: '$100',
      importance: 'medium',
      icon: '💯',
      details: 'A major psychological milestone that brought significant media attention to Bitcoin.',
      impact: 'Mainstream media coverage began'
    },
    {
      id: 6,
      date: '2017-12-17',
      year: '2017',
      title: 'All-Time High $20,000',
      description: 'Bitcoin reaches nearly $20,000',
      price: '$19,783',
      importance: 'high',
      icon: '🚀',
      details: 'The peak of the 2017 bull run, followed by widespread institutional and retail interest.',
      impact: 'Crypto entered mainstream consciousness'
    },
    {
      id: 7,
      date: '2020-03-12',
      year: '2020',
      title: 'COVID-19 Crash',
      description: 'Bitcoin drops 50% in "Black Thursday"',
      price: '$3,800',
      importance: 'medium',
      icon: '📉',
      details: 'Global markets crashed due to COVID-19 fears, including Bitcoin, but it recovered faster than traditional assets.',
      impact: 'Proved Bitcoin\'s resilience and correlation with risk assets'
    },
    {
      id: 8,
      date: '2020-08-11',
      year: '2020',
      title: 'MicroStrategy Adoption',
      description: 'First major corporation adds Bitcoin to treasury',
      price: '$11,500',
      importance: 'high',
      icon: '🏢',
      details: 'MicroStrategy purchases $250M worth of Bitcoin, starting corporate adoption trend.',
      impact: 'Began institutional adoption wave'
    },
    {
      id: 9,
      date: '2021-11-10',
      year: '2021',
      title: 'New All-Time High',
      description: 'Bitcoin reaches $68,789',
      price: '$68,789',
      importance: 'high',
      icon: '🌟',
      details: 'Driven by institutional adoption, ETF approvals, and mainstream acceptance.',
      impact: 'Established Bitcoin as digital gold'
    },
    {
      id: 10,
      date: '2024-01-11',
      year: '2024',
      title: 'Bitcoin ETF Approved',
      description: 'First spot Bitcoin ETFs approved in the US',
      price: '$46,000',
      importance: 'critical',
      icon: '✅',
      details: 'SEC approves multiple spot Bitcoin ETFs, making Bitcoin accessible through traditional investment accounts.',
      impact: 'Mainstream institutional access achieved'
    }
  ];

  const getImportanceColor = (importance) => {
    switch (importance) {
      case 'critical': return '#ff4757';
      case 'high': return '#ff9800';
      case 'medium': return '#4CAF50';
      default: return '#2196F3';
    }
  };

  const formatPrice = (price) => {
    if (price === '$0') return price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(price.replace('$', '').replace(',', '')));
  };

  // Prevent body scroll when modal is open (mobile fix)
  useEffect(() => {
    if (selectedEvent) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedEvent]);

  return (
    <div className="bitcoin-timeline">
      <motion.div 
        className="timeline-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Bitcoin Evolution Timeline</h2>
        <p>Key milestones in Bitcoin's journey from concept to global asset</p>
      </motion.div>

      <div className="timeline-container">
        <div className="timeline-line"></div>
        
        {timelineEvents.map((event, index) => (
          <motion.div
            key={event.id}
            className={`timeline-event ${index % 2 === 0 ? 'left' : 'right'}`}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onClick={() => setSelectedEvent(event)}
          >
            <div className="event-connector">
              <motion.div 
                className="event-dot"
                style={{ backgroundColor: getImportanceColor(event.importance) }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="event-icon">{event.icon}</span>
              </motion.div>
            </div>
            
            <motion.div 
              className="event-card"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="event-header">
                <span className="event-year">{event.year}</span>
                <span className="event-price">{formatPrice(event.price)}</span>
              </div>
              
              <h3 className="event-title">{event.title}</h3>
              <p className="event-description">{event.description}</p>
              
              <div className="event-footer">
                <span 
                  className="importance-badge"
                  style={{ backgroundColor: getImportanceColor(event.importance) }}
                >
                  {event.importance}
                </span>
                <span className="learn-more">Click to learn more →</span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="event-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              className="event-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-icon">{selectedEvent.icon}</div>
                <div className="modal-title-section">
                  <h2>{selectedEvent.title}</h2>
                  <p className="modal-date">{new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                <button 
                  className="modal-close"
                  onClick={() => setSelectedEvent(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-content">
                <div className="modal-stats">
                  <div className="stat">
                    <span className="stat-label">Bitcoin Price</span>
                    <span className="stat-value">{formatPrice(selectedEvent.price)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Importance</span>
                    <span 
                      className="stat-value importance"
                      style={{ color: getImportanceColor(selectedEvent.importance) }}
                    >
                      {selectedEvent.importance}
                    </span>
                  </div>
                </div>
                
                <div className="modal-details">
                  <h3>What Happened</h3>
                  <p>{selectedEvent.details}</p>
                  
                  <h3>Impact on Bitcoin</h3>
                  <p>{selectedEvent.impact}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BitcoinTimeline;