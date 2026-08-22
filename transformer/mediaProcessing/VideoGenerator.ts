import { Optional } from "../lib/resultHandlers/Optional.js";

export interface VideoGenerator {
    /**
     * Generates a video from an image and audio file
     * @param outputFile output video file path
     * @param imagePath path to the background image
     * @param audioPath path to the audio file
     */
    generate(outputFile: string, imagePath: string, audioPath: string): Promise<Optional<string>>;
}
