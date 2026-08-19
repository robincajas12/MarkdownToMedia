import VoiceGenerator from "./VoiceGenerator.js";
import fs from "node:fs/promises";


export interface VoicevoxStyle {
    name: string;
    id: number;
    type?: string;
}

export interface VoicevoxSpeaker {
    name: string;
    speaker_uuid: string;
    styles: VoicevoxStyle[];
    version?: string;
}

export interface FormattedVoice {
    id: number;
    name: string;
    style: string;
    fullName: string;
}

class Voicevox implements VoiceGenerator {
    private apiUrl: string;

    constructor(apiUrl?: string) {
        this.apiUrl = (apiUrl || "http://127.0.0.1:50021").replace(/\/$/, "");
    }

    /**
     * Obtiene la lista completa de speakers desde la API de VOICEVOX.
     */
    async getSpeakers(): Promise<VoicevoxSpeaker[]> {
        try {
            const response = await fetch(`${this.apiUrl}/speakers`);
            if (!response.ok) {
                throw new Error(`Failed to fetch speakers from Voicevox: ${response.statusText}`);
            }
            return (await response.json()) as VoicevoxSpeaker[];
        } catch (error: any) {
            console.error(`[Voicevox] Error fetching speakers: ${error.message}`);
            return [];
        }
    }

    /**
     * Devuelve una lista aplanada y amigable de todas las voces y estilos disponibles con sus IDs.
     */
    async getVoicesList(): Promise<FormattedVoice[]> {
        const speakers = await this.getSpeakers();
        const list: FormattedVoice[] = [];
        for (const speaker of speakers) {
            for (const style of speaker.styles) {
                list.push({
                    id: style.id,
                    name: speaker.name,
                    style: style.name,
                    fullName: `${speaker.name} (${style.name})`
                });
            }
        }
        return list;
    }

    /**
     * Resuelve el ID del speaker a partir de un ID numérico o de un nombre de personaje/estilo.
     */
    private async resolveSpeakerId(voice: unknown): Promise<number> {
        const voiceStr = String(voice ?? "");
        const numericId = Number(voiceStr);
        if (!isNaN(numericId) && voiceStr.trim() !== "") return numericId;

        const speakers = await this.getSpeakers();
        const lowerVoice = voiceStr.toLowerCase().trim();

        for (const speaker of speakers) {
            for (const style of speaker.styles) {
                const fullName = `${speaker.name} (${style.name})`.toLowerCase();
                const combined = `${speaker.name} ${style.name}`.toLowerCase();
                if (fullName === lowerVoice || combined === lowerVoice) return style.id;
            }
        }

        for (const speaker of speakers) {
            if (speaker.name.toLowerCase() === lowerVoice) return speaker.styles[0]?.id ?? 3;
        }

        return 3;
    }

    /**
     * Genera el archivo WAV usando el flujo de VOICEVOX:
     * 1. POST /audio_query
     * 2. POST /synthesis
     */
    async generateVoice(text: string, voice: string, outputFilePath: string): Promise<void> {
        const speakerId = await this.resolveSpeakerId(voice);
        console.log(`[Voicevox] Generando audio -> SpeakerId: ${speakerId}, Voz: "${voice}", Texto: "${text}"`);

        // 1. Audio query
        const queryUrl = `${this.apiUrl}/audio_query?speaker=${speakerId}&text=${encodeURIComponent(text)}`;
        const queryRes = await fetch(queryUrl, { method: "POST" });
        if (!queryRes.ok) {
            const errBody = await queryRes.text();
            throw new Error(`Voicevox audio_query falló (${queryRes.status}): ${errBody}`);
        }
        const queryJson = await queryRes.json();

        // 2. Synthesis
        const synthUrl = `${this.apiUrl}/synthesis?speaker=${speakerId}`;
        const synthRes = await fetch(synthUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(queryJson)
        });

        if (!synthRes.ok) {
            const errBody = await synthRes.text();
            throw new Error(`Voicevox synthesis falló (${synthRes.status}): ${errBody}`);
        }

        const arrayBuffer = await synthRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await fs.writeFile(outputFilePath, buffer);
        console.log(`[Voicevox] Archivo de audio guardado en: ${outputFilePath}`);
    }
}

export default Voicevox;
