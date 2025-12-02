// EventFeed.tsx - displays the news log and social media posts, plus current stats
import React, { useState } from 'react';
import { useGameContext } from '../game/GameContext';

const EventFeed: React.FC = () => {
  const { state } = useGameContext();
  const [showAchievements, setShowAchievements] = useState(false);
  const [showRegions, setShowRegions] = useState(false);

  const newsItems = state.newsLog;
  const tweets = state.socialFeed;
  const avgSupport = Math.round(
    Object.values(state.support).reduce((a, b) => a + b, 0) / Object.keys(state.support).length
  );

  const unlockedAchievements = state.achievements.filter(a => a.unlocked);

  return (
    <div>
      {/* Current Stats overview */}
      <div className="card p-2 mb-3">
        <div className="d-flex justify-content-between mb-2">
          <div>
            <strong>Turn:</strong> {state.turn}
          </div>
          <div>
            <strong>Avg Support:</strong> {avgSupport}%
          </div>
        </div>

        <div className="mb-2">
          <div className="d-flex justify-content-between small">
            <span>Clout</span>
            <span>{state.clout}</span>
          </div>
          <div className="progress mb-2" style={{ height: '10px' }}>
            <div
              className="progress-bar bg-info"
              style={{ width: `${Math.min(100, (state.clout / 200) * 100)}%` }}
            />
          </div>

          <div className="d-flex justify-content-between small">
            <span>Momentum</span>
            <span>{state.momentum}%</span>
          </div>
          <div className="progress mb-2" style={{ height: '10px' }}>
            <div
              className="progress-bar bg-success"
              style={{ width: `${state.momentum}%` }}
            />
          </div>

          <div className="d-flex justify-content-between small">
            <span>Risk</span>
            <span>{state.risk}%</span>
          </div>
          <div className="progress mb-2" style={{ height: '10px' }}>
            <div
              className={`progress-bar ${state.risk > 75 ? 'bg-danger' : state.risk > 50 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${state.risk}%` }}
            />
          </div>

          <div className="d-flex justify-content-between">
            <strong>Funds:</strong>
            <span>${state.funds}k</span>
          </div>
        </div>

        {/* Achievements and Regions Toggle */}
        <div className="btn-group btn-group-sm w-100 mb-2">
          <button
            className={`btn ${showAchievements ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setShowAchievements(!showAchievements);
              setShowRegions(false);
            }}
          >
            Achievements ({unlockedAchievements.length}/{state.achievements.length})
          </button>
          <button
            className={`btn ${showRegions ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setShowRegions(!showRegions);
              setShowAchievements(false);
            }}
          >
            Regions
          </button>
        </div>

        {/* Achievements Panel */}
        {showAchievements && (
          <div className="small">
            {state.achievements.map((ach, idx) => (
              <div
                key={idx}
                className={`p-1 mb-1 border-start border-3 ${ach.unlocked ? 'border-success' : 'border-secondary'} ps-2`}
              >
                <strong className={ach.unlocked ? 'text-success' : 'text-muted'}>
                  {ach.unlocked ? '✓' : '○'} {ach.name}
                </strong>
                <div className="text-muted">{ach.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Regions Panel */}
        {showRegions && (
          <div className="small">
            {state.regions.map((region, idx) => (
              <div key={idx} className="mb-2">
                <div className="d-flex justify-content-between">
                  <strong>{region.name}</strong>
                  <span>{region.influence}%</span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className={`progress-bar ${region.influence > 60 ? 'bg-success' : region.influence > 30 ? 'bg-warning' : 'bg-danger'}`}
                    style={{ width: `${region.influence}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* News Log Section */}
      <div className="feed-section mb-3">
        <h5>News Feed</h5>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <ul className="list-unstyled ps-2">
            {newsItems.slice(-10).reverse().map((text, idx) => (
              <li key={idx} className="small mb-1">
                <span className="text-primary">▪️</span> {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Social Media Reactions Section */}
      <div className="feed-section">
        <h5>Social Media</h5>
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          <ul className="list-unstyled ps-2">
            {tweets.slice(-8).reverse().map((post, idx) => (
              <li key={idx} className="small mb-2">
                <strong className="text-info">{post.user}:</strong> {post.content}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EventFeed;
