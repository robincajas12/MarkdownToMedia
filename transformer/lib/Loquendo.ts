import VoiceGenerator from "./VoiceGenerator.js";
import {exec} from "child_process";
class Loquendo implements VoiceGenerator {
    private loquendoPath: string;
    private os: string;
    constructor(loquendoPath: string, os: string) {
        this.loquendoPath = loquendoPath || "";
        this.os = os  || "";
    }
    private executeTTSFileGenerator(text: string, voice: string, outputFilePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let command = '';
            if (this.os === 'LINUX') {
                command = `wine "${this.loquendoPath}" -v ${voice} -o "${outputFilePath}" -e wav <<< "${text}"`;
            }
            else throw new Error(`Unsupported OS: ${this.os}`);
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing command: ${error.message}`);
                    reject(error);
                    return;
                }

                console.log(`Command executed successfully: ${stdout}`);
                resolve();
            });
        })
    }

    generateVoice(text: string, voice: string, outputFilePath: string): Promise<void> {
        return this.executeTTSFileGenerator(text, voice, outputFilePath);
    }
}

export default Loquendo;