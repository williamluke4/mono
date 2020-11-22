import { GithubDownloader } from './../../../lib/github/index';
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import downloadNpmPackage from 'download-npm-package'
import * as tydoc from 'tydoc'
import { NextApiRequest, NextApiResponse } from 'next'
import tempy from 'tempy'
import {fetchContent, findPackageJSON} from '../../../lib/github'

import * as path from 'path'
import { getPackageInfo } from 'lib/npm/getInfo'

import tsm from 'ts-morph'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const module = req.url.replace('/api/search/', '')
  const outputDir = `/tmp/${module}`
  const packageInfo = await getPackageInfo(module)
  const repo = packageInfo?.collected?.metadata?.links?.repository
  const data = await findPackageJSON('@prisma/client', repo)
  // TODO switch from oop to fp
  const github = new GithubDownloader({
    outputDir: outputDir,
    user: data.user, 
    repo: data.repo,
    ref: data.ref
  })
  await github.download()
  // Search and Download 
  // download({package: '@prisma/client', repository: })  
  const project = new tsm.Project({
    tsConfigFilePath: path.resolve(outputDir, './tsconfig.json'),
    compilerOptions: {
      skipLibCheck: true,
    },
    useInMemoryFileSystem: true,
  })
  const spec = tydoc.fromProject({
    project: project as any,
    prjDir: outputDir,
    // TODO This needs to be dynamic
    entrypoints: ['./src/index.ts'],
    readSettingsFromJSON: true,
  })
  res.statusCode = 200
  res.json(repo)
}
