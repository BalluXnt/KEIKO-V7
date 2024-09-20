import { readdirSync, existsSync, readFileSync, watch } from 'fs'
import { join, resolve } from 'path'
import { format } from 'util'
import syntaxerror from 'syntax-error'
import importFile from './import.js'
import Helper from './helper.js'

const __dirname = Helper.__dirname(import.meta)
const pluginFolder = Helper.__dirname(join(__dirname, '../Keiko/index'))
const pluginFilter = filename => /\.(mc)?js$/.test(filename)

// inspired from https://github.com/Nurutomo/mahbod/blob/main/src/util/PluginManager.ts

let watcher,
  Keiko,
  pluginFolders = []
watcher = Keiko = {}

async function filesInit(pluginFolder = pluginFolder, pluginFilter = pluginFilter, conn) {
  const folder = resolve(pluginFolder)
  if (folder in watcher) return
  pluginFolders.push(folder)

  await Promise.all(
    readdirSync(folder)
      .filter(pluginFilter)
      .map(async filename => {
        try {
          let file = global.__filename(join(folder, filename))
          const module = await import(file)
          if (module) Keiko[filename] = 'default' in module ? module.default : module
        } catch (e) {
          conn?.logger.error(e)
          delete Keiko[filename]
        }
      })
  )

  const watching = watch(folder, reload.bind(null, conn, folder, pluginFilter))
  watching.on('close', () => deletePluginFolder(folder, true))
  watcher[folder] = watching

  return Keiko
}

function deletePluginFolder(folder, isAlreadyClosed = false) {
  const resolved = resolve(folder)
  if (!(resolved in watcher)) return
  if (!isAlreadyClosed) watcher[resolved].close()
  delete watcher[resolved]
  pluginFolders.splice(pluginFolders.indexOf(resolved), 1)
}

async function reload(
  conn,
  pluginFolder = pluginFolder,
  pluginFilter = pluginFilter,
  _ev,
  filename
) {
  if (pluginFilter(filename)) {
    let dir = global.__filename(join(pluginFolder, filename), true)
    if (filename in Keiko) {
      if (existsSync(dir)) conn.logger.info(` updated plugin - '${filename}'`)
      else {
        conn?.logger.warn(`deleted plugin - '${filename}'`)
        return delete Keiko[filename]
      }
    } else conn?.logger.info(`new plugin - '${filename}'`)
    let err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    })
    if (err) conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`)
    else
      try {
        const module = await importFile(global.__filename(dir)).catch(console.error)
        if (module) Keiko[filename] = module
      } catch (e) {
        conn?.logger.error(`error require plugin '${filename}\n${format(e)}'`)
      } finally {
        Keiko = Object.fromEntries(Object.entries(Keiko).sort(([a], [b]) => a.localeCompare(b)))
      }
  }
}

export {
  pluginFolder,
  pluginFilter,
  Keiko,
  watcher,
  pluginFolders,
  filesInit,
  deletePluginFolder,
  reload,
}
