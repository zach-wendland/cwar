import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EventFeed from '../EventFeed';
import { GameProvider } from '../../game/GameContext';

describe('EventFeed', () => {
  const renderWithProvider = () => {
    return render(
      <GameProvider>
        <EventFeed />
      </GameProvider>
    );
  };

  it('should render current stats', () => {
    renderWithProvider();

    expect(screen.getByText(/Turn:/)).toBeInTheDocument();
    expect(screen.getByText(/Clout:/)).toBeInTheDocument();
    expect(screen.getByText(/Funds:/)).toBeInTheDocument();
    expect(screen.getByText(/Risk:/)).toBeInTheDocument();
    expect(screen.getByText(/Avg Support:/)).toBeInTheDocument();
  });

  it('should display initial turn as 0', () => {
    renderWithProvider();

    expect(screen.getByText(/Turn:/).textContent).toContain('0');
  });

  it('should display initial clout as 50', () => {
    renderWithProvider();

    expect(screen.getByText(/Clout:/).textContent).toContain('50');
  });

  it('should display initial funds as $100', () => {
    renderWithProvider();

    expect(screen.getByText(/Funds:/).textContent).toContain('100');
  });

  it('should display initial risk as 0%', () => {
    renderWithProvider();

    expect(screen.getByText(/Risk:/).textContent).toContain('0');
  });

  it('should display News section', () => {
    renderWithProvider();

    expect(screen.getByText('News')).toBeInTheDocument();
  });

  it('should display Social Media Reactions section', () => {
    renderWithProvider();

    expect(screen.getByText('Social Media Reactions')).toBeInTheDocument();
  });

  it('should display initial game start message', () => {
    renderWithProvider();

    expect(screen.getByText(/Game start:/)).toBeInTheDocument();
    expect(screen.getByText(/Your movement is born/)).toBeInTheDocument();
  });

  it('should calculate and display average support correctly', () => {
    renderWithProvider();

    // Initial support is 5% in all states
    expect(screen.getByText(/Avg Support:/).textContent).toContain('5');
  });
});
