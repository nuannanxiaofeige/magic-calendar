import { defineConfig } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'

export default defineConfig(async (merge, { command, mode }) => {
  const baseConfig = {
    projectName: 'chronos-eye',
    date: '2024-3-17',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    defineConstants: {
      ENABLE_INNER_HTML: JSON.stringify(true),
      ENABLE_ADJACENT_HTML: JSON.stringify(true),
      ENABLE_CLONE_NODE: JSON.stringify(true),
      ENABLE_INCLUDE_NODE: JSON.stringify(true),
      ENABLE_IS_CONSTRUCTOR: JSON.stringify(true),
      ENABLE_CONTAINS: JSON.stringify(true),
      ENABLE_NAMED_NODE_MAP: JSON.stringify(true),
      ENABLE_ELEMENT_CLOSE: JSON.stringify(true),
      ENABLE_CHILD_NODES: JSON.stringify(true),
      ENABLE_DATASET: JSON.stringify(true),
      ENABLE_SIZE_APIS: JSON.stringify(true),
      ENABLE_TEMPLATE_CONTENT: JSON.stringify(true),
      ENABLE_MUTATION_OBSERVER: JSON.stringify(true),
      ENABLE_SVG: JSON.stringify(true),
      ENABLE_DOM_LIST: JSON.stringify(true)
    },
    copy: {
      patterns: [
      ],
      options: {
      }
    },
    framework: 'react',
    compiler: 'webpack5',
    cache: {
      enable: false
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {
          }
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: {
        filename: 'js/[name].[hash:8].js',
        chunkFilename: 'js/[name].[chunkhash:8].js'
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})
