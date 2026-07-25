// Covers the landing page controls that are driven by live data: the billing
// toggle must actually re-price the plan cards, and the FAQ must open/close.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./LandingPage";

const PLANS = [
  {
    id: "standard",
    name: "Standard",
    tagline: "Test plan.",
    monthlyPrice: 499,
    yearlyPrice: 4999,
    monthlyDiscountedPrice: 0,
    yearlyDiscountedPrice: 0,
    yearlyDiscountPct: 17,
    trialDays: 90,
    highlighted: true,
    cta: "Start free trial",
    features: ["Feature one", "Feature two"],
  },
];

function mockApi({ plans = PLANS, stats = { analysts: 12, companies: 412, templates: 14 } } = {}) {
  global.fetch = jest.fn((url) => {
    const body = String(url).includes("/plans") ? plans : stats;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  });
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );

beforeEach(() => {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  jest.resetAllMocks();
});

test("billing toggle switches the plan card between monthly and yearly price", async () => {
  mockApi();
  renderPage();

  // Monthly is the default.
  expect(await screen.findByText("₹499")).toBeInTheDocument();
  expect(screen.getByText("/ month")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /yearly/i }));

  expect(await screen.findByText("₹4,999")).toBeInTheDocument();
  expect(screen.getByText("/ year")).toBeInTheDocument();
  expect(screen.queryByText("₹499")).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /monthly/i }));
  expect(await screen.findByText("₹499")).toBeInTheDocument();
});

test("yearly discount is surfaced from live plan data", async () => {
  mockApi();
  renderPage();

  expect(await screen.findByText(/save 17%/i)).toBeInTheDocument();
});

test("a discounted price strikes through the regular price", async () => {
  mockApi({ plans: [{ ...PLANS[0], monthlyDiscountedPrice: 299 }] });
  renderPage();

  expect(await screen.findByText("₹299")).toBeInTheDocument();
  expect(screen.getByText("₹499")).toBeInTheDocument();
  expect(screen.getByText(/save ₹200/i)).toBeInTheDocument();
});

test("stats strip renders live values and hides when the backend is unreachable", async () => {
  mockApi();
  const { unmount } = renderPage();
  expect(await screen.findByText("Companies in screener")).toBeInTheDocument();
  unmount();

  global.fetch = jest.fn(() => Promise.reject(new Error("offline")));
  renderPage();
  await waitFor(() => {
    expect(screen.queryByText("Companies in screener")).not.toBeInTheDocument();
  });
});

test("plan cards still render when /plans is unreachable", async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error("offline")));
  renderPage();

  await waitFor(() => {
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });
  expect(screen.getByText("Premium")).toBeInTheDocument();
});

test("FAQ answers toggle open and closed", async () => {
  mockApi();
  renderPage();

  const q = await screen.findByRole("button", { name: /what do i need to get started/i });
  // First item starts open.
  expect(q).toHaveAttribute("aria-expanded", "true");

  await userEvent.click(q);
  expect(q).toHaveAttribute("aria-expanded", "false");

  await userEvent.click(q);
  expect(q).toHaveAttribute("aria-expanded", "true");
});

test("trial length in the hero CTA comes from live plan data", async () => {
  mockApi();
  renderPage();

  const ctas = await screen.findAllByRole("link", { name: /start 90-day free trial/i });
  expect(ctas.length).toBeGreaterThan(0);
});
