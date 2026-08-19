import path from "path";
import { Optional } from "../lib/resultHandlers/Optional.js";
import Voicevox from "../lib/Voicevox.js";
import { ParsedMarkdown, ServiceHandler } from "./ServiceHandler.js";

export class VoiceBoxHandler extends ServiceHandler
{
    private voicevox : Voicevox;
    public constructor(voicevox : Voicevox)
    {
        super()
        this.voicevox = voicevox;
    }

    async generateVoice(parsedMarkdown: ParsedMarkdown): Promise<Optional<string>> {
        console.log("ejecutando voicevox")
        if(parsedMarkdown.character.service !== 'voicevox')
        {
            const next : ServiceHandler | undefined = this.getNext()
            if(next !== undefined) return next.generateVoice(parsedMarkdown)
            else return Optional.empty<string>()
            
        }
        const fileName : string = this.generateHashForFileName(parsedMarkdown) + '.wav'
        const outputFilePath :string =  path.join(path.resolve(parsedMarkdown.output_dir), fileName)

        if(this.checkIfFileExist(outputFilePath)) return Optional.of(fileName)
        
        await this.voicevox.generateVoice(parsedMarkdown.text,parsedMarkdown.character.voice, outputFilePath)
        return Optional.of(fileName)

    }
    
}