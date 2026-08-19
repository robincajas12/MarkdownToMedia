import { Optional } from "../resultHandlers/Optional.js";
import fs from 'node:fs';

export async function readFile(url: string) : Promise<Optional<string>>
{
    try {
        const data = fs.readFileSync(url, 'utf8');
        return Optional.of(data);
    } catch (err) {
        console.error(err);
        return Optional.empty<string>();
    }
}