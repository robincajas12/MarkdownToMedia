import path from "node:path";
import { Optional } from "../lib/resultHandlers/Optional.js";
import { JoinTool } from "./JoinTool.js";
import { spawn } from "node:child_process";



export class FFMPEGJoinTool implements JoinTool {
    join(outputFile: string, audios: string[]): Promise<Optional<string>> {
        const audioParams = audios.flatMap(audio => ["-i", audio]);

        const inputs = audios
            .map((_, index) => `[${index}:a]`)
            .join("");

        const filter = `${inputs}concat=n=${audios.length}:v=0:a=1[out]`;

        return new Promise((resolve, reject) => {
            const ffmpeg = spawn("ffmpeg", [
                "-y",
                ...audioParams,
                "-filter_complex",
                filter,
                "-map",
                "[out]",
                "-acodec", "pcm_s16le",
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