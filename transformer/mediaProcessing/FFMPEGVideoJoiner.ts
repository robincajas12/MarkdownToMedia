import path from "node:path";
import { Optional } from "../lib/resultHandlers/Optional.js";
import { VideoJoiner } from "./VideoJoiner.js";
import { spawn } from "node:child_process";

export class FFMPEGVideoJoiner implements VideoJoiner {
    join(outputFile: string, videos: string[]): Promise<Optional<string>> {
        const videoInputs = videos.flatMap(video => ["-i", video]);

        const inputs = videos
            .map((_, index) => `[${index}:v][${index}:a]`)
            .join("");

        const filter = `${inputs}concat=n=${videos.length}:v=1:a=1[outv][outa]`;

        return new Promise((resolve, reject) => {
            const ffmpeg = spawn("ffmpeg", [
                "-y",
                ...videoInputs,
                "-filter_complex",
                filter,
                "-map", "[outv]",
                "-map", "[outa]",
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
