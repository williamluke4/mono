// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import downloadNpmPackage from 'download-npm-package'
import * as tydoc from 'tydoc'
import { NextApiRequest, NextApiResponse } from 'next'
import tempy from 'tempy'

async function download(module: string) {
  return new Promise((resolve, reject) =>
    downloadNpmPackage({
      arg: module, // for example, npm@2 or @mic/version@latest etc
      dir: '/tmp', // package will be downlodaded to ${dir}/packageName
    })
      .then(() => resolve(`/tmp/${module}`))
      .catch((err) => reject(err)),
  )
}
import * as tsm from 'ts-morph'
import * as path from 'path'
import * as fs from 'fs-extra'

const pkg = path.resolve(__dirname, './package/ink')


export default async (req: NextApiRequest, res: NextApiResponse) => {
  let dir;
  try {
    dir = await download('@prisma/client')
  } catch (err) {
    console.error(err)
    res.send(err.message)
  }
  // const project = new tsm.Project({
  //   tsConfigFilePath: path.resolve(dir, './tsconfig.json'),
  //   compilerOptions: {
  //     skipLibCheck: true,
  //   },
  //   useInMemoryFileSystem: true,
  // })
  console.log({dir});
  // const spec = tydoc.fromProject({
  //   project: project as any,
  //   prjDir: pkg,
  //   readSettingsFromJSON: true,
  // })
  res.statusCode = 200
  res.json({ name: 'John Doe' })
}
