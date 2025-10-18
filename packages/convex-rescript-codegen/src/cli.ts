#!/usr/bin/env bun

import { $ } from "bun";
import { parseArgs } from "node:util";
import { subscribe } from "@parcel/watcher";
import chalk from "chalk";
import { generateBindings } from "./generator";
import path from "path";
import { existsSync } from "fs";

// Get the project root (2 levels up from packages/convex-rescript-codegen/src)
const projectRoot = path.resolve(import.meta.dir, "../../..");

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    watch: { type: "boolean", short: "w", default: false },
    input: { type: "string", short: "i", default: "./convex" },
    output: { type: "string", short: "o", default: "./src/bindings/generated" },
    verbose: { type: "boolean", short: "v", default: false },
  },
});

const log = {
  info: (msg: string) => console.log(chalk.blue("ℹ"), msg),
  success: (msg: string) => console.log(chalk.green("✓"), msg),
  error: (msg: string) => console.error(chalk.red("✖"), msg),
  warn: (msg: string) => console.warn(chalk.yellow("⚠"), msg),
};

async function run() {
  console.log(chalk.bold.cyan("🚀 Convex ReScript Codegen"));
  
  const inputPath = path.resolve(projectRoot, values.input as string);
  const outputPath = path.resolve(projectRoot, values.output as string);
  
  // Validate input directory exists
  if (!existsSync(inputPath)) {
    log.error(`Input directory not found: ${inputPath}`);
    process.exit(1);
  }
  
  log.info(`Input: ${chalk.dim(inputPath)}`);
  log.info(`Output: ${chalk.dim(outputPath)}`);
  
  // Initial generation
  try {
    const startTime = performance.now();
    const result = await generateBindings(inputPath, outputPath, { 
      verbose: values.verbose 
    });
    const elapsed = (performance.now() - startTime).toFixed(2);
    
    log.success(`Generated ${chalk.bold(result.functionsCount)} bindings from ${chalk.bold(result.modulesCount)} modules in ${elapsed}ms`);
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => log.warn(warning));
    }
  } catch (error) {
    log.error(`Generation failed: ${error}`);
    if (!values.watch) process.exit(1);
  }
  
  // Watch mode with @parcel/watcher
  if (values.watch) {
    log.info(chalk.dim("Watching for changes..."));
    
    try {
      const subscription = await subscribe(inputPath, async (err, events) => {
        if (err) {
          log.error(`Watch error: ${err}`);
          return;
        }
        
        // Filter relevant events
        const relevantEvents = events.filter(event => {
          const filename = event.path.split('/').pop() || '';
          return (
            filename.endsWith(".ts") && 
            !filename.startsWith("_") &&
            !event.path.includes("_generated") &&
            (event.type === "create" || event.type === "update" || event.type === "delete")
          );
        });
        
        if (relevantEvents.length > 0) {
          console.log(); // Empty line for clarity
          log.info(`Files changed: ${relevantEvents.map(e => e.path.split('/').pop()).join(", ")}`);
          
          try {
            const startTime = performance.now();
            const result = await generateBindings(inputPath, outputPath, { 
              verbose: values.verbose 
            });
            const elapsed = (performance.now() - startTime).toFixed(2);
            
            log.success(`Regenerated in ${elapsed}ms`);
            
            if (result.warnings.length > 0) {
              result.warnings.forEach(warning => log.warn(warning));
            }
          } catch (error) {
            log.error(`Regeneration failed: ${error}`);
          }
        }
      });
      
      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        console.log();
        log.info("Shutting down watcher...");
        await subscription.unsubscribe();
        process.exit(0);
      });
      
    } catch (error) {
      log.error(`Failed to start watcher: ${error}`);
      process.exit(1);
    }
  }
}

// Run the CLI
run().catch((error) => {
  log.error(`Fatal error: ${error}`);
  process.exit(1);
});