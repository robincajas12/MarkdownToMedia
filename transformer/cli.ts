#!/usr/bin/env node
import { program } from "commander";
import { readFile } from "./lib/fs/fslib.js";
import {  transformToAudio, transformToVideo } from "./transformer.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const templatesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates");

program
    .name("markdown-to-media")
    .description("Create videos, audios, dialogues using Markdown");

program
    .command("init")
    .description("Scaffold a new project (index.md, config.yml, .env.template)")
    .option("-f, --force", "Overwrite existing files")
    .action(async (options) => {
        const files = [".env.template", "index.md", "config.yml"];

        for (const name of files) {
            const target = path.resolve(name);
            const exists = await fs
                .access(target)
                .then(() => true)
                .catch(() => false);
            if (exists && !options.force) {
                console.log(`Skip ${name}: already exists (use --force to overwrite)`);
                continue;
            }
            const template = await readFile(path.join(templatesDir, name));
            if (template.isEmpty()) {
                console.error(`Template not found: ${name}`);
                continue;
            }
            await fs.writeFile(target, template.get());
            console.log(`Created ${name}`);
        }
    });

program
    .command("audio")
    .option("-f, --file <string>", "Markdown file path")
    .action(async (options) => {
        const filePath = path.resolve(options.file);

        const file = await readFile(filePath);

        if (file.isEmpty()) {
            console.error("Error: make sure the file exists");
            return;
        }

        console.log("Reading:", filePath);

        transformToAudio(file.get());
    });

program
    .command("video")
    .option("-f, --file <string>", "Markdown file path")
    .action(async (options) => {
        const filePath = path.resolve(options.file);

        const file = await readFile(filePath);

        if (file.isEmpty()) {
            console.error("Error: make sure the file exists");
            return;
        }

        console.log("Reading:", filePath);

        console.log(await transformToVideo(file.get(), path.dirname(filePath)));
    });


program.parse();