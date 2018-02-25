// flow-typed signature: efb4ebc4464e1aa687650e0487e08e2d
// flow-typed version: <<STUB>>/fast-levenshtein_v^2.0.6/flow_v0.65.0

declare module "fast-levenshtein" {
  declare export type Options = {
    useCollator: boolean
  };

  declare module.exports: {
    get: (str1: string, str2: string, options?: Options) => number
  };
}
