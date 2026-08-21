import path from "node:path";
import Loquendo from "../lib/Loquendo.js";
import { Optional } from "../lib/resultHandlers/Optional.js";
import { ParsedMarkdown, ServiceHandler } from "./ServiceHandler.js";

export class LoquendoHandler extends ServiceHandler{
    getServiceName(): string {
        return 'loquendo'
    }
    private loquendo : Loquendo;
    public constructor(loquendo: Loquendo)
    {
        super()
        this.loquendo = loquendo;
    }
    async generateVoice(parsedMarkdown: ParsedMarkdown): Promise<Optional<string>> {
        const fileName : string = this.generateHashForFileName(parsedMarkdown) + '.wav'
        const outputFilePath :string =  path.join(path.resolve(parsedMarkdown.output_dir), fileName)
        const generatedFileName = fileName.replace('.wav', '.wav001.wav');

        if(this.checkIfFileExist(outputFilePath.replace('.wav', '.wav001.wav'))) return Optional.of(generatedFileName)
        
        await this.loquendo.generateVoice(parsedMarkdown.text,parsedMarkdown.character.voice, outputFilePath)
        return  await Optional.of(generatedFileName)

    }



    
}