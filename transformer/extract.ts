import { Optional } from "./lib/resultHandlers/Optional.js";
import { parse } from "yaml";

export function extractMetadata(str: string): Optional<string> {
  const match = /^---\n([\s\S]*?)\n---/.exec(str);
  return Optional.ofNullable(match?.[1]);
}

export function extractContent(str: string): Optional<string> {
  const match = /^---\n[\s\S]*?\n---\n?([\s\S]*)$/.exec(str);
  return Optional.ofNullable(match?.[1]);
}

export interface CharacterLine {
  name: string;
  text: string;
}

export function parseMetadata(str: string): Record<string, unknown> {
  return parse(extractMetadata(str).get()) as Record<string, unknown>;
}

export function extractDialogue(str: string): CharacterLine[] {
  const lines: CharacterLine[] = [];
  let current: CharacterLine | null = null;

  const flush = () => {
    if (current && current.text.trim()) {
      lines.push(current);
    }
    current = null;
  };

  str.split(/\r?\n/).forEach((raw) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      flush();
      return;
    }
    const mention = /^@([^:]+):\s*([\s\S]*)$/.exec(trimmed);
    if (mention) {
      flush();
      current = { name: mention[1].trim(), text: mention[2].trim() };
    } else if (current) {
      current.text += " " + trimmed;
    }
  });

  flush();

  return lines;
}

export type Character = {
  name: string;
  voice: string;
  service: string;
}

export type YMLProperties = {
  use?: string[],
  output_dir?: string;
  output_file?: string;
  api_url?: string;
  replacements?: Record<string, string>;
  characters?: Array<Character>;
};
export function getYMLProperties(metadata: Record<string, unknown>): YMLProperties {
  const urlMatch = (metadata.api_url ?? metadata.apiUrl ?? metadata.url) as string | undefined;
  return {
    use: metadata.use as string[],
    output_dir: metadata.output_dir as string,
    output_file: metadata.output_file as string,
    api_url: urlMatch,
    replacements: (metadata.replacements as Record<string, string>) || {},
    characters: ((metadata.characters as Array<Character>) || [])
  };
}
export function parseMarkdown(str: string): { metadata: YMLProperties; dialogue: CharacterLine[] } {
  return {
    metadata: getYMLProperties(parseMetadata(str)),
    dialogue: extractDialogue(str)
  };
}

export function applyReplacements(text: string, replacements: Record<string, string>): string {
  let result = text;
  for (const [search, replace] of Object.entries(replacements)) {
    const regex = new RegExp(search, "g");
    result = result.replace(regex, replace);
  }
  return result;
}