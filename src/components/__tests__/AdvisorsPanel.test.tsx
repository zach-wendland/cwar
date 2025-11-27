import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvisorsPanel from '../AdvisorsPanel';
import { GameProvider } from '../../game/GameContext';

describe('AdvisorsPanel', () => {
  const renderWithProvider = () => {
    return render(
      <GameProvider>
        <AdvisorsPanel />
      </GameProvider>
    );
  };

  it('should render the Advisors heading', () => {
    renderWithProvider();
    expect(screen.getByText('Advisors')).toBeInTheDocument();
  });

  it('should display all 3 advisors', () => {
    renderWithProvider();

    expect(screen.getByText(/Mike "MemeLord" Miller/)).toBeInTheDocument();
    expect(screen.getByText(/Dana Data/)).toBeInTheDocument();
    expect(screen.getByText(/Riley Rebel/)).toBeInTheDocument();
  });

  it('should display advisor roles', () => {
    renderWithProvider();

    expect(screen.getByText(/Social Media Strategist/)).toBeInTheDocument();
    expect(screen.getByText(/Analytics Guru/)).toBeInTheDocument();
    expect(screen.getByText(/Grassroots Organizer/)).toBeInTheDocument();
  });

  it('should display advisor traits', () => {
    renderWithProvider();

    expect(screen.getByText(/Former meme lord turned campaign strategist/)).toBeInTheDocument();
    expect(screen.getByText(/Data-driven strategist/)).toBeInTheDocument();
    expect(screen.getByText(/Street protest veteran/)).toBeInTheDocument();
  });

  it('should display advisor quotes', () => {
    renderWithProvider();

    // Check for some quotes
    expect(screen.getByText(/We memed the establishment into oblivion/)).toBeInTheDocument();
    expect(screen.getByText(/Numbers never lie, but politicians do/)).toBeInTheDocument();
    expect(screen.getByText(/I was organizing rallies before it was cool/)).toBeInTheDocument();
  });

  it('should render quotes in list format', () => {
    renderWithProvider();

    const lists = screen.getAllByRole('list');
    // Each advisor has a list of quotes (3 advisors = 3 lists)
    expect(lists.length).toBeGreaterThanOrEqual(3);
  });

  it('should display quotes with quotation marks', () => {
    renderWithProvider();

    // Quotes should be wrapped in quotation marks
    const quoteElements = screen.getAllByText(/"/);
    expect(quoteElements.length).toBeGreaterThan(0);
  });
});
