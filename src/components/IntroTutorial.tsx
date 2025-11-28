import React from 'react';

const IntroTutorial: React.FC = () => (
  <section className="intro-immersive mb-4">
    <div className="intro-hero text-light">
      <div className="intro-hero__glow" />
      <div className="intro-hero__content">
        <p className="text-uppercase small fw-semibold text-primary mb-1">Briefing</p>
        <h2 className="mb-2">Culture War: Rise or Vanish</h2>
        <p className="mb-3">
          You lead a digital movement racing to capture the national conversation. Shape narratives,
          outmaneuver bans, and amplify support before platforms shut you down.
        </p>
        <div className="d-flex flex-wrap gap-2">
          <span className="badge bg-primary">Build Support</span>
          <span className="badge bg-warning text-dark">Manage Risk</span>
          <span className="badge bg-success">Spend Clout &amp; Funds</span>
        </div>
      </div>
      <div className="intro-hero__stats card text-dark shadow-sm">
        <div className="card-body p-3">
          <h6 className="text-uppercase small fw-semibold mb-2">Win / Lose</h6>
          <ul className="mb-0 intro-list">
            <li>Win at <strong>80% average support</strong> across all states.</li>
            <li>Lose if <strong>Risk reaches 100%</strong> and the platforms ban you.</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="row g-3 intro-panels">
      <div className="col-lg-4">
        <div className="intro-panel h-100">
          <h5 className="mb-2">Your Toolkit</h5>
          <ul className="intro-list">
            <li><strong>Clout</strong>: Reputation that fuels high-profile actions.</li>
            <li><strong>Funds</strong>: Cash to deploy across campaigns.</li>
            <li><strong>Risk</strong>: Heat from platforms and authorities—keep it low.</li>
            <li><strong>Support</strong>: State-by-state backing that drives victory.</li>
          </ul>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="intro-panel h-100">
          <h5 className="mb-2">Flow of a Turn</h5>
          <ol className="intro-steps mb-0">
            <li>Choose an <strong>Action</strong> on the right to invest clout or funds.</li>
            <li>Watch the <strong>News</strong> and <strong>Social Media</strong> feeds react.</li>
            <li>When an <strong>Event</strong> interrupts, pick a response to guide the narrative.</li>
            <li>Check the <strong>Map</strong> for shifting support (deep green means momentum).</li>
          </ol>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="intro-panel h-100">
          <h5 className="mb-2">Field Notes</h5>
          <ul className="intro-list mb-0">
            <li>Chain low-cost moves to unlock bigger swings without spiking Risk.</li>
            <li>Pair growth actions with cover stories to keep scrutiny in check.</li>
            <li>Advisors hint at hidden angles—read their quotes before you act.</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export default IntroTutorial;
