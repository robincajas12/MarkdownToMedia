import path, { join } from "node:path";
import Loquendo from "./lib/Loquendo.js";
import { Optional } from "./lib/resultHandlers/Optional.js";
import Voicevox from "./lib/Voicevox.js";
import { FFMPEGJoinTool } from "./mediaProcessing/FFMPEGJoinTool.js";
import { getYMLPropertiesInCascade, parseMarkdown, parseMarkdownAndXML, replaceText, YMLProperties } from "./extract.js";
import { LoquendoHandler } from "./handlers/LoquendoHandler.js";
import { ParsedMarkdown } from "./handlers/ServiceHandler.js";
import { VoiceBoxHandler } from "./handlers/VoicevoxHandler.js";
import fs from "node:fs/promises";
import dotenv from 'dotenv'
import { generateVoicesForBlocks, generateBlockVideo, generateFinalVideo } from "./videoPipeline.js";
import { generateVoicesForDialogue, joinAudioFiles } from "./audioPipeline.js";

dotenv.config()
const loquendo = new Loquendo(process.env.LOQUENDO_PATH || "", process.env.OS || "LINUX");
const voicevox = new Voicevox(process.env.VOICEVOX_URL || "http://127.0.0.1:50021");

const loquendoHandler = new LoquendoHandler(loquendo)
const voicevoxHandler = new VoiceBoxHandler(voicevox)
loquendoHandler.next(voicevoxHandler)


export async function checkIfCacheFolderExistIfNotCreate(output_dir : string = './cache')
{
    try{
        await fs.mkdir(path.resolve(output_dir), { recursive: true });
        return true
    }catch(e)
    {
        return false
    }
}

export async function transformToAudio(markdown: string) {
    const parsedMarkdown = parseMarkdown(markdown);
    
    const props: YMLProperties = await getYMLPropertiesInCascade(parsedMarkdown.metadata);
    if(!await checkIfCacheFolderExistIfNotCreate(props.output_dir)) 
    {
        console.log("Can't set cache folder to: ", props.output_dir || './cache')
        return
    }

    const outputFiles = await generateVoicesForDialogue(parsedMarkdown.dialogue, props, loquendoHandler);
    console.log(outputFiles);
    return joinAudioFiles(outputFiles, props);
}

export async function transformToVideo(markdown: string) {
  const res = await parseMarkdownAndXML(markdown);
  const props = res.metadata;

  if (!await checkIfCacheFolderExistIfNotCreate(props.output_dir)) {
    console.log("Can't set cache folder to:", path.resolve(props.output_dir || './cache'));
    return;
  }

  const blocksWithVoices = await generateVoicesForBlocks(res.blocks, props, loquendoHandler);
  const videos = await Promise.all(blocksWithVoices.map(item => generateBlockVideo(item, props)));
  const outputFile = props.output_file || './result.mp4';
  const outputPath = path.resolve(outputFile.replace(/\.[^.]+$/, '.mp4'));

  return generateFinalVideo(videos, outputPath);
}
