import path from "node:path";
import Loquendo from "../lib/Loquendo.js";
import { Optional } from "../lib/resultHandlers/Optional.js";
import { ParsedMarkdown, ServiceHandler } from "./ServiceHandler.js";

export class LoquendoHandler extends ServiceHandler{
    private loquendo : Loquendo;
    public constructor(loquendo: Loquendo)
    {
        super()
        this.loquendo = loquendo;
    }
    async generateVoice(parsedMarkdown: ParsedMarkdown): Promise<Optional<string>> {
        if(parsedMarkdown.character.service !== 'loquendo')
        {
            const next : ServiceHandler | undefined = this.getNext()
            if(next !== undefined) return next.generateVoice(parsedMarkdown)
            else return Optional.empty<string>()
            
        }
        const fileName : string = this.generateHashForFileName(parsedMarkdown) + '.wav'
        const outputFilePath :string =  path.join(path.resolve(parsedMarkdown.output_dir), fileName)
        const generatedFileName = fileName.replace('.wav', '.wav001.wav');

        if(this.checkIfFileExist(outputFilePath.replace('.wav', '.wav001.wav'))) return Optional.of(generatedFileName)
        
        await this.loquendo.generateVoice(parsedMarkdown.text,parsedMarkdown.character.voice, outputFilePath)
        return  await Optional.of(generatedFileName)

    }



    
}