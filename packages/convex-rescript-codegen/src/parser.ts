import { $ } from "bun";
import { Project, SyntaxKind, Node, CallExpression } from "ts-morph";
import type { ConvexFunction, ConvexValidator } from "./types";

export async function parseConvexFunctions(convexPath: string): Promise<ConvexFunction[]> {
  // Get all TypeScript files in convex directory (excluding _generated)
  const files = await $`find ${convexPath} -maxdepth 1 -name "*.ts" ! -name "_*" -type f`.text();
  const filePaths = files.trim().split('\n').filter(Boolean);
  
  if (filePaths.length === 0) {
    return [];
  }
  
  // Create a ts-morph project
  const project = new Project({
    tsConfigFilePath: `${convexPath}/tsconfig.json`,
    skipAddingFilesFromTsConfig: true,
  });
  
  // Add our convex files to the project
  for (const filePath of filePaths) {
    project.addSourceFileAtPath(filePath);
  }
  
  const functions: ConvexFunction[] = [];
  
  for (const sourceFile of project.getSourceFiles()) {
    const moduleName = sourceFile.getBaseName().replace('.ts', '');
    
    // Find all exported variable declarations
    const exports = sourceFile.getVariableDeclarations()
      .filter(decl => decl.isExported());
    
    for (const decl of exports) {
      const initializer = decl.getInitializer();
      if (!initializer || !Node.isCallExpression(initializer)) continue;
      
      const convexFn = parseConvexFunction(decl.getName(), initializer, moduleName);
      if (convexFn) {
        functions.push(convexFn);
      }
    }
  }
  
  return functions;
}

function parseConvexFunction(
  name: string, 
  callExpr: CallExpression, 
  moduleName: string
): ConvexFunction | null {
  const expression = callExpr.getExpression();
  if (!Node.isIdentifier(expression)) return null;
  
  const functionType = expression.getText();
  const convexTypes = ['query', 'mutation', 'action', 'internalQuery', 'internalMutation', 'internalAction'];
  
  if (!convexTypes.includes(functionType)) return null;
  
  // Parse the configuration object
  const args = callExpr.getArguments()[0];
  if (!args || !Node.isObjectLiteralExpression(args)) return null;
  
  const config = parseConfigObject(args);
  
  const isInternal = functionType.startsWith('internal');
  const baseType = functionType.replace(/^internal/, '').toLowerCase() as "query" | "mutation" | "action";
  
  // Try to infer return type from handler
  let inferredReturnType = config.returnType;
  if (!inferredReturnType && config.handler) {
    inferredReturnType = inferReturnType(config.handler, moduleName);
  }
  
  return {
    name,
    type: baseType,
    module: moduleName,
    args: config.args,
    isInternal,
    hasReturn: config.hasReturn,
    returnType: inferredReturnType,
  };
}

function parseConfigObject(objLiteral: Node): {
  args: Record<string, string>;
  hasReturn: boolean;
  returnType?: string;
  handler?: Node;
} {
  const result = {
    args: {} as Record<string, string>,
    hasReturn: false,
    returnType: undefined as string | undefined,
    handler: undefined as Node | undefined,
  };
  
  if (!Node.isObjectLiteralExpression(objLiteral)) return result;
  
  for (const prop of objLiteral.getProperties()) {
    if (!Node.isPropertyAssignment(prop)) continue;
    
    const propName = prop.getName();
    
    if (propName === 'args') {
      result.args = parseArgsObject(prop.getInitializer());
    } else if (propName === 'returns') {
      result.hasReturn = true;
      result.returnType = parseValidator(prop.getInitializer());
    } else if (propName === 'handler') {
      result.handler = prop.getInitializer();
    }
  }
  
  return result;
}

function parseArgsObject(node: Node | undefined): Record<string, string> {
  const args: Record<string, string> = {};
  
  if (!node || !Node.isObjectLiteralExpression(node)) return args;
  
  for (const prop of node.getProperties()) {
    if (!Node.isPropertyAssignment(prop)) continue;
    
    const argName = prop.getName();
    const validator = prop.getInitializer();
    
    if (validator) {
      args[argName] = parseValidator(validator);
    }
  }
  
  return args;
}

function parseValidator(node: Node | undefined): string {
  if (!node) return "JSON.t";
  
  const text = node.getText();
  
  // Handle v.string(), v.number(), etc.
  if (text.startsWith('v.')) {
    return parseValidatorCall(text);
  }
  
  // Default to JSON.t for complex types
  return "JSON.t";
}

function parseValidatorCall(text: string): string {
  // Remove 'v.' prefix
  const call = text.slice(2);
  
  // Simple validators
  if (call === 'string()') return 'string';
  if (call === 'number()') return 'float';
  if (call === 'boolean()') return 'bool';
  if (call === 'null()') return 'unit';
  if (call === 'int64()') return 'int';
  if (call === 'bytes()') return 'bytes';
  if (call === 'any()') return 'JSON.t';
  
  // ID validator: v.id("tableName")
  const idMatch = call.match(/^id\("(\w+)"\)$/);
  if (idMatch) {
    return `${idMatch[1]}Id`;
  }
  
  // Optional validator: v.optional(v.string())
  const optionalMatch = call.match(/^optional\((.*)\)$/);
  if (optionalMatch) {
    // The inner content already includes 'v.' prefix
    const innerValidator = parseValidatorCall(optionalMatch[1]);
    return `option<${innerValidator}>`;
  }
  
  // Array validator: v.array(v.string())
  const arrayMatch = call.match(/^array\((.*)\)$/);
  if (arrayMatch) {
    // The inner content already includes 'v.' prefix
    const innerValidator = parseValidatorCall(arrayMatch[1]);
    return `array<${innerValidator}>`;
  }
  
  // Union validator: v.union(v.literal("a"), v.literal("b"))
  if (call.startsWith('union(')) {
    // For now, treat unions as strings if they're string literals
    if (call.includes('literal')) {
      return 'string';
    }
    return 'JSON.t';
  }
  
  // Object validator
  if (call.startsWith('object(')) {
    return 'JSON.t'; // We'll improve this later
  }
  
  // Record validator
  if (call.startsWith('record(')) {
    return 'Dict.t<string, JSON.t>';
  }
  
  // Default fallback
  return 'JSON.t';
}

function inferReturnType(handlerNode: Node | undefined, moduleName: string): string | undefined {
  if (!handlerNode) return undefined;
  
  // Get the function body
  let body: Node | undefined;
  
  if (Node.isArrowFunction(handlerNode) || Node.isFunctionExpression(handlerNode)) {
    body = handlerNode.getBody();
  }
  
  if (!body) return undefined;
  
  // Look for return statements or db operations
  const text = body.getText();
  
  // Check for common patterns
  const tableName = moduleName.endsWith('s') ? moduleName : `${moduleName}s`;
  
  // Pattern: ctx.db.query("table").collect()
  if (text.includes('.collect()')) {
    return `array<${tableName}Doc>`;
  }
  
  // Pattern: ctx.db.get(id)
  if (text.includes('ctx.db.get(')) {
    return `option<${tableName}Doc>`;
  }
  
  // Pattern: ctx.db.insert("table", ...)
  if (text.includes('ctx.db.insert(')) {
    return `${tableName}Id`;
  }
  
  // Pattern: return null
  if (text.includes('return null')) {
    return 'unit';
  }
  
  return undefined;
}