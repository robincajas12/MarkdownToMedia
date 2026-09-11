import fs from "node:fs/promises";
import path from "node:path";

import { joinAudioFiles } from "../transformer/audioPipeline.js";
import { generateFinalVideo } from "../transformer/videoPipeline.js";
import { Optional } from "../transformer/lib/resultHandlers/Optional.js";
import { FFMPEGJoinTool } from "../transformer/mediaProcessing/FFMPEGJoinTool.js";
import { FFMPEGVideoJoiner } from "../transformer/mediaProcessing/FFMPEGVideoJoiner.js";

describe("output overwrite behavior", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("joinAudioFiles overwrites an existing final audio file", async () => {
    const outputDir = path.join(process.cwd(), "tmp-output-audio");
    const outputPath = path.join(outputDir, "result.wav");

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, "old-data");

    const joinSpy = jest.spyOn(FFMPEGJoinTool.prototype, "join").mockResolvedValue(Optional.of(outputPath));

    await joinAudioFiles([Optional.of("clip.wav")], {
      output_dir: outputDir,
      output_file: outputPath,
    } as any);

    expect(joinSpy).toHaveBeenCalledTimes(1);
    expect(joinSpy).toHaveBeenCalledWith(outputPath, [path.join(outputDir, "clip.wav")]);

    await fs.rm(outputDir, { recursive: true, force: true });
  });

  test("generateFinalVideo overwrites an existing final video file", async () => {
    const outputDir = path.join(process.cwd(), "tmp-output-video");
    const outputPath = path.join(outputDir, "result.mp4");

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, "old-data");

    const joinSpy = jest.spyOn(FFMPEGVideoJoiner.prototype, "join").mockResolvedValue(Optional.of(outputPath));

    await generateFinalVideo(["segment-1.mp4"], outputPath);

    expect(joinSpy).toHaveBeenCalledTimes(1);
    expect(joinSpy).toHaveBeenCalledWith(outputPath, ["segment-1.mp4"]);

    await fs.rm(outputDir, { recursive: true, force: true });
  });
});
