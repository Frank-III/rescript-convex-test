#!/usr/bin/env bun

import { $ } from "bun";
import { parseArgs } from "node:util";
import { subscribe } from "@parcel/watcher";
import chalk from "chalk";
import { generateBindings } from "./generator";
import path from "path";
import { existsSync } from "fs";

// Parse command line arguments
const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    watch: { type: "boolean", short: "w", default: false },
    input: { type: "string", short: "i" },
    output: { type: "string", short: "o" },
    verbose: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
});

const log = {
  info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
  success: (msg: string) => console.log(chalk.green("✓"), msg),
  error: (msg: string) => console.error(chalk.red("✖"), msg),
  warn: (msg: string) => console.warn(chalk.yellow("⚠"), msg),
};

function showHelp() {
  console.log(`
${chalk.bold.cyan("convex-rescript-codegen")}

Generate type-safe ReScript bindings from Convex backend functions.

${chalk.bold("Usage:")}
  convex-rescript [options]

${chalk.bold("Options:")}
  -i, --input <path>    Input directory containing Convex functions (default: ./convex)
  -o, --output <path>   Output directory for generated bindings (default: ./src/bindings/generated)
  -w, --watch           Watch for changes and auto-regenerate
  -v, --verbose         Show verbose output
  -h, --help            Show this help message

${chalk.bold("Examples:")}
  # Generate bindings once (from current directory)
  convex-rescript

  # Watch mode
  convex-rescript --watch

  # Custom paths (relative to current directory)
  convex-rescript -i ./backend/convex -o ./frontend/src/bindings
  
  # Absolute paths also work
  convex-rescript -i /path/to/convex -o /path/to/output

${chalk.dim("For more information: https://github.com/yourusername/convex-rescript-codegen")}
`);
}

async function run() {
  if (values.help) {
    showHelp();
    process.exit(0);
  }

  console.log(chalk.bold.cyan("🚀 Convex ReScript Codegen"));
  
  // Get current working directory (where command is invoked)
  const cwd = await $`pwd`.text();
  const workingDir = cwd.trim();
  
  // Resolve paths relative to where command is invoked
  const inputArg = values.input || "./convex";
  const outputArg = values.output || "./src/bindings/generated";
  
  // If path is absolute, use it; otherwise resolve relative to cwd
  const inputPath = path.isAbsolute(inputArg) 
    ? inputArg 
    : path.resolve(workingDir, inputArg);
  
  const outputPath = path.isAbsolute(outputArg)
    ? outputArg
    : path.resolve(workingDir, outputArg);
  
  // Validate input directory exists
  try {
    // Check if directory exists and has TypeScript files
    const result = await $`test -d ${inputPath} && ls ${inputPath}/*.ts 2>/dev/null | head -1`.quiet().text();
    if (!result || result.trim() === "") {
      throw new Error("No TypeScript files found");
    }
  } catch (error) {
    log.error(`Input directory not found or contains no TypeScript files: ${inputPath}`);
    log.info(`Looking for: ${inputPath}`);
    log.info(`Current directory: ${workingDir}`);
    log.info(`\nMake sure you're running this from your project root, or specify the convex path with -i`);
    process.exit(1);
  }
  
  log.info(`Working directory: ${chalk.dim(workingDir)}`);
  log.info(`Input: ${chalk.dim(inputPath)}`);
  log.info(`Output: ${chalk.dim(outputPath)}`);
  
  // Create output directory if it doesn't exist
  await $`mkdir -p ${outputPath}`.quiet();
  
  // Initial generation
  try {
    const startTime = performance.now();
    const result = await generateBindings(inputPath, outputPath, { 
      verbose: values.verbose 
    });
    const elapsed = (performance.now() - startTime).toFixed(2);
    
    log.success(`Generated ${result.functionsCount} bindings from ${result.modulesCount} modules in ${elapsed}ms`);
    
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warn => log.warn(warn));
    }
  } catch (error) {
    log.error(`Generation failed: ${error}`);
    if (values.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
  
  // Watch mode
  if (values.watch) {
    log.info("Watching for changes...");
    
    const subscription = await subscribe(inputPath, async (err, events) => {
      if (err) {
        log.error(`Watch error: ${err}`);
        return;
      }
      
      const relevantEvents = events.filter(e => 
        e.path.endsWith('.ts') && 
        !e.path.includes('_generated') &&
        !e.path.includes('.d.ts')
      );
      
      if (relevantEvents.length > 0) {
        const changedFiles = relevantEvents.map(e => path.basename(e.path));
        log.info(`Files changed: ${chalk.dim(changedFiles.join(', '))}`);
        
        try {
          const startTime = performance.now();
          const result = await generateBindings(inputPath, outputPath, { 
            verbose: values.verbose 
          });
          const elapsed = (performance.now() - startTime).toFixed(2);
          
          log.success(`Regenerated ${result.functionsCount} bindings in ${elapsed}ms`);
        } catch (error) {
          log.error(`Regeneration failed: ${error}`);
        }
      }
    });
    
    // Handle Ctrl+C gracefully
    const handleExit = async () => {
      log.info("Stopping watch mode...");
      await subscription.unsubscribe();
      process.exit(0);
    };
    
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    
    // Keep the process alive
    await Bun.sleep(Number.MAX_SAFE_INTEGER);
  }
}

run().catch(error => {
  log.error(`Fatal error: ${error}`);
  process.exit(1);
});