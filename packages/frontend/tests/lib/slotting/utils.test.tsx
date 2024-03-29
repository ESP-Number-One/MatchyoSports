import { Slot } from "../../../src/lib/slotting";

describe("Slotting Utilities", () => {
  const TestA = (_props: { class: string }) => {
    return <></>;
  };
  const TestB = (_props: { type: string }) => {
    return <></>;
  };
  const TestC = (_props: { category: string }) => {
    return <></>;
  };

  const singleton = <TestA class="apple" />;
  const multiple = [
    <TestA class="apple" key="A" />,
    <TestB type="apple" key="B" />,
  ];

  test("Children Pluralisation", () => {
    expect(Slot.children(singleton)).toEqual([singleton]);
    expect(Slot.children(multiple)).toBe(multiple);
  });

  test("Find child of type", () => {
    expect(Slot.find(multiple, TestA)).not.toBeNull();
    expect(Slot.find(multiple, TestC)).toBeUndefined();
  });

  test("Find slot or default", () => {
    const noA = [<TestB type="apple" key="B" />];

    const def = <TestA class="apple" key="A" />;

    expect(Slot.findOrDefault(undefined, def)).toBe(def);
    expect(Slot.findOrDefault(def, def)).toBe(def);
    expect(Slot.findOrDefault(noA, def)).toBe(def);
    expect(Slot.findOrDefault(noA[0], def)).toBe(def);
    expect(Slot.findOrDefault([], def)).toBe(def);

    expect(Slot.findOrDefault(multiple, def)).not.toBe(def);
  });

  test("Find slots or default", () => {
    const noA = [<TestB type="apple" key="B" />];
    const def = <TestA class="apple" key="A" />;
    const otherA = <TestA class="mango" key="C" />;

    expect(Slot.filterOrDefault(undefined, def)).toEqual([def]);
    expect(Slot.filterOrDefault([], def)).toEqual([def]);
    expect(Slot.filterOrDefault(noA, def)).toEqual([def]);
    expect(Slot.filterOrDefault(noA[0], def)).toEqual([def]);
    expect(Slot.filterOrDefault([def], def)).toEqual([def]);

    expect(Slot.filterOrDefault([...noA, otherA], def)).toEqual([otherA]);
    expect(Slot.filterOrDefault(otherA, def)).toEqual([otherA]);
  });

  describe("genClassNames", () => {
    describe("padding", () => {
      test("default dir", () => {
        const res = Slot.genClassNames({ padding: true });
        expect(res).toBe("p-2");
      });

      test("y dir", () => {
        const res = Slot.genClassNames({ padding: true, paddingDir: "y" });
        expect(res).toBe("py-2");
      });

      test("x dir", () => {
        const res = Slot.genClassNames({ padding: true, paddingDir: "x" });
        expect(res).toBe("px-2");
      });
    });

    test("spacing", () => {
      const res = Slot.genClassNames({ spacing: true });
      expect(res).toBe("space-y-2");
    });

    test("customClass", () => {
      const res = Slot.genClassNames({ spacing: true, className: "yoo hi" });
      expect(res).toBe("space-y-2 yoo hi");
    });
  });
});
