import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("is type=button by default so it never submits a form by accident", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Add</Button>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Add" });
    expect(button).toHaveAttribute("type", "button");
    await userEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("can still be a submit button when asked", () => {
    render(<Button type="submit">Pay</Button>);
    expect(screen.getByRole("button", { name: "Pay" })).toHaveAttribute("type", "submit");
  });

  it("renders a link with button styling via asChild", () => {
    render(
      <Button asChild>
        <a href="/shop">Start shopping</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Start shopping" });
    expect(link).toHaveAttribute("href", "/shop");
    expect(link).not.toHaveAttribute("type");
    expect(link.className).toContain("bg-brand");
  });

  it("does not fire clicks when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Add
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each(["sm", "md", "lg"] as const)("keeps white text on the primary variant at size %s", (size) => {
    render(<Button size={size}>Go</Button>);
    expect(screen.getByRole("button").className.split(" ")).toContain("text-brand-foreground");
  });

  it("gives the compact button a 44 px touch target on phones and the design's 36 px from md", () => {
    render(<Button size="sm">Add</Button>);
    const cls = screen.getByRole("button").className.split(" ");
    expect(cls).toContain("h-11");
    expect(cls).toContain("md:h-9");
  });

  it("applies variants and lets callers override classes", () => {
    render(
      <Button variant="accent" shape="pill" className="px-8">
        Basket
      </Button>,
    );
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("bg-accent");
    expect(cls).toContain("rounded-pill");
    expect(cls).toContain("px-8");
    expect(cls).not.toMatch(/\bpx-5\b/);
  });
});
