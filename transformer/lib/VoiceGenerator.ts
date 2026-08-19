interface VoiceGenerator {
    generateVoice(text: string, voice: string, outputFilePath: string): Promise<void>;
}

export default VoiceGenerator;