export interface ConvexFunction {
  name: string;
  type: "query" | "mutation" | "action";
  module: string;
  args: Record<string, string>; // argName -> ReScript type
  isInternal: boolean;
  hasReturn: boolean;
  returnType?: string;
}

export interface ConvexValidator {
  type: string;
  isOptional?: boolean;
  tableName?: string; // for v.id("tableName")
  innerType?: ConvexValidator; // for v.array(...), v.optional(...)
}

export interface FieldSchema {
  type: string;
  rescriptType: string;
  inner?: FieldSchema;
  tableName?: string;
  literals?: string[];
}

export interface TableSchema {
  fields: Record<string, FieldSchema>;
  indexes: string[];
}

export interface GeneratorOptions {
  verbose?: boolean;
  skipTypeChecking?: boolean;
  parseSchema?: boolean;
}

export interface GeneratorResult {
  functionsCount: number;
  modulesCount: number;
  generatedFiles: string[];
  warnings: string[];
}