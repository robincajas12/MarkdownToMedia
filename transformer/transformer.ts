import path from "node:path";
import Loquendo from "./lib/Loquendo.js";
import { Optional } from "./lib/resultHandlers/Optional.js";
import Voicevox from "./lib/Voicevox.js";
import { FFMPEGJoinTool } from "./mediaProcessing/FFMPEGJoinTool.js";
import { applyReplacements, Character, CharacterLine, getYMLProperties, parseMarkdown, parseMetadata, replaceText, YMLProperties } from "./extract.js";
import { LoquendoHandler } from "./handlers/LoquendoHandler.js";
import { ParsedMarkdown } from "./handlers/ServiceHandler.js";
import { VoiceBoxHandler } from "./handlers/VoicevoxHandler.js";
import fs from "node:fs/promises";

import dotenv from 'dotenv'
import { existsSync } from "node:fs";
import { readFile } from "./lib/fs/fslib.js";
import { parse } from "yaml";
dotenv.config()
const loquendo = new Loquendo(process.env.LOQUENDO_PATH || "", process.env.OS || "LINUX");
const voicevox = new Voicevox(process.env.VOICEVOX_URL || "http://127.0.0.1:50021");

const loquendoHandler = new LoquendoHandler(loquendo)
const voicevoxHandler = new VoiceBoxHandler(voicevox)
loquendoHandler.next(voicevoxHandler)

export async function transform(markdown: string) {
    const parsedMarkdown = parseMarkdown(markdown);
    const mainProps: YMLProperties =parsedMarkdown.metadata;
    const dialoge = parsedMarkdown.dialogue;
    if(mainProps.use)
    {
    const ymlfiles = await Promise.allSettled(mainProps.use.filter(async item => {
      const filePath = path.resolve(item);
      console.log(filePath)
      if(await existsSync(filePath)) return true
      console.log(filePath, 'does not exist.')
      return false
    }).map(async item => await readFile(path.resolve(item))))

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
  
    await fs.mkdir(path.resolve(props.output_dir || './cache'), { recursive: true });
    const res = dialoge.map((item)=>{
        const character = props.characters?.find(c => c.name === item.name)
        if(!character){
            console.log('character(' + item.name + ') not found in yml props, please verify')
            return Optional.empty
        }
        const params : ParsedMarkdown = {
            character: character,
            text : replaceText(item.text, props.replacements),
            output_dir : props.output_dir || './cache'
        }
        return loquendoHandler.generateVoiceOrNext(params)
    })
    const outputFiles = (await Promise.all(res)).filter((d): d is Optional<string> => typeof d !== 'function')
    const ffmpegJoinTool = new FFMPEGJoinTool();
    console.log(outputFiles)
    if(props.output_dir) console.log(await ffmpegJoinTool.join(path.resolve(props.output_file || './result.wav'), outputFiles.map(item => path.join(path.resolve(props.output_dir || './cache'),item.get()))))
  }


}