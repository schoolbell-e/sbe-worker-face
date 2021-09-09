import { EnvsMain, EnvsAspect } from '@teambit/envs'
import { NodeAspect, NodeMain } from '@teambit/node'

const newDependencies = {
  "devDependencies": {
  }
}

export class CustomNodeExtension {
  constructor(private node: NodeMain) {}

  static dependencies: any = [EnvsAspect, NodeAspect]

  static async provider([envs, node]: [EnvsMain, NodeMain]) {
    const CustomNodeEnv = node.compose([
      /*
        Use any of the "node.override..." transformers to
      */
      node.overrideDependencies(newDependencies),     
      node.overrideTsConfig(require('./typescript/tsconfig.json')),
      node.overrideBuildTsConfig(require('./typescript/tsconfig.build.json')),
      node.overrideJestConfig(require.resolve('./jest/jest.config')),
    ])

    envs.registerEnv(CustomNodeEnv)

    return new CustomNodeExtension(node)
  }
}