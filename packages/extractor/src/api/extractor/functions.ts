import { readdirSync, statSync } from 'fs'
import { digraph } from 'graphviz'
import path, { join } from 'path'
import { Project, TypeGuards } from 'ts-morph'
const getDirectories = async (packagesPath: string) => {
  const packages = readdirSync(packagesPath).filter((any) =>
    statSync(join(packagesPath, any)).isDirectory(),
  )
  const result = packages.map((pkg) => ({
    dirName: pkg,
    path: path.resolve(packagesPath, pkg),
    jsonPath: path.resolve(packagesPath, pkg, './package.json'),
  }))
  return result
}
function getFunctionGraph(packagePath) {
  const g = digraph('G')
  const packageDirname = path.basename(packagePath)
  // g.set('splines', 'ortho')
  const project = new Project({
    tsConfigFilePath: path.join(packagePath, 'tsconfig.json'),
  })
  const sourceFiles = project.getSourceFiles()
  for (const sourceFile of sourceFiles) {
    const fileRelativePath = path.relative(
      packagePath,
      sourceFile.getFilePath(),
    )
    if (
      !fileRelativePath.includes('node_modules') &&
      !fileRelativePath.includes('__tests__')
    ) {
      const fileName = path.basename(fileRelativePath)
      const fileNode = g.addNode(fileName, { shape: 'box' })
      const referenced = sourceFile.getNodesReferencingOtherSourceFiles()
      referenced.map((ref) => {
        if (TypeGuards.isImportDeclaration(ref)) {
          const importSource = ref.getModuleSpecifierSourceFile()
          const importSourcePath = path.relative(
            packagePath,
            importSource.getFilePath(),
          )
          if (
            !importSource.getFilePath().includes('node_modules') &&
            !importSource.getFilePath().includes('__tests__')
          ) {
            let imports: string | string[] = null
            const referencedNode = g.addNode(importSourcePath, { shape: 'box' })
            g.addEdge(fileNode.id, referencedNode.id)
            const namedImports = ref.getNamedImports()
            imports = namedImports
              ? namedImports.map((ni) => ni.getText())
              : ref.getDefaultImport()?.getText()

            console.log(importSourcePath, imports)
            let importNode
            if (typeof imports === 'string') {
              importNode = g.addNode(imports)
              g.addEdge(referencedNode.id, importNode.id)
            } else {
              imports.map((imp) => {
                importNode = g.addNode(imp)
                g.addEdge(referencedNode.id, importNode.id)
              })
            }
          }
        }
      })
    }

    g.output('png', `./graphs/${packageDirname}.png`, (err, stdout, stderr) => {
      console.log(stderr)
    })
  }
}

const getKeys = (obj: any, name) => {
  if (obj && obj[name]) {
    return Object.keys(obj[name]).filter((name) => name.includes('prisma'))
  }
  return []
}
function generateGraph(
  packages: {
    dirName: string
    path: string
    jsonPath: string
  }[],
  type: 'dependencies' | 'devDependencies' | 'peerDependencies',
) {
  const g = digraph('G')
  g.set('splines', 'ortho')
  packages?.forEach((pkg) => {
    try {
      const json = require(pkg.jsonPath)
      g.addNode(json.name, { shape: 'box' })
      const keys = getKeys(json, type)
      const depNodes = keys.map((key) => {
        g.addEdge(json.name, key, {})
      })
    } catch {}
  })
  g.output('png', `./graphs/${type}.png`, (err, stdout, stderr) => {
    console.log(stderr)
  })
}
async function main() {
  const packages = await getDirectories('./packages')
  packages.map((pkg) => {
    getFunctionGraph(pkg.path)
  })
  // generateGraph(packages, 'dependencies')
  // generateGraph(packages, 'devDependencies')
  // generateGraph(packages, 'peerDependencies')
}
main()
