import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { GameProvider, useGameContext } from "@/lib/game/GameContext";

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { state, dispatch } = useGameContext();

  return (
    <div>
      <div data-testid="turn">{state.turn}</div>
      <div data-testid="funds">{state.funds}</div>
      <div data-testid="clout">{state.clout}</div>
      <div data-testid="risk">{state.risk}</div>
      <div data-testid="victory">{state.victory ? "true" : "false"}</div>
      <div data-testid="gameOver">{state.gameOver ? "true" : "false"}</div>
      <button
        data-testid="fundraise-btn"
        onClick={() => dispatch({ type: "PERFORM_ACTION", actionId: "fundraise" })}
      >
        Fundraise
      </button>
      <button
        data-testid="reset-btn"
        onClick={() => dispatch({ type: "RESET_GAME" })}
      >
        Reset
      </button>
    </div>
  );
};

describe("GameContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("provides initial state", () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    expect(screen.getByTestId("turn")).toHaveTextContent("0");
    expect(screen.getByTestId("funds")).toHaveTextContent("100");
    expect(screen.getByTestId("clout")).toHaveTextContent("50");
    expect(screen.getByTestId("risk")).toHaveTextContent("0");
  });

  it("handles PERFORM_ACTION for fundraise", () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId("fundraise-btn"));
    });

    // Turn should increment
    expect(screen.getByTestId("turn")).toHaveTextContent("1");
    // Funds should increase (50 from fundraise action)
    expect(Number(screen.getByTestId("funds").textContent)).toBeGreaterThan(100);
  });

  it("handles RESET_GAME", () => {
    render(
      <GameProvider>
        <TestComponent />
      </GameProvider>
    );

    // First perform an action
    act(() => {
      fireEvent.click(screen.getByTestId("fundraise-btn"));
    });

    expect(screen.getByTestId("turn")).toHaveTextContent("1");

    // Then reset
    act(() => {
      fireEvent.click(screen.getByTestId("reset-btn"));
    });

    expect(screen.getByTestId("turn")).toHaveTextContent("0");
    expect(screen.getByTestId("funds")).toHaveTextContent("100");
  });

  it("throws error when useGameContext is used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useGameContext must be used within a GameProvider");

    consoleError.mockRestore();
  });
});
