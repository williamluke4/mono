import { NpmSearchResponse } from './types';
import request from "request";

const BASE_URL = `https://api.npms.io/v2/package/`
export function getPackageInfo(pkg: string): Promise<NpmSearchResponse>{
  const url = BASE_URL + encodeURIComponent(pkg)
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
          resolve(response as NpmSearchResponse);
        }
        reject(new Error("Could not find data on response"));
      }
    );
  })
  
}
