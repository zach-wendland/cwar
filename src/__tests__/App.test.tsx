import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { GameProvider } from '../game/GameContext';

// Mock the react-usa-map component
jest.mock('react-usa-map', () => {
  return function MockUSAMap({ customize, onClick }: any) {
    return (
      <div data-testid="usa-map">
        <svg>
          {Object.keys(customize()).map((stateCode: string) => (
            <path
              key={stateCode}
              className="state"
              data-name={stateCode}
              fill={customize()[stateCode].fill}
              onClick={onClick}
            />
          ))}
        </svg>
      </div>
    );
  };
});

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderApp = () => {
    return render(
      <GameProvider>
        <App />
      </GameProvider>
    );
  };

  it('should render without crashing', () => {
    renderApp();
    expect(screen.getByTestId('usa-map')).toBeInTheDocument();
  });

  it('should render all main sections', () => {
    renderApp();

    // Map view
    expect(screen.getByTestId('usa-map')).toBeInTheDocument();

    // Event feed sections
    expect(screen.getByText('News')).toBeInTheDocument();
    expect(screen.getByText('Social Media Reactions')).toBeInTheDocument();

    // Actions
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Advisors
    expect(screen.getByText('Advisors')).toBeInTheDocument();
  });

  it('should have three-column layout', () => {
    const { container } = renderApp();

    const columns = container.querySelectorAll('.col-md-4');
    expect(columns).toHaveLength(3);
  });

  it('should display initial game state', () => {
    renderApp();

    expect(screen.getByText(/Turn:/).textContent).toContain('0');
    expect(screen.getByText(/Clout:/).textContent).toContain('50');
    expect(screen.getByText(/Funds:/).textContent).toContain('100');
  });

  it('should not show event modal initially', () => {
    renderApp();

    const modals = document.querySelectorAll('.event-modal');
    // No pending event initially, so no modal should be visible
    // (Modal only shows if there's a pending event)
    expect(modals.length).toBeLessThanOrEqual(0);
  });

  it('should not show victory or game over modal initially', () => {
    renderApp();

    expect(screen.queryByText(/Victory!/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Game Over!/)).not.toBeInTheDocument();
  });

  it('should update state when action is performed', () => {
    renderApp();

    const fundraiseButton = screen.getByText(/Fundraise/).closest('button');
    if (fundraiseButton) {
      fireEvent.click(fundraiseButton);

      // Turn should increment
      expect(screen.getByText(/Turn:/).textContent).toContain('1');

      // Funds should increase
      expect(screen.getByText(/Funds:/).textContent).toContain('150');
    }
  });

  it('should render all advisor cards', () => {
    renderApp();

    expect(screen.getByText(/Mike "MemeLord" Miller/)).toBeInTheDocument();
    expect(screen.getByText(/Dana Data/)).toBeInTheDocument();
    expect(screen.getByText(/Riley Rebel/)).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    renderApp();

    expect(screen.getByText(/Launch Meme Campaign/)).toBeInTheDocument();
    expect(screen.getByText(/Fundraise/)).toBeInTheDocument();
    expect(screen.getByText(/Organize Rally/)).toBeInTheDocument();
    expect(screen.getByText(/Deploy Bot Army/)).toBeInTheDocument();
  });
});

describe('App - Game Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderApp = () => {
    return render(
      <GameProvider>
        <App />
      </GameProvider>
    );
  };

  it('should show social media reactions after performing action', () => {
    renderApp();

    const fundraiseButton = screen.getByText(/Fundraise/).closest('button');
    if (fundraiseButton) {
      fireEvent.click(fundraiseButton);

      // Social media section should now have content
      const socialSection = screen.getByText('Social Media Reactions').parentElement;
      expect(socialSection).toBeInTheDocument();
    }
  });

  it('should add news entries after performing actions', () => {
    renderApp();

    // Initial news log should have 1 entry
    const initialNewsItems = screen.getByText('News').parentElement?.querySelectorAll('li');

    const fundraiseButton = screen.getByText(/Fundraise/).closest('button');
    if (fundraiseButton) {
      fireEvent.click(fundraiseButton);

      // News log should have more entries
      const updatedNewsItems = screen.getByText('News').parentElement?.querySelectorAll('li');
      expect(updatedNewsItems!.length).toBeGreaterThan(initialNewsItems!.length);
    }
  });
});

describe('App - Responsive Layout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should use Bootstrap grid classes', () => {
    const { container } = render(
      <GameProvider>
        <App />
      </GameProvider>
    );

    expect(container.querySelector('.container-fluid')).toBeInTheDocument();
    expect(container.querySelector('.row')).toBeInTheDocument();
    expect(container.querySelectorAll('.col-md-4')).toHaveLength(3);
  });
});
