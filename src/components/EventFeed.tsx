// EventFeed.tsx - displays the news log and social media posts, plus current stats
import React from 'react';
import { useGameContext } from '../game/GameContext';

const EventFeed: React.FC = () => {
  const { state } = useGameContext();

  const newsItems = state.newsLog;
  const tweets = state.socialFeed;
  const avgSupport = Math.round(
    Object.values(state.support).reduce((a, b) => a + b, 0) / Object.keys(state.support).length
  );

  return (
    <div>
      {/* Current Stats overview */}
      <div className="mb-2">
        <strong>Turn:</strong> {state.turn} &nbsp;
        <strong>Clout:</strong> {state.clout} &nbsp;
        <strong>Funds:</strong> ${state.funds} &nbsp;
        <strong>Risk:</strong> {state.risk}% &nbsp;
        <strong>Avg Support:</strong> {avgSupport}%
      </div>
      {/* News Log Section */}
      <div className="feed-section mb-3">
        <h5>News</h5>
        <ul className="list-unstyled ps-3">
          {newsItems.map((text, idx) => (
            <li key={idx}>▪️ {text}</li>
          ))}
        </ul>
      </div>
      {/* Social Media Reactions Section */}
      <div className="feed-section">
        <h5>Social Media Reactions</h5>
        <ul className="list-unstyled ps-3">
          {tweets.map((post, idx) => (
            <li key={idx}>
              <em>{post.user}:</em> {post.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EventFeed;
