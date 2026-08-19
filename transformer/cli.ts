#!/usr/bin/env node
import { program } from "commander";
import { readFile } from "./lib/fs/fslib.js";
import { transform } from "./transformer.js";
import path from "node:path";

program
    .name("markdown-to-media")
    .description("Create videos, audios, dialogues using Markdown");

program
    .command("render")
    .option("-f, --file <string>", "Markdown file path")
    .action(async (options) => {
        const filePath = path.resolve(options.file);

        const file = await readFile(filePath);

        if (file.isEmpty()) {
            console.error("Error: make sure the file exists");
            return;
        }

        console.log("Reading:", filePath);

        transform(file.get());
    });

program.parse();