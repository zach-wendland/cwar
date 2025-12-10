import React from "react";
import { render, screen } from "@testing-library/react";
import AdvisorsPanel from "@/components/game/AdvisorsPanel";
import { GameProvider } from "@/lib/game/GameContext";

describe("AdvisorsPanel", () => {
  const renderWithProvider = () => {
    return render(
      <GameProvider>
        <AdvisorsPanel />
      </GameProvider>
    );
  };

  it("renders the Advisors title", () => {
    renderWithProvider();
    expect(screen.getByText("Advisors")).toBeInTheDocument();
  });

  it("renders all 3 advisors", () => {
    renderWithProvider();

    expect(screen.getByText(/MemeLord/)).toBeInTheDocument();
    expect(screen.getByText("Dana Data")).toBeInTheDocument();
    expect(screen.getByText("Riley Rebel")).toBeInTheDocument();
  });

  it("renders advisor roles", () => {
    renderWithProvider();

    expect(screen.getByText("Social Media Strategist")).toBeInTheDocument();
    expect(screen.getByText("Analytics Guru")).toBeInTheDocument();
    expect(screen.getByText("Grassroots Organizer")).toBeInTheDocument();
  });

  it("renders advisor quotes", () => {
    renderWithProvider();

    expect(
      screen.getByText(/We memed the establishment into oblivion/)
    ).toBeInTheDocument();
  });
});
