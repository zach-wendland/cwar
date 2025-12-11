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

    // Use getAllByText since names may appear in quotes too
    expect(screen.getAllByText(/DOGE/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dark MAGA/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tucker's Intern Kyle/).length).toBeGreaterThan(0);
  });

  it("renders advisor roles", () => {
    renderWithProvider();

    expect(screen.getByText("Efficiency Consultant")).toBeInTheDocument();
    expect(screen.getByText("Aesthetic Director")).toBeInTheDocument();
    expect(screen.getByText("Media Booker")).toBeInTheDocument();
  });

  it("renders advisor quotes", () => {
    renderWithProvider();

    expect(
      screen.getByText(/Vengeance is a brand now/)
    ).toBeInTheDocument();
  });
});
