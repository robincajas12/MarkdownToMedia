import path from "node:path";
import { Optional } from "../lib/resultHandlers/Optional.js";
import { VideoGenerator } from "./VideoGenerator.js";
import { spawn } from "node:child_process";

export class FFMPEGVideoGenerator implements VideoGenerator {
    generate(outputFile: string, imagePath: string, audioPath: string): Promise<Optional<string>> {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn("ffmpeg", [
                "-y",
                "-loop", "1",
                "-i", imagePath,
                "-i", audioPath,
                "-c:v", "libopenh264",
                "-c:a", "aac",
                "-b:a", "192k",
                "-pix_fmt", "yuv420p",
                "-shortest",
                path.resolve(outputFile)
            ]);

            ffmpeg.stderr.on("data", (data) => process.stderr.write(data));

            ffmpeg.on("error", reject);

            ffmpeg.on("close", (code) => {
                if (code === 0) {
                    resolve(Optional.of(outputFile));
                } else {
                    resolve(Optional.empty());
                }
            });
        });
    }
}
