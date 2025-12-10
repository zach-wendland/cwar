import React from "react";
import { render, screen } from "@testing-library/react";
import EventFeed from "@/components/game/EventFeed";
import { GameProvider } from "@/lib/game/GameContext";

describe("EventFeed", () => {
  const renderWithProvider = () => {
    return render(
      <GameProvider>
        <EventFeed />
      </GameProvider>
    );
  };

  it("renders the News section", () => {
    renderWithProvider();
    expect(screen.getByText("News")).toBeInTheDocument();
  });

  it("renders the Social Media section", () => {
    renderWithProvider();
    expect(screen.getByText("Social Media")).toBeInTheDocument();
  });

  it("renders stats for turn, clout, funds, risk", () => {
    renderWithProvider();

    expect(screen.getByText("Turn")).toBeInTheDocument();
    expect(screen.getByText("Clout")).toBeInTheDocument();
    expect(screen.getByText("Funds")).toBeInTheDocument();
    expect(screen.getByText("Risk")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("renders initial news message", () => {
    renderWithProvider();
    expect(
      screen.getByText(/Game start: Your movement is born/)
    ).toBeInTheDocument();
  });

  it("shows placeholder when no social feed", () => {
    renderWithProvider();
    expect(screen.getByText("No reactions yet...")).toBeInTheDocument();
  });
});
