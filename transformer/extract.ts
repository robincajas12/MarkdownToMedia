import { XMLParser } from "fast-xml-parser";
import { Optional } from "./lib/resultHandlers/Optional.js";
import { parse } from "yaml";
import { existsSync } from "fs";
import { readFile } from "./lib/fs/fslib.js";
import path from "path";

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

export async function getYMLPropertiesInCascade(mainProps: YMLProperties, baseDir?: string) : Promise<YMLProperties>
{
    if(mainProps.use)
    {
    const ymlfiles = await Promise.allSettled(mainProps.use.filter(async item => {
      const filePath = baseDir ? path.resolve(baseDir, item) : path.resolve(item);
      console.log(filePath)
      if(await existsSync(filePath)) return true
      console.log(filePath, 'does not exist.')
      return false
    }).map(async item => await readFile(baseDir ? path.resolve(baseDir, item) : path.resolve(item))))

const props: YMLProperties = ymlfiles
    .filter(item => item.status === "fulfilled")
    .map(item => item.value.get())
    .map(item => getYMLProperties(parse(item)))
    .reduce(
        (acc, val) => ({
            ...acc,
            ...Object.fromEntries(
                Object.entries(val).filter(([_, value]) => value !== undefined)
            )
        }),
        mainProps
    );
    return props
    }
    return mainProps
}


export function parseMetadata(str: string): Record<string, unknown> {
  return parse(extractMetadata(str).get()) as Record<string, unknown>;
}

export interface MediaBlock {
  mediaType: string;
  sourceMedia: string;
  characterLines: CharacterLine[];
}

export function getMediaTags(str: string): MediaBlock[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: true
  });

  const content = parser.parse(str);

  const blocks: MediaBlock[] = [];

  content.forEach((element: Record<string, any>) => {
    const sourceMedia =
      element[":@"]?.["@_source"] ?? "";

    Object.entries(element).forEach(([key, value]) => {
      if (key === ":@") {
        return;
      }

      if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === "object"
      ) {
        const first = value[0] as Record<string, unknown>;

        if (typeof first["#text"] === "string") {
          blocks.push({
            mediaType: key,
            sourceMedia,
            characterLines: extractDialogue(
              first["#text"]
            )
          });
        }
      }
    });
  });

  return blocks;
}
export function parseMarkdown(str: string): { metadata: YMLProperties; dialogue: CharacterLine[] } {
  return {
    metadata: getYMLProperties(parseMetadata(str)),
    dialogue: extractDialogue(str)
  };
}

export async function parseMarkdownAndXML(str: string, baseDir?: string) : Promise<{ metadata: YMLProperties; blocks: MediaBlock[]; } >
{
  const tags =  getMediaTags(str)
  const props :  YMLProperties = await getYMLPropertiesInCascade(getYMLProperties(parseMetadata(str)), baseDir)
  const xml = getMediaTags(str)
  return {
    metadata: props,
    blocks: xml
  }
}

export function replaceText(text: string, replacements: Record<string, unknown> = {}): string {
  let result = text;
  for (const [search, replace] of Object.entries(replacements)) {
    result = result.split(search).join(String(replace));
  }
  return result;
}
export function applyReplacements(text: string, replacements: Record<string, string>): string {
  let result = text;
  for (const [search, replace] of Object.entries(replacements)) {
    const regex = new RegExp(search, "g");
    result = result.replace(regex, replace);
  }
  return result;
}