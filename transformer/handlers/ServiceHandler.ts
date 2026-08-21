import { createHash } from "node:crypto";
import Loquendo from "../lib/Loquendo.js";
import { Optional } from "../lib/resultHandlers/Optional.js";
import VoiceGenerator from "../lib/VoiceGenerator.js";
import { Character } from "../extract.js";
import { IServiceHandler } from "./IServiceHandler.js";
import { existsSync } from "node:fs";

export type ParsedMarkdown = {
    output_dir: string;
    character: Character;
    text: string;
};
export abstract class ServiceHandler implements IServiceHandler
{

    private nextHandler : ServiceHandler | undefined;

    next(handler: ServiceHandler | undefined) : ServiceHandler | undefined {
        this.nextHandler = handler;
        return this.nextHandler;
    }
    getNext() : ServiceHandler | undefined {
        return this.nextHandler;
    }
    abstract getServiceName() : string
    async generateVoiceOrNext(parsedMarkdown: ParsedMarkdown) : Promise<Optional<string>>
    {
        if(parsedMarkdown.character.service !== this.getServiceName())
        {
            const next : ServiceHandler | undefined = this.getNext()
            if(next !== undefined) return next.generateVoice(parsedMarkdown)
            else return Optional.empty<string>()
            
        }
        return this.generateVoice(parsedMarkdown);
    }
    abstract generateVoice(parsedMarkdown: ParsedMarkdown): Promise<Optional<string>>;
    generateHashForFileName(parsedmarkdown : ParsedMarkdown)
    {
        const {character, output_dir, text} = parsedmarkdown
        const hash = createHash('md5').update(`${character.service}:${character.voice}:${text}`).digest('hex');
        return hash
    }
    checkIfFileExist(fileUrl : string) : boolean
    {
        const cachedFilePath = fileUrl;
        
        return existsSync(cachedFilePath)
    }

}