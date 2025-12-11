import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionPanel from "@/components/game/ActionPanel";
import { GameProvider } from "@/lib/game/GameContext";

describe("ActionPanel", () => {
  const renderWithProvider = () => {
    return render(
      <GameProvider>
        <ActionPanel />
      </GameProvider>
    );
  };

  // Helper to switch to classic mode for legacy tests
  const switchToClassicMode = () => {
    const classicButton = screen.getByText("Classic");
    fireEvent.click(classicButton);
  };

  describe("Spin Mode (default)", () => {
    it("renders the mode toggle buttons", () => {
      renderWithProvider();
      expect(screen.getByText("Spin")).toBeInTheDocument();
      expect(screen.getByText("Classic")).toBeInTheDocument();
    });

    it("renders the SpinWheel in spin mode", () => {
      renderWithProvider();
      expect(screen.getByText("Spin to Act")).toBeInTheDocument();
      expect(screen.getByText("SPIN")).toBeInTheDocument();
    });

    it("shows ACTION, MODIFIER, TARGET labels", () => {
      renderWithProvider();
      expect(screen.getByText("ACTION")).toBeInTheDocument();
      expect(screen.getByText("MODIFIER")).toBeInTheDocument();
      expect(screen.getByText("TARGET")).toBeInTheDocument();
    });
  });

  describe("Classic Mode", () => {
    it("renders the Actions title in classic mode", () => {
      renderWithProvider();
      switchToClassicMode();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("renders all 11 action buttons in classic mode", () => {
      renderWithProvider();
      switchToClassicMode();

      expect(screen.getByText("Launch Meme Campaign")).toBeInTheDocument();
      expect(screen.getByText("Fundraise")).toBeInTheDocument();
      expect(screen.getByText("Organize Rally")).toBeInTheDocument();
      expect(screen.getByText("Deploy Bot Army")).toBeInTheDocument();
      expect(screen.getByText("Podcast Appearance")).toBeInTheDocument();
      expect(screen.getByText("Coordinate Hashtag")).toBeInTheDocument();
      expect(screen.getByText("Debate Challenge")).toBeInTheDocument();
      expect(screen.getByText("Grassroots Canvassing")).toBeInTheDocument();
      expect(screen.getByText("Influencer Partnership")).toBeInTheDocument();
      expect(screen.getByText("Legal Defense Fund")).toBeInTheDocument();
      expect(screen.getByText("Platform Migration")).toBeInTheDocument();
    });

    it("displays action descriptions in classic mode", () => {
      renderWithProvider();
      switchToClassicMode();

      expect(
        screen.getByText(/Create viral memes/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Crowdfund from supporters/)
      ).toBeInTheDocument();
    });

    it("displays cost information for actions in classic mode", () => {
      renderWithProvider();
      switchToClassicMode();

      // Meme campaign costs 12 clout (rebalanced)
      expect(screen.getAllByText("12").length).toBeGreaterThan(0);
      // Rally costs 35 funds (rebalanced)
      expect(screen.getAllByText("35").length).toBeGreaterThan(0);
    });
  });
});
