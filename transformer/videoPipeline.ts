import path from "node:path";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { Optional } from "./lib/resultHandlers/Optional.js";
import { FFMPEGJoinTool } from "./mediaProcessing/FFMPEGJoinTool.js";
import { FFMPEGVideoGenerator } from "./mediaProcessing/FFMPEGVideoGenerator.js";
import { FFMPEGVideoJoiner } from "./mediaProcessing/FFMPEGVideoJoiner.js";
import { ServiceHandler } from "./handlers/ServiceHandler.js";
import { ParsedMarkdown } from "./handlers/ServiceHandler.js";
import { MediaBlock, replaceText, YMLProperties } from "./extract.js";

export async function generateVoicesForBlocks(blocks: MediaBlock[], props: YMLProperties, handler: ServiceHandler) {
  const outputDir = path.resolve(props.output_dir || './cache');
  return await Promise.all(
    blocks.map(async (block) => {
      const results =await block.characterLines.map(async (line) => {
        const character = props.characters?.find(c => c.name === line.name);

        if (!character) {
          console.log(`character(${line.name}) not found in yml props, please verify`);
          return Optional.empty;
        }

        const params: ParsedMarkdown = {
          character,
          text: replaceText(line.text, props.replacements),
          output_dir: outputDir
        };

        return await handler.generateVoiceOrNext(params);
      });

      const characterLines = (await Promise.all(results))
        .filter((d): d is Optional<string> => typeof d !== "function");

      return {
        ...block,
        characterLines: characterLines.map((item: Optional<string>) => item.get()),
      };
    })
  );
}

export async function generateBlockVideo(item: { sourceMedia: string; characterLines: string[] }, props: YMLProperties) {
  const outputDir = path.resolve(props.output_dir || './cache');
  const imagePath = path.resolve(item.sourceMedia);
  const imageContent = await fs.readFile(imagePath);
  const imageHash = createHash('md5').update(imageContent).digest('hex');
  const hashVideo = createHash('md5').update(`${imageHash}:${item.characterLines.join(':')}-video`).digest('hex');
  const hashAudio = createHash('md5').update(`${imageHash}:${item.characterLines.join(':')}-audio`).digest('hex');

  const videoFileName = hashVideo + '.mp4';
  const audioFileName = hashAudio + '.wav';
  const videoOutputPath = path.join(outputDir, videoFileName);
  const audioOutputPath = path.join(outputDir, audioFileName);

  if (!existsSync(videoOutputPath)) {
    const audioJoinTool = new FFMPEGJoinTool();
    const audioPath = path.resolve(audioOutputPath);
    const audioFiles = item.characterLines.map(file => path.join(outputDir, file));

    if (!existsSync(audioPath)) {
      await audioJoinTool.join(audioPath, audioFiles);
    }

    const videoGenerator = new FFMPEGVideoGenerator();
    await videoGenerator.generate(path.resolve(videoOutputPath), imagePath, audioPath);
  }

  return path.resolve(videoOutputPath);
}

export async function generateFinalVideo(videos: string[], outputPath: string) {
  const finalPath = path.resolve(outputPath);

  const videoJoiner = new FFMPEGVideoJoiner();
  await videoJoiner.join(finalPath, videos);

  return finalPath;
}
