// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import downloadNpmPackage from 'download-npm-package'
import * as tydoc from 'tydoc'
import { NextApiRequest, NextApiResponse } from 'next'
import tempy from 'tempy'
import {fetchContent, findPackageJSON} from '../../../lib/github'

import * as path from 'path'
import { getPackageInfo } from 'lib/npm/getInfo'



export default async (req: NextApiRequest, res: NextApiResponse) => {
  let dir;
  const module = req.url.replace('/api/search/', '')
  const packageInfo = await getPackageInfo(module)
  const repo = packageInfo?.collected?.metadata?.links?.repository
  const response = findPackageJSON('@prisma/client', repo)
  // Search and Download 
  // download({package: '@prisma/client', repository: })
  console.log(packageInfo);
  try {
    // Traverse Repo to find package.json with matching packageName then download
    // dir = await download('@prisma/client','https://github.com/prisma/prisma')
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
  res.json(repo)
}
