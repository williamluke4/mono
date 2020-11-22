import { getPackageInfo } from 'lib/npm/getInfo';
import { NextApiRequest, NextApiResponse } from 'next';
import * as path from 'path';
import tsm from 'ts-morph';
import * as tydoc from 'tydoc';
import { findPackageJSON } from '../../../lib/github';
import { GithubDownloader } from './../../../lib/github/index';



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
  github.on('end', () => {
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
  })
  
}
