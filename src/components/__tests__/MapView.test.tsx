import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapView from '../MapView';
import { GameProvider } from '../../game/GameContext';

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
              onMouseEnter={customStates[stateCode].onHover}
              onMouseLeave={customStates[stateCode].onLeave}
            />
          ))}
        </svg>
      </div>
    );
  },
  USAStateAbbreviation: {}
}));

describe('MapView', () => {
  const renderWithProvider = () => {
    return render(
      <GameProvider>
        <MapView />
      </GameProvider>
    );
  };

  beforeEach(() => {
    // Clear any previous state
    localStorage.clear();
  });

  it('should render the USA map', () => {
    renderWithProvider();
    expect(screen.getByTestId('usa-map')).toBeInTheDocument();
  });

  it('should render all 51 states/territories', () => {
    renderWithProvider();

    const paths = screen.getByTestId('usa-map').querySelectorAll('path.state');
    expect(paths).toHaveLength(51);
  });

  it('should apply colors based on support levels', () => {
    renderWithProvider();

    const paths = screen.getByTestId('usa-map').querySelectorAll('path.state');
    paths.forEach(path => {
      const fill = path.getAttribute('fill');
      // With initial 5% support, all states should have gray color (tailwind gray-300)
      expect(fill).toBe('#d1d5db');
    });
  });

  it('should have state names in data attributes', () => {
    renderWithProvider();

    const paths = screen.getByTestId('usa-map').querySelectorAll('path.state');
    paths.forEach(path => {
      const stateName = path.getAttribute('data-name');
      expect(stateName).toBeTruthy();
      expect(stateName!.length).toBeGreaterThan(0);
    });
  });
});

describe('getStateColor utility', () => {
  it('should return correct colors for different support levels', () => {
    // This tests the color logic indirectly through the component
    const { container } = render(
      <GameProvider>
        <MapView />
      </GameProvider>
    );

    // Initial state should have low support (5%), so all states should be gray (tailwind gray-300)
    const paths = container.querySelectorAll('path.state');
    paths.forEach(path => {
      expect(path.getAttribute('fill')).toBe('#d1d5db');
    });
  });
});
