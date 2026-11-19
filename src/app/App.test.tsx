import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App.tsx";

describe("App shell", () => {
  it("renders the title and ruleset version", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "AumMon" })).toBeInTheDocument();
    expect(screen.getByText("Rulebook v1")).toBeInTheDocument();
  });

  it("keeps game modes disabled until auth exists", () => {
    render(<App />);
    for (const name of ["Solo vs Bots", "Pass & Play", "Online"]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
  });
});
