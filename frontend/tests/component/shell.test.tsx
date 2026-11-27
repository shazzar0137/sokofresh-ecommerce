import { useQuery } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { healthQuery } from "@/api/queries/health";
import GlobalError from "@/app/global-error";
import Loading from "@/app/loading";
import { Providers } from "@/app/providers";
import { Heading, Text, VisuallyHidden } from "@/components/common/typography";
import { MockingGate } from "@/mocks/mocking-gate";

describe("Typography", () => {
  it("renders the requested heading level independently of its size", () => {
    render(
      <>
        <Heading level={1}>Page title</Heading>
        <Heading level={2} size="h3">
          Small section
        </Heading>
        <Heading level={3} size="display">
          Big h3
        </Heading>
      </>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Page title" }).className).toContain("text-h1");
    expect(screen.getByRole("heading", { level: 2, name: "Small section" }).className).toContain("text-h3");
    expect(screen.getByRole("heading", { level: 3, name: "Big h3" }).className).toContain("text-display");
  });

  it("renders text variants and visually hidden text", () => {
    render(
      <>
        <Text variant="lead">Lead</Text>
        <Text as="span" variant="caption">
          Caption
        </Text>
        <VisuallyHidden>Hidden</VisuallyHidden>
      </>,
    );
    expect(screen.getByText("Lead").tagName).toBe("P");
    expect(screen.getByText("Caption").tagName).toBe("SPAN");
    expect(screen.getByText("Hidden")).toHaveClass("sr-only");
  });
});

function HealthStatus() {
  const { data } = useQuery(healthQuery());
  return <p>{data ? `database ${data.database}` : "waiting"}</p>;
}

describe("Providers and the health query", () => {
  it("provides TanStack Query to the app and the shared health query works through the same-origin client", async () => {
    // The browser client uses relative URLs; jsdom resolves them against http://localhost:3000.
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(
      <Providers>
        <HealthStatus />
      </Providers>,
    );
    expect(await screen.findByText("database ok")).toBeInTheDocument();
    expect(String((fetchSpy.mock.calls[0]?.[0] as Request).url)).toBe("http://localhost:3000/api/v1/health");
  });

  it("uses a stable query key", () => {
    expect(healthQuery().queryKey).toEqual(["health"]);
  });
});

describe("MockingGate", () => {
  it("renders children straight away when mocking is off (tests, production)", () => {
    render(
      <MockingGate>
        <p>content</p>
      </MockingGate>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});

describe("Root loading and global error", () => {
  it("loading.tsx announces loading", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading page");
  });

  it("global-error offers retry without exposing the error", async () => {
    const retry = vi.fn();
    // global-error renders its own <html>; render its body content into the test document.
    const { container } = render(<GlobalError error={new Error("secret stack")} retry={retry} />, {
      container: document.documentElement,
    });
    expect(container).not.toHaveTextContent("secret stack");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
