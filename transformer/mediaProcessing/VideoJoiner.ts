import { Optional } from "../lib/resultHandlers/Optional.js";

export interface VideoJoiner {
    /**
     * Joins multiple video files into one
     * @param outputFile output video file path
     * @param videos array of video file paths to join
     */
    join(outputFile: string, videos: string[]): Promise<Optional<string>>;
}
