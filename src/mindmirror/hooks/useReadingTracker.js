import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom Hook: Reading Tracker
 * Tracks user reading behavior and viewport visibility
 */
export const useReadingTracker = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [readingSections, setReadingSections] = useState(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [analytics, setAnalytics] = useState({
    timePerSection: {},
    expandedCards: new Set(),
    hoveredElements: new Set(),
    totalReadingTime: 0,
  });

  const sectionTimers = useRef({});
  const startTime = useRef(Date.now());

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track total reading time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      setAnalytics(prev => ({
        ...prev,
        totalReadingTime: elapsed,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Create Intersection Observer for sections
  const observeSection = useCallback((element, sectionId) => {
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Section became visible
            setActiveSection(sectionId);
            setReadingSections(prev => new Set([...prev, sectionId]));

            // Start timer for this section
            if (!sectionTimers.current[sectionId]) {
              sectionTimers.current[sectionId] = {
                startTime: Date.now(),
                totalTime: 0,
              };
            } else {
              sectionTimers.current[sectionId].startTime = Date.now();
            }
          } else {
            // Section left viewport
            if (sectionTimers.current[sectionId]?.startTime) {
              const elapsed = Date.now() - sectionTimers.current[sectionId].startTime;
              sectionTimers.current[sectionId].totalTime += elapsed;
              sectionTimers.current[sectionId].startTime = null;

              // Update analytics
              setAnalytics(prev => ({
                ...prev,
                timePerSection: {
                  ...prev.timePerSection,
                  [sectionId]: Math.floor(sectionTimers.current[sectionId].totalTime / 1000),
                },
              }));
            }
          }
        });
      },
      {
        threshold: [0.1, 0.5, 0.9], // Track at different visibility levels
        rootMargin: '-10% 0px -10% 0px', // Trigger when reasonably visible
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Track card expansion
  const trackCardExpansion = useCallback((cardId) => {
    setAnalytics(prev => ({
      ...prev,
      expandedCards: new Set([...prev.expandedCards, cardId]),
    }));
  }, []);

  // Track element hover
  const trackHover = useCallback((elementId) => {
    setAnalytics(prev => ({
      ...prev,
      hoveredElements: new Set([...prev.hoveredElements, elementId]),
    }));
  }, []);

  // Get engagement score (0-100)
  const getEngagementScore = useCallback(() => {
    const sectionsRead = readingSections.size;
    const cardsExpanded = analytics.expandedCards.size;
    const timeSpent = analytics.totalReadingTime;

    // Calculate score based on:
    // - Sections read (40 points max)
    // - Cards expanded (30 points max)
    // - Time spent (30 points max - 1 point per 10 seconds, max 5 minutes)
    
    const sectionScore = Math.min(sectionsRead * 8, 40); // ~5 sections
    const cardScore = Math.min(cardsExpanded * 4, 30); // ~8 cards
    const timeScore = Math.min(timeSpent / 10, 30); // Max at 5 minutes

    return Math.round(sectionScore + cardScore + timeScore);
  }, [readingSections, analytics]);

  return {
    activeSection,
    readingSections,
    scrollProgress,
    analytics,
    observeSection,
    trackCardExpansion,
    trackHover,
    getEngagementScore,
  };
};

export default useReadingTracker;

