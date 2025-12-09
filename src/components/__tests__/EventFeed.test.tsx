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

    expect(screen.getByText(/Turn:/)).toBeInTheDocument();
    expect(screen.getByText(/Clout:/)).toBeInTheDocument();
    expect(screen.getByText(/Funds:/)).toBeInTheDocument();
    expect(screen.getByText(/Risk:/)).toBeInTheDocument();
    expect(screen.getByText(/Avg Support:/)).toBeInTheDocument();
  });

  it('should display initial turn as 0', () => {
    const { container } = renderWithProvider();

    // Stats are in one div with inline text, use container query
    const statsDiv = container.querySelector('.mb-2');
    expect(statsDiv?.textContent).toContain('Turn:');
    expect(statsDiv?.textContent).toContain('0');
  });

  it('should display initial clout as 50', () => {
    const { container } = renderWithProvider();

    const statsDiv = container.querySelector('.mb-2');
    expect(statsDiv?.textContent).toContain('Clout:');
    expect(statsDiv?.textContent).toContain('50');
  });

  it('should display initial funds as $100', () => {
    const { container } = renderWithProvider();

    const statsDiv = container.querySelector('.mb-2');
    expect(statsDiv?.textContent).toContain('Funds:');
    expect(statsDiv?.textContent).toContain('$100');
  });

  it('should display initial risk as 0%', () => {
    const { container } = renderWithProvider();

    const statsDiv = container.querySelector('.mb-2');
    expect(statsDiv?.textContent).toContain('Risk:');
    expect(statsDiv?.textContent).toContain('0%');
  });

  it('should display News section', () => {
    renderWithProvider();

    expect(screen.getByRole('heading', { name: 'News' })).toBeInTheDocument();
  });

  it('should display Social Media Reactions section', () => {
    renderWithProvider();

    expect(screen.getByRole('heading', { name: 'Social Media Reactions' })).toBeInTheDocument();
  });

  it('should display initial game start message', () => {
    renderWithProvider();

    expect(screen.getByText(/Game start:/)).toBeInTheDocument();
    expect(screen.getByText(/Your movement is born/)).toBeInTheDocument();
  });

  it('should calculate and display average support correctly', () => {
    const { container } = renderWithProvider();

    const statsDiv = container.querySelector('.mb-2');
    expect(statsDiv?.textContent).toContain('Avg Support:');
    expect(statsDiv?.textContent).toContain('5%');
  });
});
