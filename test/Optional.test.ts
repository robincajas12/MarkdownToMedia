import { Optional } from "../transformer/lib/resultHandlers/Optional.js";

describe("Optional", () => {
  it("of throws on nullish values", () => {
    expect(() => Optional.of(null)).toThrow();
    expect(() => Optional.of(undefined)).toThrow();
  });

  it("ofNullable wraps present values and empties for nullish", () => {
    expect(Optional.ofNullable(42).isPresent()).toBe(true);
    expect(Optional.ofNullable(null).isEmpty()).toBe(true);
  });

  it("orElse returns the fallback when empty", () => {
    expect(Optional.empty<string>().orElse("fallback")).toBe("fallback");
    expect(Optional.of("value").orElse("fallback")).toBe("value");
  });

  it("orElseGet evaluates the supplier only when empty", () => {
    expect(Optional.empty<string>().orElseGet(() => "fallback")).toBe("fallback");
    expect(Optional.of("value").orElseGet(() => "fallback")).toBe("value");
  });

  it("orElseThrow throws the provided error when empty", () => {
    expect(() => Optional.empty().orElseThrow(() => new Error("nope"))).toThrow(
      "nope"
    );
  });

  it("get throws when empty", () => {
    expect(() => Optional.empty().get()).toThrow("No value present");
  });

  it("map transforms present values and stays empty otherwise", () => {
    expect(Optional.of(2).map((n) => n * 3).get()).toBe(6);
    expect(Optional.empty<number>().map((n) => n * 3).isEmpty()).toBe(true);
  });

  it("flatMap flattens nested optionals", () => {
    const toOpt = (n: number) => Optional.ofNullable(n > 0 ? n : null);
    expect(Optional.of(5).flatMap(toOpt).get()).toBe(5);
    expect(Optional.of(-1).flatMap(toOpt).isEmpty()).toBe(true);
  });

  it("filter keeps matching values and empties otherwise", () => {
    expect(Optional.of(10).filter((n) => n > 5).get()).toBe(10);
    expect(Optional.of(2).filter((n) => n > 5).isEmpty()).toBe(true);
  });

  it("cannot be inherited", () => {
    // @ts-expect-error Optional is not inheritable
    class EvilOptional<T> extends Optional<T> {
      constructor() {
        super(undefined as T);
      }
    }
    expect(() => new EvilOptional()).toThrow("Optional cannot be inherited");
  });
});
