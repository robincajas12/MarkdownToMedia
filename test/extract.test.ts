import {
  extractContent,
  extractMetadata,
  extractDialogue,
  parseMetadata,
  getYMLProperties,
  parseMarkdown,
  replaceText,
  applyReplacements,
} from "../transformer/extract.js";

describe("extractMetadata", () => {
  it("extracts the frontmatter block at the top of the string", () => {
    const input = `---
output_dir: ./x
output_file: guion.wav
---
# Escena 1
@Narrador: Hola`;
    expect(extractMetadata(input).orElse("")).toBe(
      "output_dir: ./x\noutput_file: guion.wav"
    );
  });

  it("returns empty Optional when there is no frontmatter", () => {
    expect(extractMetadata("no frontmatter").isEmpty()).toBe(true);
  });

  it("returns empty Optional when content precedes the block", () => {
    const input = `some text
---
a
---
`;
    expect(extractMetadata(input).isEmpty()).toBe(true);
  });

  it("handles a multi-line frontmatter", () => {
    const input = `---
output_dir: ./generated_audio
output_file: guion_completo.wav
replacements:
  "ñ": "ni"
characters:
  - name: Narrador
    voice: loquendo/Jorge
---
@Narrador: Hola`;
    expect(extractMetadata(input).get()).toBe(
      `output_dir: ./generated_audio
output_file: guion_completo.wav
replacements:
  "ñ": "ni"
characters:
  - name: Narrador
    voice: loquendo/Jorge`
    );
  });
});

describe("extractContent", () => {
  it("extracts the content after the frontmatter block", () => {
    const input = `---
output_dir: ./x
---
# Escena 1
@Narrador: Hola`;
    expect(extractContent(input).orElse("")).toBe("# Escena 1\n@Narrador: Hola");
  });

  it("returns empty Optional when there is no frontmatter", () => {
    expect(extractContent("no frontmatter").isEmpty()).toBe(true);
  });

  it("keeps the trailing body content", () => {
    const input = `---
a
---
@Zundamon: おはよう`;
    expect(extractContent(input).get()).toBe("@Zundamon: おはよう");
  });
});

describe("parseMetadata", () => {
  it("parses the frontmatter into an object", () => {
    const input = `---
output_dir: ./generated_audio
output_file: guion_completo.wav
replacements:
  "ñ": "ni"
characters:
  - name: Narrador
    voice: loquendo/Jorge
---
@Narrador: Hola`;
    expect(parseMetadata(input)).toEqual({
      output_dir: "./generated_audio",
      output_file: "guion_completo.wav",
      replacements: { "ñ": "ni" },
      characters: [{ name: "Narrador", voice: "loquendo/Jorge" }],
    });
  });
});

describe("getYMLProperties", () => {
  it("maps metadata keys to YMLProperties", () => {
    expect(
      getYMLProperties({
        output_dir: "./generated_audio",
        output_file: "guion.wav",
        api_url: "http://localhost:8080",
        replacements: { "ñ": "ni" },
        characters: [{ name: "Narrador", voice: "loquendo/Jorge", service: "koei" }],
      })
    ).toEqual({
      use: undefined,
      output_dir: "./generated_audio",
      output_file: "guion.wav",
      api_url: "http://localhost:8080",
      replacements: { "ñ": "ni" },
      characters: [{ name: "Narrador", voice: "loquendo/Jorge", service: "koei" }],
    });
  });

  it("defaults to empty replacements and characters", () => {
    expect(getYMLProperties({})).toEqual({
      use: undefined,
      output_dir: undefined,
      output_file: undefined,
      api_url: undefined,
      replacements: {},
      characters: [],
    });
  });
});

describe("parseMarkdown", () => {
  it("returns metadata and dialogue from a markdown string", () => {
    const input = `---
output_dir: ./generated_audio
output_file: guion.wav
---
@Narrador: Hola gente como estan?`;
    expect(parseMarkdown(input)).toEqual({
      metadata: {
        use: undefined,
        output_dir: "./generated_audio",
        output_file: "guion.wav",
        api_url: undefined,
        replacements: {},
        characters: [],
      },
      dialogue: [{ name: "Narrador", text: "Hola gente como estan?" }],
    });
  });
});

describe("replaceText", () => {
  it("replaces all occurrences of each key", () => {
    const text = "¡Áñadé oñ ñ";
    const replacements = { ñ: "ni", "¡": "", á: "a", é: "e" };
    expect(replaceText(text, replacements)).toBe("Ániade oni ni");
  });

  it("returns the text unchanged when no replacements are given", () => {
    expect(replaceText("hola mundo")).toBe("hola mundo");
  });
});

describe("applyReplacements", () => {
  it("replaces all occurrences of each key", () => {
    expect(applyReplacements("¡Hólá!", { "¡": "", á: "a", ó: "o" })).toBe("Hola!");
  });

  it("returns the text unchanged when replacements is empty", () => {
    expect(applyReplacements("hola mundo", {})).toBe("hola mundo");
  });
});

describe("parseLines", () => {
  it("parses character lines into objects", () => {
    const input = `@Narrador: Hola gente como estan?
@Zundamon: おはようお！`;
    expect(extractDialogue(input)).toEqual([
      { name: "Narrador", text: "Hola gente como estan?" },
      { name: "Zundamon", text: "おはようお！" },
    ]);
  });

  it("appends continuation lines to the previous character line", () => {
    const input = `# Escena 1
@Narrador: Hola
some random text`;
    expect(extractDialogue(input)).toEqual([
      { name: "Narrador", text: "Hola some random text" },
    ]);
  });
});