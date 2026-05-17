import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginClient } from '@kubb/plugin-client'

export default defineConfig({
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './lib/api',
    clean: true,
  },
  plugins: [
    pluginOas(),
    pluginTs({ output: { path: './types' } }),
    pluginZod({ output: { path: './zod' } }),
    pluginClient({ output: { path: './clients' } }),
    pluginReactQuery({ output: { path: './hooks' } }),
  ],
})
