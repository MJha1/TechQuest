import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "./toast";
import { Button } from "./button";

function Fixture() {
  const { toast } = useToast();
  return (
    <Button onClick={() => toast({ title: "Saved!", description: "All good", variant: "success" })}>
      Fire
    </Button>
  );
}

describe("Toast", () => {
  it("shows a toast fired via useToast", () => {
    render(
      <ToastProvider>
        <Fixture />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /fire/i }));
    expect(screen.getByText("Saved!")).toBeInTheDocument();
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("dismisses a toast when its close button is clicked", () => {
    render(
      <ToastProvider>
        <Fixture />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /fire/i }));
    expect(screen.getByText("Saved!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /dismiss notification/i }));
    expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
  });
});
