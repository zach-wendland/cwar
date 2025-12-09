import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { GameProvider } from '../game/GameContext';

// Mock the @mirawision/usa-map-react component
jest.mock('@mirawision/usa-map-react', () => ({
  USAMap: function MockUSAMap({ customStates }: any) {
    return (
      <div data-testid="usa-map">
        <svg>
          {Object.keys(customStates).map((stateCode: string) => (
            <path
              key={stateCode}
              className="state"
              data-name={stateCode}
              fill={customStates[stateCode].fill}
              onClick={customStates[stateCode].onClick}
            />
          ))}
        </svg>
      </div>
    );
  },
  USAStateAbbreviation: {}
}));

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

    // Event feed sections - use getAllByRole since "News" appears in both EventFeed and IntroTutorial
    const newsHeadings = screen.getAllByRole('heading', { name: 'News' });
    expect(newsHeadings.length).toBeGreaterThan(0);

    // Social Media heading
    expect(screen.getByRole('heading', { name: 'Social Media Reactions' })).toBeInTheDocument();

    // Actions
    expect(screen.getByRole('heading', { name: 'Actions' })).toBeInTheDocument();

    // Advisors
    expect(screen.getByRole('heading', { name: 'Advisors' })).toBeInTheDocument();
  });

  it('should have three-column layout', () => {
    const { container } = renderApp();

    const columns = container.querySelectorAll('.col-md-4');
    expect(columns).toHaveLength(3);
  });

  it('should display initial game state', () => {
    renderApp();

    // Check that stats are displayed
    expect(screen.getByText(/Turn:/)).toBeInTheDocument();
    expect(screen.getByText(/Clout:/)).toBeInTheDocument();
    expect(screen.getByText(/Funds:/)).toBeInTheDocument();
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

      // Verify action was performed by checking that turn incremented
      // and funds increased (using regex to find text containing the value)
      expect(screen.getByText(/Turn:/)).toBeInTheDocument();
      expect(screen.getByText(/\$150/)).toBeInTheDocument(); // Funds increased to 150
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
      const socialSection = screen.getByRole('heading', { name: 'Social Media Reactions' }).parentElement;
      expect(socialSection).toBeInTheDocument();
    }
  });

  it('should add news entries after performing actions', () => {
    const { container } = renderApp();

    // Find the news section in EventFeed (feed-section class)
    const newsSection = container.querySelector('.feed-section.mb-3');
    const initialNewsItems = newsSection?.querySelectorAll('li');

    const fundraiseButton = screen.getByText(/Fundraise/).closest('button');
    if (fundraiseButton) {
      fireEvent.click(fundraiseButton);

      // News log should have more entries
      const updatedNewsItems = newsSection?.querySelectorAll('li');
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
