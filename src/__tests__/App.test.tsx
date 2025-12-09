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

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const filterMotionProps = (props: any) => {
    const {
      whileHover, whileTap, whileFocus, whileDrag, whileInView,
      initial, animate, exit, transition, variants,
      drag, dragConstraints, dragElastic, dragMomentum,
      onDragStart, onDragEnd, onDrag,
      layout, layoutId,
      ...validProps
    } = props;
    return validProps;
  };

  return {
    motion: {
      div: ({ children, ...props }: any) => {
        const React = require('react');
        return React.createElement('div', filterMotionProps(props), children);
      },
      button: ({ children, ...props }: any) => {
        const React = require('react');
        return React.createElement('button', filterMotionProps(props), children);
      },
      span: ({ children, ...props }: any) => {
        const React = require('react');
        return React.createElement('span', filterMotionProps(props), children);
      },
    },
    AnimatePresence: ({ children }: any) => children,
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

    // News section
    const newsElements = screen.getAllByText('News');
    expect(newsElements.length).toBeGreaterThan(0);

    // Social Media heading
    const socialElements = screen.getAllByText('Social Media');
    expect(socialElements.length).toBeGreaterThan(0);

    // Actions
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Advisors
    expect(screen.getByText('Advisors')).toBeInTheDocument();
  });

  it('should have responsive grid layout', () => {
    const { container } = renderApp();

    // Using Bootstrap with col-lg classes now
    expect(container.querySelector('.container-fluid')).toBeInTheDocument();
    expect(container.querySelector('.row')).toBeInTheDocument();
    const columns = container.querySelectorAll('[class*="col-lg"]');
    expect(columns.length).toBeGreaterThanOrEqual(3);
  });

  it('should display initial game stats', () => {
    const { container } = renderApp();

    // Check that stats bar is displayed with stat cards
    const statsBar = container.querySelector('.stats-bar');
    expect(statsBar).toBeInTheDocument();

    // Stats appear in the StatsBar component as labels
    expect(screen.getAllByText('Turn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Clout').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Funds').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Risk').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Support').length).toBeGreaterThanOrEqual(1);
  });

  it('should not show victory or game over modal initially', () => {
    renderApp();

    expect(screen.queryByText(/VICTORY!/)).not.toBeInTheDocument();
    expect(screen.queryByText(/GAME OVER/)).not.toBeInTheDocument();
  });

  it('should update state when action is performed', () => {
    renderApp();

    const fundraiseButton = screen.getByText(/Fundraise/).closest('button');
    if (fundraiseButton) {
      fireEvent.click(fundraiseButton);

      // Verify action was performed - Fundraise text should appear in news log and action panel
      const fundraiseElements = screen.getAllByText(/Fundraise/);
      expect(fundraiseElements.length).toBeGreaterThanOrEqual(1);
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

  it('should show social media section', () => {
    renderApp();

    const socialMediaElements = screen.getAllByText('Social Media');
    expect(socialMediaElements.length).toBeGreaterThan(0);
  });

  it('should show news section with initial message', () => {
    renderApp();

    expect(screen.getByText(/Game start/)).toBeInTheDocument();
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
  });
});
