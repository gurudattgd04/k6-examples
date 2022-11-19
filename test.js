import http from "k6/http";
import { sleep, check } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { Counter } from "k6/metrics";

let errors_metrics = new Counter("my_errors");

export const options = {
  stages: [
    { target: 1, duration: "1m" },
    { target: 2, duration: "2m" },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    http_req_duration: ["p(90)<200"], // 95% of requests should be below 200ms
  },
};
let accessToken;
const host = "norbrook.e-bate.net";
export function setup() {
  const payload = JSON.stringify({
    email: "support@e-bate.net",
    password: "phzU.cd9wJYLov3",
  });
  const params = {
    headers: {
      "Content-type": "application/json",
      accept: "application/json, text/plain, */*",
    },
  };

  const resp = http.post(
    `https://${host}/api/accountmanagement/login`,
    payload,
    params
  );

  console.log(JSON.parse(resp.body).data.accessToken);
  accessToken = `Bearer ${JSON.parse(resp.body).data.accessToken}`;
  return { accessToken };
}

export default function (accessToken) {
  console.log("access token", accessToken.accessToken);
  const params = {
    headers: {
      "Content-type": "application/json",
      accept: "application/json, text/plain, */*",
      authorization: `${accessToken.accessToken}`,
    },
  };
  const resp = http.get(
    `https://${host}/api/product/search/asc/Id/0/100/0?filter=`,
    params
  );
  let passed = check(resp, {
    "http2 is used": (r) => r.proto === "HTTP/2.0",
    "status is 200": (r) => r.status === 200,
    "content is present": (r) => r.body.indexOf("whatever") !== -1,
  });

  if (!passed) {
    console.log(
      `Request to ${resp.request.url} with status ${resp.status} failed the checks!`
    );
    errors_metrics.add(1, { url: resp.request.url });
  }
}

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
  };
}
