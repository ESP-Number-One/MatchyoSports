import { render } from "@testing-library/react";
import { Page } from "../src/components/page";
import { Header } from "../src/components/page/header";
import { mockRouting } from "./__meta__";

jest.mock("../src/state/nav");

describe("Page", () => {
  test("Slotting Structure", () => {
    const thing = render(
      <Page>
        <Page.Header>Header</Page.Header>
        <Page.Body>Body</Page.Body>
        <Page.Footer>Footer</Page.Footer>
      </Page>,
    );

    expect(thing.container.childNodes.length).toBe(1);
    expect(thing.container.childNodes.item(0).childNodes.length).toBe(3);
  });

  test("Minimal", () => {
    const thing = render(
      <Page>
        <Page.Body>Body</Page.Body>
      </Page>,
    );

    expect(thing.container.childNodes.length).toBe(1);
    expect(thing.container.childNodes.item(0).childNodes.length).toBe(2);
  });

  describe("Body options", () => {
    test("flex col", () => {
      const thing = render(
        <Page>
          <Page.Body flexCol>Body</Page.Body>
        </Page>,
      );

      expect(thing.container.childNodes.length).toBe(1);
      expect(thing.container.childNodes.item(0).childNodes.length).toBe(2);

      const body = thing.container.children[0].children[0].children[0];
      expect(body.classList.contains("flex")).toBe(true);
      expect(body.classList.contains("flex-col")).toBe(true);
    });

    test("Scrollable", () => {
      const thing = render(
        <Page>
          <Page.Body scrollable>Body</Page.Body>
        </Page>,
      );

      expect(thing.container.childNodes.length).toBe(1);
      expect(thing.container.childNodes.item(0).childNodes.length).toBe(2);
      const body = thing.container.children[0].children[0].children[0];
      expect(body.classList.contains("overflow-y-scroll")).toBe(true);
    });
  });

  test("Empty", () => {
    const thing = render(<Page>A</Page>);

    expect(thing.container.childNodes.length).toBe(1);
    expect(thing.container.childNodes.item(0).childNodes.length).toBe(2); // Content still there.
    expect(thing.container.innerText).toBeFalsy(); // No text, since no <Page.Body />
  });

  test("Components", () => {
    const header = render(<Page.Header>Apples</Page.Header>);
    expect(header.container.childNodes.length).toEqual(1);

    const body = render(<Page.Body>Apples</Page.Body>);
    expect(
      (body.container.childNodes.item(0) as HTMLElement).innerHTML,
    ).toEqual("Apples");

    const footer = render(<Page.Footer>Apples</Page.Footer>);
    expect(footer.container.childNodes.length).toEqual(1);
  });
});

describe("Header", () => {
  test("Everything", async () => {
    const Routing = await mockRouting();

    Routing.useLocation.mockReturnValue({
      state: 0,
      key: "0",
      pathname: "",
      search: "",
      hash: "",
    });

    Routing.useNavigate.mockImplementation(() => {
      return () => {
        void 0;
      };
    });

    const header = render(
      <Page.Header>
        <Header.Back defaultLink="/" />
        <Header.Title>Hello!</Header.Title>
        <Header.Right>Right-side!</Header.Right>
      </Page.Header>,
    );

    const sub = header.container.children[0];

    expect(sub.childNodes.length).toBe(3);

    expect([...(sub.childNodes.item(0) as HTMLElement).classList]).toContain(
      "absolute",
    ); // First element -> Icon.
    expect([...(sub.childNodes.item(0) as HTMLElement).classList]).toContain(
      "left-0",
    ); // First element -> Icon.

    expect([...(sub.childNodes.item(1) as HTMLElement).classList]).toEqual([
      "flex",
      "flex-grow",
      "w-full",
      "justify-center",
    ]); // Second element -> Body.

    expect([...(sub.childNodes.item(2) as HTMLElement).classList]).toEqual([
      "absolute",
      "right-0",
      "h-full",
    ]);
  }); // Third element -> Icon.
});
