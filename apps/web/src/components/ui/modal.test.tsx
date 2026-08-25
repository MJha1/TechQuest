import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalClose,
} from "./modal";
import { Button } from "./button";

function Example() {
  return (
    <Modal>
      <ModalTrigger asChild>
        <Button>Open</Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Start mission?</ModalTitle>
          <ModalDescription>You'll earn XP.</ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="ghost">Cancel</Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

describe("Modal", () => {
  it("opens on trigger and shows a labelled dialog", async () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Start mission?")).toBeInTheDocument();
  });

  it("closes when a close control is activated", async () => {
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: /open/i }));
    await screen.findByRole("dialog");

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
