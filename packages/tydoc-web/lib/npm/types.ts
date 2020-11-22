export interface NpmSearchResponse {
  analyzedAt: string;
  collected: Collected;
  evaluation: Evaluation;
  score: Score;
}

interface Score {
  final: number;
  detail: Detail;
}

interface Detail {
  quality: number;
  popularity: number;
  maintenance: number;
}

interface Evaluation {
  quality: Quality;
  popularity: Popularity;
  maintenance: Maintenance;
}

interface Maintenance {
  releasesFrequency: number;
  commitsFrequency: number;
  openIssues: number;
  issuesDistribution: number;
}

interface Popularity {
  communityInterest: number;
  downloadsCount: number;
  downloadsAcceleration: number;
  dependentsCount: number;
}

interface Quality {
  carefulness: number;
  tests: number;
  health: number;
  branding: number;
}

interface Collected {
  metadata: Metadata;
  npm: Npm;
  github: Github;
  source: Source;
}

interface Source {
  files: Files;
  linters: string[];
  coverage: number;
}

interface Files {
  readmeSize: number;
  testsSize: number;
  hasNpmIgnore: boolean;
}

interface Github {
  homepage: string;
  starsCount: number;
  forksCount: number;
  subscribersCount: number;
  issues: Issues;
  contributors: Contributor[];
  commits: Release[];
  statuses: Status[];
}

interface Status {
  context: string;
  state: string;
}

interface Contributor {
  username: string;
  commitsCount: number;
}

interface Issues {
  count: number;
  openCount: number;
  distribution: Distribution;
  isDisabled: boolean;
}

type Distribution = Record<string, number>


interface Npm {
  downloads: Release[];
  dependentsCount: number;
  starsCount: number;
}

interface Metadata {
  name: string;
  scope: string;
  version: string;
  description: string;
  keywords: string[];
  date: string;
  publisher: Publisher;
  maintainers: Publisher[];
  repository: Repository;
  links: Links;
  license: string;
  dependencies: Dependencies;
  devDependencies: DevDependencies;
  peerDependencies: PeerDependencies;
  releases: Release[];
  hasTestScript: boolean;
  hasSelectiveFiles: boolean;
}

interface Release {
  from: string;
  to: string;
  count: number;
}

type PeerDependencies = Record<string, string>

type DevDependencies  = Record<string, string>

type Dependencies = Record<string, string>

interface Links {
  npm: string;
  homepage: string;
  repository: string;
  bugs: string;
}

interface Repository {
  url: string;
}

interface Publisher {
  username: string;
  email: string;
}