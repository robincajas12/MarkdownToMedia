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
import { createHash, hash } from "node:crypto";
import { FFMPEGVideoGenerator } from "./mediaProcessing/FFMPEGVideoGenerator.js";
import { FFMPEGVideoJoiner } from "./mediaProcessing/FFMPEGVideoJoiner.js";

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
        console.log("Can't set cache foler to: ", props.output_dir || './cache')
        return
    }

    const dialoge = parsedMarkdown.dialogue;

    const res = dialoge.map((item) => {
        const character = props.characters?.find(c => c.name === item.name)
        if (!character) {
            console.log('character(' + item.name + ') not found in yml props, please verify')
            return Optional.empty
        }
        const params: ParsedMarkdown = {
            character: character,
            text: replaceText(item.text, props.replacements),
            output_dir: props.output_dir || './cache'
        }
        return loquendoHandler.generateVoiceOrNext(params)
    })

    const outputFiles = (await Promise.all(res)).filter((d): d is Optional<string> => typeof d !== 'function')
    const ffmpegJoinTool = new FFMPEGJoinTool();
    console.log(outputFiles)
    if (props.output_dir) console.log(await ffmpegJoinTool.join(path.resolve(props.output_file || './result.wav'), outputFiles.map(item => path.join(path.resolve(props.output_dir || './cache'), item.get()))))
}



export async function transformToVideo(markdown: string, baseDir?: string) {
  const res = await parseMarkdownAndXML(markdown, baseDir);
  const props = res.metadata;

  const resolvedOutputDir = baseDir ? path.resolve(baseDir, props.output_dir || './cache') : path.resolve(props.output_dir || './cache')

  if (!await checkIfCacheFolderExistIfNotCreate(resolvedOutputDir)) {
    console.log(
      "Can't set cache folder to:",
      resolvedOutputDir
    );
    return;
  }

  const mapped = await Promise.all(
    res.blocks.map(async (block) => {
      const results = block.characterLines.map((line) => {
        const character = props.characters?.find(
          c => c.name === line.name
        );

        if (!character) {
          console.log(
            `character(${line.name}) not found in yml props, please verify`
          );
          return Optional.empty;
        }

        const params: ParsedMarkdown = {
          character,
          text: replaceText(line.text, props.replacements),
          output_dir: resolvedOutputDir
        };

        return loquendoHandler.generateVoiceOrNext(params);
      });

      const characterLines = (await Promise.all(results))
        .filter(
          (d): d is Optional<string> =>
            typeof d !== "function"
        );

      return {
        ...block,
        characterLines: characterLines.map((item: Optional<string>) => item.get()),
      };
    })
  );

  console.log(mapped);
  const videoGenerator = new FFMPEGVideoGenerator()
  const audioJoinTool = new FFMPEGJoinTool()
  const videos = await Promise.all(mapped.map(async item => {
    const hashVieo = createHash('md5').update(`${item.sourceMedia}:${item.characterLines.join(':')}-video`).digest('hex');
    const hashAudio = createHash('md5').update(`${item.sourceMedia}:${item.characterLines.join(':')}-audio`).digest('hex');

    const videoFileName = hashVieo + '.mp4' 
    const auioFileName = hashAudio + '.wav'
    await audioJoinTool.join(path.resolve(path.join(resolvedOutputDir, auioFileName)), item.characterLines.map(item => path.join(resolvedOutputDir, item)))
    const outputFileName = path.resolve(path.join(resolvedOutputDir, videoFileName))
    const audioUrl = path.resolve(path.join(resolvedOutputDir, auioFileName))
    const imageUrl = baseDir ? path.resolve(baseDir, item.sourceMedia) : path.resolve(item.sourceMedia)
    await videoGenerator.generate(outputFileName, imageUrl, audioUrl)
    return outputFileName
}))

    const videoJoiner = new FFMPEGVideoJoiner()
    const outputPath = baseDir ? path.resolve(baseDir, props.output_file || './result.mp4') : path.resolve(props.output_file || './result.mp4')

    await videoJoiner.join(outputPath, videos)

    return outputPath
}