import React from "react";
import { render, screen } from "@testing-library/react";
import MapView from "@/components/game/MapView";
import { GameProvider } from "@/lib/game/GameContext";

describe("MapView", () => {
  const renderWithProvider = () => {
    return render(
      <GameProvider>
        <MapView />
      </GameProvider>
    );
  };

  it("renders the Support Map title", () => {
    renderWithProvider();
    expect(screen.getByText("Support Map")).toBeInTheDocument();
  });

  it("renders the legend", () => {
    renderWithProvider();

    expect(screen.getByText("<10%")).toBeInTheDocument();
    expect(screen.getByText("20%+")).toBeInTheDocument();
    expect(screen.getByText("40%+")).toBeInTheDocument();
    expect(screen.getByText("60%+")).toBeInTheDocument();
    expect(screen.getByText("80%+")).toBeInTheDocument();
  });

  it("renders the average support badge", () => {
    renderWithProvider();
    expect(screen.getByText("Avg Support:")).toBeInTheDocument();
  });

  it("renders the USA map component", () => {
    renderWithProvider();
    expect(screen.getByTestId("usa-map")).toBeInTheDocument();
  });
});
