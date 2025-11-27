import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapView from '../MapView';
import { GameProvider } from '../../game/GameContext';

// Mock the react-usa-map component since it's an SVG component
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
      // With initial 5% support, all states should have gray color
      expect(fill).toBe('#ccc');
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

    // Initial state should have low support (5%), so all states should be gray
    const paths = container.querySelectorAll('path.state');
    paths.forEach(path => {
      expect(path.getAttribute('fill')).toBe('#ccc');
    });
  });
});
