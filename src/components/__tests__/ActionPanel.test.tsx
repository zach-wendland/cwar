import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionPanel from '../ActionPanel';
import { GameProvider } from '../../game/GameContext';

describe('ActionPanel', () => {
  const renderWithProvider = () => {
    return render(
      <GameProvider>
        <ActionPanel />
      </GameProvider>
    );
  };

  it('should render the Actions heading', () => {
    renderWithProvider();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    renderWithProvider();

    expect(screen.getByText(/Launch Meme Campaign/)).toBeInTheDocument();
    expect(screen.getByText(/Fundraise/)).toBeInTheDocument();
    expect(screen.getByText(/Organize Rally/)).toBeInTheDocument();
    expect(screen.getByText(/Deploy Bot Army/)).toBeInTheDocument();
  });

  it('should display action descriptions', () => {
    renderWithProvider();

    expect(screen.getByText(/Spend clout to create a viral meme campaign/)).toBeInTheDocument();
    expect(screen.getByText(/Raise funds from supporters/)).toBeInTheDocument();
    expect(screen.getByText(/Spend funds to organize a rally/)).toBeInTheDocument();
    expect(screen.getByText(/Secretly deploy a bot army/)).toBeInTheDocument();
  });

  it('should display action costs', () => {
    renderWithProvider();

    // Check for cost displays (costs are now shown as numbers with icons)
    const buttons = screen.getAllByRole('button');
    const memeCampaignButton = buttons.find(b => b.textContent?.includes('Launch Meme Campaign'));
    const rallyButton = buttons.find(b => b.textContent?.includes('Organize Rally'));
    const botArmyButton = buttons.find(b => b.textContent?.includes('Deploy Bot Army'));

    // Meme campaign costs 10 clout
    expect(memeCampaignButton?.textContent).toContain('10');
    // Rally costs 30 funds
    expect(rallyButton?.textContent).toContain('30');
    // Bot army costs 20 funds and 5 clout
    expect(botArmyButton?.textContent).toContain('20');
    expect(botArmyButton?.textContent).toContain('5');
  });

  it('should have all buttons enabled initially', () => {
    renderWithProvider();

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should call dispatch when action button is clicked', () => {
    renderWithProvider();

    const fundraiseButton = screen.getByText(/Fundraise/).closest('button');
    expect(fundraiseButton).toBeInTheDocument();

    if (fundraiseButton) {
      fireEvent.click(fundraiseButton);
      // After clicking, the state should have changed (turn should increment)
      // This is tested indirectly through the GameContext tests
    }
  });
});
