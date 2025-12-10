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

  it("renders the Actions title", () => {
    renderWithProvider();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders all 4 action buttons", () => {
    renderWithProvider();

    expect(screen.getByText("Launch Meme Campaign")).toBeInTheDocument();
    expect(screen.getByText("Fundraise")).toBeInTheDocument();
    expect(screen.getByText("Organize Rally")).toBeInTheDocument();
    expect(screen.getByText("Deploy Bot Army")).toBeInTheDocument();
  });

  it("displays action descriptions", () => {
    renderWithProvider();

    expect(
      screen.getByText(/Spend clout to create a viral meme campaign/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Raise funds from supporters/)
    ).toBeInTheDocument();
  });

  it("displays cost information for actions", () => {
    renderWithProvider();

    // Meme campaign costs 10 clout
    expect(screen.getByText("10")).toBeInTheDocument();
    // Rally costs 30 funds
    expect(screen.getByText("30")).toBeInTheDocument();
  });
});
