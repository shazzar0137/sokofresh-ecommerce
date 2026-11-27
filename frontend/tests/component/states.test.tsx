import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import { ErrorState } from "@/components/common/error-state";
import { MockDataBanner } from "@/components/common/mock-data-banner";
import { EmptyState, LoadingState } from "@/components/common/states";

describe("LoadingState", () => {
  it("announces progress politely to screen readers and hides the skeletons", () => {
    const { container } = render(<LoadingState label="Loading products" rows={2} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Loading products…");
    expect(container.querySelectorAll('[data-slot="skeleton"][aria-hidden="true"]')).toHaveLength(2);
  });
});

describe("EmptyState", () => {
  it("renders the title at the requested heading level with an action", () => {
    render(<EmptyState title="Your basket is empty" headingLevel={3} action={<a href="/shop">Start shopping</a>} />);
    expect(screen.getByRole("heading", { level: 3, name: "Your basket is empty" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start shopping" })).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("shows friendly wording from the error code, never raw server detail", () => {
    const error = new ApiError({ status: 500, code: "server_error", title: "Server error", detail: "IntegrityError at orders_order" });
    render(<ErrorState error={error} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong on our side. Please try again.");
    expect(alert).not.toHaveTextContent("IntegrityError");
  });

  it("does not show a plain Error's message either", () => {
    render(<ErrorState error={new Error("TypeError: cannot read properties of undefined")} />);
    expect(screen.getByRole("alert")).not.toHaveTextContent("TypeError");
  });

  it("offers retry only when a handler is given", async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ErrorState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("MockDataBanner", () => {
  it("is hidden when mocking is off (the default in tests and production)", () => {
    const { container } = render(<MockDataBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("labels mock data clearly when mocking is on", () => {
    render(<MockDataBanner enabled />);
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/mock data, not the live SokoFresh backend/);
    // Stable marker used by scripts/check-production-build.mjs.
    expect(note).toHaveAttribute("data-mock-banner");
  });
});
