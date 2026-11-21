import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardGallery } from "./CardGallery.tsx";

describe("card gallery", () => {
  it("filters by Thai category and opens a card's details", () => {
    render(<CardGallery />);
    expect(screen.getByText(/^24 ใบ/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "พาหนะ" }));
    expect(screen.getByText(/^3 ใบ/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /จักรยาน/ }));
    expect(screen.getByText(/ปั่นเป็นขบวน/)).toBeInTheDocument();
    expect(screen.getByText(/^พาหนะ$/)).toBeInTheDocument();
  });
});
