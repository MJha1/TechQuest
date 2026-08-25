import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Badge } from "./badge";
import { Avatar, AvatarFallback } from "./avatar";

describe("Card", () => {
  it("renders its header, title, description, and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("applies the variant class", () => {
    render(<Badge variant="success">Completed</Badge>);
    const badge = screen.getByText("Completed");
    expect(badge.className).toContain("bg-success");
  });
});

describe("Avatar", () => {
  it("renders the fallback when there is no image", () => {
    render(
      <Avatar>
        <AvatarFallback>NK</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("NK")).toBeInTheDocument();
  });
});
