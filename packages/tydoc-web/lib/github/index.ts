import { EventEmitter } from "events";
import fs from "fs-extra";
import path from "path";
import request from "request";
import { GithubSearchResponse, Item, ReposGetContentResponseData } from "./types";
import * as packageJson from "package-json-types";

interface GithubDownloadParams {
  user: string;
  repo: string;
  path?: string;
  ref: string;
  outputDir: string;
}
async function req<T>(url: string): Promise<T>{
  return new Promise((resolve, reject) => {
    request(
      { url: url, headers: { "User-Agent": "fast/0.0.1" } },
      (err, resp, body) => {
        if (err) return reject(err);
        if (resp.statusCode !== 200) {
          reject(
            new Error(
              url +
                ": returned " +
                resp.statusCode +
                "\nMessage: " +
                JSON.parse(body)["message"] +
                "\n"
            )
          );
        }
        const response = JSON.parse(body);
        if (response) {
          resolve(response as T);
        }
        reject(new Error("Could not find data on response"));
      }
    );
  });
}
export async function findPackageJSON(module: string, repoUrl: string){
  const [_, details] = repoUrl.split('github.com/')
  const [user, repo] = details.split('/')
  
  // TODO Find a way to get the default branch or use tags
  const ref = 'master'
  const query = encodeURIComponent(`"name": ${module}`)

  const url = `https://api.github.com/search/code?q=${query}+repo:${user}/${repo}+filename:package.json`
  const data = await req<GithubSearchResponse>(url)
  const found = await data.items.reduce( async (acc, item) => {
    const url = rawBuilder(user, repo, ref) + item.path
    const pkg = await req<packageJson.Body>(url)
    if(pkg?.name === module){
      return {pkg, item}
    }
    if(acc) return acc
    return null
  }, null as Promise<{pkg: packageJson.Body, item: Item} | undefined> )
  return {found, user, repo, ref} 
}
export function fetchContent(
  params: Pick<GithubDownloadParams, "user" | "repo" | "path" | "ref">
): Promise<ReposGetContentResponseData[]> {
  const url = `https://api.github.com/repos/${params.user}/${params.repo}/contents/${params.path}?ref=${params.ref}`;
  return new Promise((resolve, reject) => {
    request(
      { url: url, headers: { "User-Agent": "fast/0.0.1" } },
      (err, resp, body) => {
        if (err) return reject(err);
        if (resp.statusCode !== 200) {
          reject(
            new Error(
              url +
                ": returned " +
                resp.statusCode +
                "\nMessage: " +
                JSON.parse(body)["message"] +
                "\n"
            )
          );
        }
        const response = JSON.parse(body);
        if (response) {
          resolve(response as ReposGetContentResponseData[]);
        }
        reject(new Error("Could not find data on response"));
      }
    );
  });
}
function rawBuilder(user: string, repo: string, ref: string): string {
  return `https://raw.githubusercontent.com/${user}/${repo}/${ref}/`;
}
export class GithubDownloader extends EventEmitter {
  user: string;
  repo: string;
  ref: string;
  _fileTracker: any[];
  _getZip: boolean;
  pending: number;
  gonnaProcess: number;
  initialUrl: string;
  initialUrlRef: string;
  rawUrl: string;
  path: string;
  outputDir: string;

  constructor(params: GithubDownloadParams) {
    super();
    this.user = params.user;
    this.repo = params.repo;
    this.ref = params.ref;
    this.outputDir = params.outputDir;
    this._fileTracker = [];
    this.path = params.path || "";
    this._getZip = false;
    this.pending = 0;
    this.gonnaProcess = 0;
    this.initialUrl = `https://api.github.com/repos/${this.user}/${this.repo}/contents/`;
    this.initialUrlRef = this.ref ? `?ref=${this.ref}` : "";
    this.rawUrl = rawBuilder(this.user, this.repo, this.ref);
  }

  processItems(items: ReposGetContentResponseData[]) {
    this.pending += items.length;
    this.gonnaProcess -= 1;
    items?.forEach((item) => this.handleItem(item));
    this.checkDone();
  }
  urlBuilder(customPath?: string) {
    const url = `${this.initialUrl}${customPath ?? this.path}${
      this.initialUrlRef
    }`;
    // console.log(url);
    return url;
  }
  checkDone() {
    // console.log('PENDING: ' + pending + ' gonnaProcess: ' + gonnaProcess)
    if (this.pending === 0 && this.gonnaProcess === 0 && !this._getZip) {
      this.emit("end");
    }
  }
  download() {
    this.gonnaProcess += 1;
    this.requestJSON();
    return new Promise((resolve, reject) => {
      this.on('end', () => {
        resolve();
      })
      this.on('error', (err) => {
        console.error(err);
        reject(err)
      })
    })
  }
  handleItem(item: ReposGetContentResponseData) {
    // console.log({outputDir: this.outputDir});
    const cleaned = item.path.replace(this.path.substring(1), ``);
    const destinationPath = path.join(this.outputDir, cleaned);
    if (item.type === "dir") {
      fs.mkdirs(destinationPath, (err) => {
        if (err) this.emit("error", err);
        this._fileTracker.push(destinationPath);
        this.gonnaProcess += 1;
        this.requestJSON(item.path);
        this.emit("dir", item.path);
        this.pending -= 1;
        this.checkDone();
      });
    } else if (item.type === "file") {
      fs.createFile(destinationPath, (err) => {
        if (err) this.emit("error", err);
        request
          .get(this.rawUrl + item.path)
          .pipe(fs.createWriteStream(destinationPath))
          .on("close", () => {
            this._fileTracker.push(destinationPath);
            this.emit("file", item.path);
            this.pending -= 1;
            this.checkDone();
          });
      });
    } else {
      this.emit(
        "Error",
        new Error(JSON.stringify(item, null, 2) + "\n does not have type.")
      );
    }
  }

  requestJSON(customPath?: string) {
    const url = this.urlBuilder(customPath);
    // console.log(url);
    request(
      { url: url, headers: { "User-Agent": "fast/0.0.1" } },
      (err, resp, body) => {
        if (err) return this.emit("error", err);
        if (resp.statusCode !== 200)
          this.emit(
            "error",
            new Error(
              url + ": returned " + resp.statusCode + "\n\nbody:\n" + body
            )
          );

        this.processItems(JSON.parse(body));
      }
    );
  }
}

export function download(params: GithubDownloadParams) {
  const gh = new GithubDownloader(params);
  return gh.download();
}

// PRIVATE METHODS

function generateTempDir() {
  return process.cwd();
}
