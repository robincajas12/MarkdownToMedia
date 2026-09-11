import path from "node:path";
import { existsSync } from "node:fs";
import { Optional } from "./lib/resultHandlers/Optional.js";
import { FFMPEGJoinTool } from "./mediaProcessing/FFMPEGJoinTool.js";
import { ServiceHandler } from "./handlers/ServiceHandler.js";
import { ParsedMarkdown } from "./handlers/ServiceHandler.js";
import { CharacterLine, replaceText, YMLProperties } from "./extract.js";

export async function generateVoicesForDialogue(dialogue: CharacterLine[], props: YMLProperties, handler: ServiceHandler) {
  const outputDir = path.resolve(props.output_dir || './cache');
  
  const results = dialogue.map((item) => {
    const character = props.characters?.find(c => c.name === item.name);
    
    if (!character) {
      console.log(`character(${item.name}) not found in yml props, please verify`);
      return Optional.empty;
    }
    
    const params: ParsedMarkdown = {
      character,
      text: replaceText(item.text, props.replacements),
      output_dir: outputDir
    };
    
    return handler.generateVoiceOrNext(params);
  });

  return (await Promise.all(results))
    .filter((d): d is Optional<string> => typeof d !== 'function');
}

export async function joinAudioFiles(outputFiles: Optional<string>[], props: YMLProperties) {
  const outputDir = path.resolve(props.output_dir || './cache');
  const outputPath = path.resolve(props.output_file || './result.wav');

  const ffmpegJoinTool = new FFMPEGJoinTool();
  const audioFiles = outputFiles.map(item => path.join(outputDir, item.get()));
  await ffmpegJoinTool.join(outputPath, audioFiles);

  return outputPath;
}
