import { cleanup, fireEvent, render } from "@testing-library/react";
import { Search } from "../../src/components/search";

afterEach(cleanup);

it("renders without crashing", () => {
  const onSubmit: jest.Mock = jest.fn();
  render(<Search onSubmit={onSubmit} />);
  render(<Search onSubmit={onSubmit} hidden={false} />);
  render(<Search onSubmit={onSubmit} hidden={true} />);
});

it("calls submit once on clicking button with nonempty input", () => {
  const onSubmit: jest.Mock = jest.fn();
  const { getByTestId } = render(<Search onSubmit={onSubmit} />);

  fireEvent.change(getByTestId("search-input"), { target: { value: "ABC" } });
  fireEvent.click(getByTestId("search-button"));
  expect(onSubmit.mock.calls.length).toBe(1);
  expect(onSubmit.mock.calls[0]).toContain("ABC");
});

it("calls submit once with nonempty input on submitting", () => {
  const onSubmit: jest.Mock = jest.fn();
  const { getByTestId } = render(<Search onSubmit={onSubmit} />);

  fireEvent.change(getByTestId("search-input"), { target: { value: "ABC" } });
  fireEvent.submit(getByTestId("search-input"));
  expect(onSubmit.mock.calls.length).toBe(1);
  expect(onSubmit.mock.calls[0]).toContain("ABC");
});

it("calls submit once with nonempty input on clicking submit button", () => {
  const onSubmit: jest.Mock = jest.fn();
  const { getByTestId } = render(<Search onSubmit={onSubmit} />);

  fireEvent.change(getByTestId("search-input"), { target: { value: "ABC" } });
  fireEvent.click(getByTestId("search-button"));
  expect(onSubmit.mock.calls.length).toBe(1);
  expect(onSubmit.mock.calls[0]).toContain("ABC");
});
