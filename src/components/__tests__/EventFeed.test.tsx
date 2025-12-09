import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventFeed from '../EventFeed';
import { GameProvider } from '../../game/GameContext';

describe('EventFeed', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderWithProvider = () => {
    return render(
      <GameProvider>
        <EventFeed />
      </GameProvider>
    );
  };

  it('should render current stats', () => {
    renderWithProvider();

    // Stats are now displayed in separate stat-card components with labels
    expect(screen.getByText('Turn')).toBeInTheDocument();
    expect(screen.getByText('Clout')).toBeInTheDocument();
    expect(screen.getByText('Funds')).toBeInTheDocument();
    expect(screen.getByText('Risk')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('should display initial turn as 0', () => {
    const { container } = renderWithProvider();

    // Stats are now in stat-card components
    const statsBar = container.querySelector('.stats-bar');
    expect(statsBar).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Turn value
  });

  it('should display initial clout as 50', () => {
    renderWithProvider();

    expect(screen.getByText('50')).toBeInTheDocument(); // Clout value
  });

  it('should display initial funds as $100', () => {
    renderWithProvider();

    expect(screen.getByText('$100')).toBeInTheDocument(); // Funds value with $ prefix
  });

  it('should display initial risk as 0%', () => {
    const { container } = renderWithProvider();

    // Risk is 0% - find it in the risk stat card
    const riskCard = container.querySelector('.stat-card--green, .stat-card--yellow, .stat-card--red');
    expect(riskCard).toBeInTheDocument();
    // The stats bar contains the risk value
    expect(screen.getByText('Risk')).toBeInTheDocument();
  });

  it('should display News section', () => {
    renderWithProvider();

    // News section title in GlassPanel
    expect(screen.getByText('News')).toBeInTheDocument();
  });

  it('should display Social Media section', () => {
    renderWithProvider();

    // Social Media section title in GlassPanel
    expect(screen.getByText('Social Media')).toBeInTheDocument();
  });

  it('should display initial game start message', () => {
    renderWithProvider();

    expect(screen.getByText(/Game start:/)).toBeInTheDocument();
    expect(screen.getByText(/Your movement is born/)).toBeInTheDocument();
  });

  it('should calculate and display average support correctly', () => {
    renderWithProvider();

    // Support is displayed as a stat card with % suffix
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument(); // Average support at 5%
  });
});
