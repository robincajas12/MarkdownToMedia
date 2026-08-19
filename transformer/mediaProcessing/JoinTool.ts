import { Optional } from "../lib/resultHandlers/Optional.js";

export interface JoinTool
{
    /**
     * 
     * @param audios audio file path
     * 
     */
    join(outputFile:string,audios: string[]) : Promise<Optional<string>>
}
