import React, { useState } from 'react';
import './AnalysisExplainer.css';
import './AnalysisExplainer.mobile.css';

const AnalysisExplainer = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const analysisFramework = [
    {
      id: 'cognitive',
      icon: '🧩',
      title: 'Cognitive Assessment',
      subtitle: 'Executive Function Analysis',
      description: 'Advanced psycholinguistic pattern recognition analyzing decision-making processes, impulse control markers, and cognitive bias identification.',
      metrics: [
        'Decision-making patterns through linguistic markers',
        'Executive function indicators in text',
        'Impulse control and emotional regulation',
        'Cognitive biases (Confirmation, Anchoring, Recency)',
        'Working memory capacity indicators'
      ],
      brainRegions: ['Prefrontal Cortex (PFC)', 'Anterior Cingulate Cortex (ACC)']
    },
    {
      id: 'neuropsych',
      icon: '🧬',
      title: 'Neuropsychological Profiling',
      subtitle: 'Personality & Behavioral Traits',
      description: 'Computational neuroscience mapping of Big Five personality traits, emotional regulation capacity, and behavioral consistency patterns.',
      metrics: [
        'Big Five personality trait mapping',
        'Emotional regulation capacity assessment',
        'Behavioral consistency patterns',
        'Self-awareness and metacognition levels',
        'Psychological resilience indicators'
      ],
      brainRegions: ['Amygdala', 'Hippocampus', 'Ventromedial PFC']
    },
    {
      id: 'trading',
      icon: '📈',
      title: 'Trading Psychology Assessment',
      subtitle: 'Investment Behavior Analysis',
      description: 'Financial psychology evaluation measuring risk tolerance, loss aversion tendencies, and market sentiment interpretation capabilities.',
      metrics: [
        'Risk tolerance profile (Conservative/Balanced/Aggressive)',
        'Loss aversion vs. gain seeking patterns',
        'Market timing behavior indicators',
        'Portfolio diversification thinking',
        'Long-term vs. short-term orientation'
      ],
      brainRegions: ['Insula', 'Striatum', 'Orbitofrontal Cortex (OFC)']
    },
    {
      id: 'behavioral',
      icon: '🎯',
      title: 'Behavioral Finance Analysis',
      subtitle: 'Cognitive Biases & Heuristics',
      description: 'Systematic identification of mental shortcuts and biases affecting financial decision-making through computational pattern analysis.',
      metrics: [
        'Herd behavior susceptibility',
        'FOMO (Fear of Missing Out) indicators',
        'Overconfidence vs. underconfidence markers',
        'Mental accounting patterns',
        'Framing effect vulnerability'
      ],
      brainRegions: ['Dorsolateral PFC', 'Nucleus Accumbens']
    },
    {
      id: 'stress',
      icon: '⚡',
      title: 'Stress & Emotional Response',
      subtitle: 'Resilience Profiling',
      description: 'Neurochemical stress response pattern analysis with cortisol marker detection and emotional volatility assessment.',
      metrics: [
        'Stress resilience levels',
        'Emotional volatility patterns',
        'Anxiety indicators in uncertain conditions',
        'Cortisol response markers (linguistic)',
        'Recovery time from setbacks'
      ],
      brainRegions: ['Hypothalamic-Pituitary-Adrenal (HPA) Axis', 'Amygdala']
    },
    {
      id: 'neurochemical',
      icon: '🧪',
      title: 'Neurochemical Profile',
      subtitle: 'Neurotransmitter Indicators',
      description: 'Advanced linguistic analysis detecting dopamine, serotonin, and norepinephrine activity patterns through communication style.',
      metrics: [
        'Dopamine system indicators (reward-seeking)',
        'Serotonin markers (mood stability)',
        'Norepinephrine patterns (alertness/stress)',
        'Endorphin-related positive affect',
        'GABA-related calmness indicators'
      ],
      brainRegions: ['Ventral Tegmental Area (VTA)', 'Raphe Nuclei']
    },
    {
      id: 'social',
      icon: '👥',
      title: 'Social Cognition',
      subtitle: 'Influence & Conformity Analysis',
      description: 'Theory of Mind assessment and social influence susceptibility measurement through group dynamics interpretation.',
      metrics: [
        'Social influence susceptibility',
        'Conformity vs. independence markers',
        'Leadership vs. follower tendencies',
        'Empathy and perspective-taking',
        'Community engagement patterns'
      ],
      brainRegions: ['Temporoparietal Junction (TPJ)', 'Mirror Neuron System']
    },
    {
      id: 'enhancement',
      icon: '🚀',
      title: 'Cognitive Enhancement Protocol',
      subtitle: 'Personalized Neuroplasticity Plan',
      description: 'Evidence-based recommendations for cognitive optimization leveraging neuroplasticity principles tailored to your unique profile.',
      metrics: [
        'Personalized meditation protocols',
        'Cognitive training exercises',
        'Behavioral modification strategies',
        'Stress management techniques',
        'Decision-making optimization practices'
      ],
      brainRegions: ['All cortical and subcortical regions (neuroplasticity)']
    }
  ];

  const technicalSpecs = [
    {
      icon: '🤖',
      label: 'AI Model',
      value: 'BitSwapDEX AI Engine',
      description: 'Proprietary AI trained with specialized prompts & ML algorithms'
    },
    {
      icon: '📊',
      label: 'Analysis Depth',
      value: '2000+ Words',
      description: 'Comprehensive clinical-grade psychological report'
    },
    {
      icon: '🎯',
      label: 'Accuracy',
      value: '85-95%',
      description: 'Confidence level based on linguistic data quality'
    },
    {
      icon: '⏱️',
      label: 'Processing Time',
      value: '30-60 seconds',
      description: 'Real-time neuropsychological computation'
    },
    {
      icon: '🧠',
      label: 'Brain Regions',
      value: '12+ Areas',
      description: 'Multi-regional neural network analysis'
    },
    {
      icon: '📈',
      label: 'Trading Score',
      value: '0-100 Scale',
      description: 'Optimal trading psychology assessment'
    }
  ];

  return (
    <div className="analysis-explainer-container">
      {/* Hero Header */}
      <div className="explainer-hero">
        <div className="hero-badge">
          <span className="badge-icon">🧠</span>
          <span className="badge-text">Advanced Neuropsychological Analysis</span>
        </div>
        <div className="ai-powered-badge">
          <span className="ai-badge-icon">⚡</span>
          <span className="ai-badge-text">Powered by BitSwapDEX AI</span>
          <span className="ai-badge-partners">OpenAI × Anthropic</span>
        </div>
        <h2 className="hero-title">
          What You'll Receive:
          <span className="gradient-text"> Clinical-Grade Mind Mirror Assessment</span>
        </h2>
        <p className="hero-subtitle">
          Powered by BitSwapDEX AI Engine - a proprietary system trained with specialized prompts 
          and machine learning algorithms in collaboration with OpenAI and Anthropic - combining 
          cutting-edge neuroscience, behavioral finance research, and computational linguistics 
          to create your unique psychological trading profile.
        </p>
      </div>

      {/* Technical Specifications Grid */}
      <div className="tech-specs-grid">
        {technicalSpecs.map((spec, index) => (
          <div key={index} className="tech-spec-card">
            <div className="spec-icon">{spec.icon}</div>
            <div className="spec-content">
              <div className="spec-label">{spec.label}</div>
              <div className="spec-value">{spec.value}</div>
              <div className="spec-description">{spec.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Framework Sections */}
      <div className="framework-header">
        <h3>8-Dimensional Analysis Framework</h3>
        <p>Click each section to explore the scientific methodology</p>
      </div>

      <div className="framework-sections">
        {analysisFramework.map((section) => (
          <div 
            key={section.id} 
            className={`framework-card ${expandedSection === section.id ? 'expanded' : ''}`}
          >
            <div 
              className="framework-card-header"
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            >
              <div className="header-left">
                <span className="framework-icon">{section.icon}</span>
                <div className="header-text">
                  <h4>{section.title}</h4>
                  <p className="subtitle">{section.subtitle}</p>
                </div>
              </div>
              <div className="expand-icon">
                {expandedSection === section.id ? '−' : '+'}
              </div>
            </div>

            {expandedSection === section.id && (
              <div className="framework-card-content">
                <p className="description">{section.description}</p>
                
                <div className="metrics-section">
                  <h5>Measured Metrics:</h5>
                  <ul className="metrics-list">
                    {section.metrics.map((metric, idx) => (
                      <li key={idx}>
                        <span className="metric-bullet">→</span>
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="brain-regions-section">
                  <h5>🧠 Brain Regions Analyzed:</h5>
                  <div className="brain-regions-tags">
                    {section.brainRegions.map((region, idx) => (
                      <span key={idx} className="brain-region-tag">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Data Collection Methodology */}
      <div className="methodology-section">
        <div className="methodology-header">
          <h3>⚠️ Critical: Natural Data Collection Required</h3>
          <p className="methodology-subtitle">Why We Need 1000+ Words from Natural Telegram Conversations</p>
        </div>

        <div className="methodology-cards">
          <div className="methodology-card primary">
            <div className="card-icon">🎯</div>
            <h4>Authentic Psychological Profiling</h4>
            <p>
              For accurate neuropsychological assessment, we require a <strong>minimum of 1000 unique words</strong> collected 
              from your <strong>natural, voluntary, and spontaneous</strong> conversations in the Telegram group.
            </p>
            <ul>
              <li><strong>✅ Natural communication:</strong> Words expressed freely in real discussions</li>
              <li><strong>✅ Voluntary participation:</strong> Authentic engagement with the community</li>
              <li><strong>✅ Spontaneous expression:</strong> Unfiltered thoughts and reactions</li>
            </ul>
          </div>

          <div className="methodology-card warning">
            <div className="card-icon">⚠️</div>
            <h4>Why Artificial Data Invalidates Analysis</h4>
            <p>
              Words added <strong>artificially or specifically for this test</strong> compromise the entire 
              psychological assessment and produce inaccurate results.
            </p>
            <ul>
              <li><strong>❌ Fabricated messages:</strong> Do not reflect authentic thinking patterns</li>
              <li><strong>❌ Copy-pasted text:</strong> Lacks genuine emotional markers</li>
              <li><strong>❌ Forced vocabulary:</strong> Distorts personality trait detection</li>
              <li><strong>❌ Test-specific responses:</strong> Creates false cognitive profiles</li>
            </ul>
          </div>

          <div className="methodology-card info">
            <div className="card-icon">🔬</div>
            <h4>Scientific Basis: Ecological Validity</h4>
            <p>
              Clinical psychology and neuropsychological research require <strong>ecological validity</strong> - 
              meaning data must be collected in <strong>natural, real-world environments</strong> to accurately 
              represent authentic cognitive and behavioral patterns.
            </p>
            <div className="scientific-points">
              <div className="point">
                <strong>Natural Environment Testing:</strong>
                <span>Telegram conversations provide authentic social context where your true communication style, 
                emotional responses, and decision-making patterns emerge naturally.</span>
              </div>
              <div className="point">
                <strong>Longitudinal Data Collection:</strong>
                <span>1000+ words gathered over time reveal consistent personality traits, behavioral patterns, 
                and cognitive tendencies that cannot be fabricated in artificial test conditions.</span>
              </div>
              <div className="point">
                <strong>Psycholinguistic Markers:</strong>
                <span>Authentic communication contains unconscious linguistic patterns (word choice, syntax, 
                emotional vocabulary) that expose genuine psychological characteristics invisible in controlled responses.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="collection-requirements">
          <h4>📋 Data Collection Requirements Summary:</h4>
          <div className="requirements-grid">
            <div className="requirement-item">
              <span className="req-icon">✓</span>
              <div className="req-content">
                <strong>Minimum 1000 unique words</strong>
                <p>Sufficient linguistic data for reliable analysis</p>
              </div>
            </div>
            <div className="requirement-item">
              <span className="req-icon">✓</span>
              <div className="req-content">
                <strong>Natural Telegram conversations</strong>
                <p>Authentic social interactions, not test responses</p>
              </div>
            </div>
            <div className="requirement-item">
              <span className="req-icon">✓</span>
              <div className="req-content">
                <strong>Voluntary participation</strong>
                <p>Genuine engagement with community discussions</p>
              </div>
            </div>
            <div className="requirement-item">
              <span className="req-icon">✓</span>
              <div className="req-content">
                <strong>Time-distributed collection</strong>
                <p>Words gathered across multiple sessions reveal patterns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Standards Badge */}
      <div className="scientific-standards">
        <div className="standards-badge">
          <span className="badge-icon">🏆</span>
          <div className="badge-content">
            <h4>BitSwapDEX AI Technology</h4>
            <p>
              Our proprietary AI engine is specially trained with advanced machine learning algorithms 
              and custom neuropsychological prompts, developed in collaboration with OpenAI and Anthropic. 
              The system integrates principles from the American Psychological Association (APA), 
              computational neuroscience research, and evidence-based behavioral finance frameworks 
              to deliver specialized cryptocurrency trading psychology assessments.
            </p>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="value-proposition">
        <h3>Why This Matters for Crypto Traders</h3>
        <div className="benefits-grid">
          <div className="benefit-card">
            <span className="benefit-icon">🎯</span>
            <h4>Self-Awareness</h4>
            <p>Understand your psychological strengths and weaknesses in trading contexts</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">⚠️</span>
            <h4>Risk Management</h4>
            <p>Identify cognitive biases that may lead to poor investment decisions</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">📊</span>
            <h4>Performance Optimization</h4>
            <p>Receive personalized strategies to enhance decision-making capabilities</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">🧘</span>
            <h4>Emotional Control</h4>
            <p>Learn techniques to manage stress and maintain composure during volatility</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisExplainer;

