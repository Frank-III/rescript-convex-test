import { Project, SourceFile, Node, CallExpression, SyntaxKind, PropertyAssignment } from "ts-morph";
import type { TableSchema, FieldSchema } from "./types";

export async function parseConvexSchema(schemaPath: string): Promise<Map<string, TableSchema>> {
  const project = new Project({
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
    }
  });
  
  const schemaFile = project.addSourceFileAtPath(schemaPath);
  const tables = new Map<string, TableSchema>();
  
  // Find the defineSchema call - it's the default export
  const defaultExport = schemaFile.getExportAssignment(() => true);
  if (!defaultExport) {
    console.log("No default export found");
    return tables;
  }
  
  const exportExpression = defaultExport.getExpression();
  if (!Node.isCallExpression(exportExpression)) {
    console.log("Default export is not a call expression");
    return tables;
  }
  
  const callee = exportExpression.getExpression();
  if (!Node.isIdentifier(callee) || callee.getText() !== "defineSchema") {
    console.log("Default export is not defineSchema");
    return tables;
  }
  
  // Parse the schema object argument
  const schemaArg = exportExpression.getArguments()[0];
  if (!schemaArg || !Node.isObjectLiteralExpression(schemaArg)) {
    console.log("defineSchema argument is not an object");
    return tables;
  }
  
  // Parse each table property
  for (const prop of schemaArg.getProperties()) {
    if (!Node.isPropertyAssignment(prop)) continue;
    
    const tableName = prop.getName();
    const tableValue = prop.getInitializer();
    
    if (!tableValue) continue;
    
    // Handle chained calls (defineTable().index().index())
    let tableDefCall = tableValue;
    while (Node.isCallExpression(tableDefCall)) {
      const expr = tableDefCall.getExpression();
      if (Node.isPropertyAccessExpression(expr)) {
        // This is a chained call like .index()
        const baseExpr = expr.getExpression();
        if (Node.isCallExpression(baseExpr)) {
          tableDefCall = baseExpr;
        } else {
          break;
        }
      } else if (Node.isIdentifier(expr) && expr.getText() === "defineTable") {
        // Found the defineTable call
        const tableSchema = parseTableDefinition(tableDefCall);
        if (tableSchema) {
          tables.set(tableName, tableSchema);
        }
        break;
      } else {
        break;
      }
    }
  }
  
  return tables;
}

function parseTableDefinition(tableDefCall: CallExpression): TableSchema | null {
  const args = tableDefCall.getArguments();
  if (args.length === 0) return null;
  
  const fieldsArg = args[0];
  if (!Node.isObjectLiteralExpression(fieldsArg)) return null;
  
  const fields: Record<string, FieldSchema> = {};
  
  for (const prop of fieldsArg.getProperties()) {
    if (!Node.isPropertyAssignment(prop)) continue;
    
    const fieldName = prop.getName();
    const validator = prop.getInitializer();
    
    if (validator) {
      fields[fieldName] = parseFieldValidator(validator);
    }
  }
  
  return { fields, indexes: [] };
}

function parseFieldValidator(node: Node): FieldSchema {
  // Check if it's a call expression (v.string(), v.number(), etc.)
  if (!Node.isCallExpression(node)) {
    return { type: "unknown", rescriptType: "JSON.t" };
  }
  
  const expr = node.getExpression();
  
  // Handle v.xxx() pattern
  if (Node.isPropertyAccessExpression(expr)) {
    const obj = expr.getExpression();
    const method = expr.getName();
    
    if (Node.isIdentifier(obj) && obj.getText() === "v") {
      return parseValidatorMethod(method, node);
    }
  }
  
  return { type: "unknown", rescriptType: "JSON.t" };
}

function parseValidatorMethod(method: string, callNode: CallExpression): FieldSchema {
  const args = callNode.getArguments();
  
  switch (method) {
    case "string":
      return { type: "string", rescriptType: "string" };
    
    case "number":
      return { type: "number", rescriptType: "float" };
    
    case "boolean":
      return { type: "boolean", rescriptType: "bool" };
    
    case "null":
      return { type: "null", rescriptType: "unit" };
    
    case "int64":
      return { type: "int64", rescriptType: "int" };
    
    case "bytes":
      return { type: "bytes", rescriptType: "bytes" };
    
    case "any":
      return { type: "any", rescriptType: "JSON.t" };
    
    case "id":
      if (args.length > 0 && Node.isStringLiteral(args[0])) {
        const tableName = args[0].getLiteralValue();
        return { 
          type: "id", 
          tableName,
          rescriptType: `${tableName}Id` 
        };
      }
      return { type: "id", rescriptType: "string" };
    
    case "optional":
      if (args.length > 0) {
        const inner = parseFieldValidator(args[0]);
        return {
          type: "optional",
          inner,
          rescriptType: `option<${inner.rescriptType}>`,
        };
      }
      return { type: "optional", rescriptType: "option<JSON.t>" };
    
    case "array":
      if (args.length > 0) {
        const inner = parseFieldValidator(args[0]);
        return {
          type: "array",
          inner,
          rescriptType: `array<${inner.rescriptType}>`,
        };
      }
      return { type: "array", rescriptType: "array<JSON.t>" };
    
    case "union":
      // Check if all args are literals
      const literals: string[] = [];
      for (const arg of args) {
        if (Node.isCallExpression(arg)) {
          const expr = arg.getExpression();
          if (Node.isPropertyAccessExpression(expr) && expr.getName() === "literal") {
            const literalArg = arg.getArguments()[0];
            if (literalArg && Node.isStringLiteral(literalArg)) {
              literals.push(literalArg.getLiteralValue());
            }
          }
        }
      }
      
      if (literals.length > 0) {
        return {
          type: "union",
          literals,
          rescriptType: `[${literals.map(l => `| #${l}`).join(' ')}]`,
        };
      }
      return { type: "union", rescriptType: "string" };
    
    case "object":
      // TODO: Parse nested object structure
      return { type: "object", rescriptType: "JSON.t" };
    
    case "record":
      return { type: "record", rescriptType: "Dict.t<string, JSON.t>" };
    
    default:
      return { type: "unknown", rescriptType: "JSON.t" };
  }
}