 docker-compose up --build
time="2026-04-17T16:40:13+05:30" level=warning msg="D:\\New folder\\stridergate\\docker-compose.yaml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
[+] up 11/11
 ✔ Image mongo:latest Pulled                                                                                       72.7s
#1 [internal] load local bake definitions
#1 reading from stdin 1.44kB done
#1 DONE 0.0s

#2 [ml-service internal] load build definition from Dockerfile
#2 transferring dockerfile:
#2 transferring dockerfile: 291B 0.1s done
#2 DONE 0.2s

#3 [client internal] load build definition from Dockerfile
#3 transferring dockerfile: 158B 0.0s done
#3 DONE 0.2s

#4 [server internal] load build definition from Dockerfile
#4 transferring dockerfile: 153B 0.0s done
#4 DONE 0.3s

#5 [server internal] load metadata for docker.io/library/node:20-alpine
#5 ...

#6 [auth] library/python:pull token for registry-1.docker.io
#6 DONE 0.0s

#7 [auth] library/node:pull token for registry-1.docker.io
#7 DONE 0.0s

#8 [ml-service internal] load metadata for docker.io/library/python:3.10-slim
#8 DONE 4.0s

#5 [server internal] load metadata for docker.io/library/node:20-alpine
#5 DONE 4.0s

#9 [client internal] load .dockerignore
#9 transferring context:
#9 transferring context: 2B done
#9 DONE 0.2s

#10 [server internal] load .dockerignore
#10 transferring context: 2B done
#10 DONE 0.2s

#11 [ml-service internal] load .dockerignore
#11 transferring context: 2B 0.0s done
#11 DONE 0.2s

#12 [server 1/5] FROM docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
#12 resolve docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293    
#12 resolve docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 0.3s done
#12 ...

#13 [ml-service internal] load build context
#13 transferring context: 2.55MB 0.8s done
#13 DONE 1.1s

#12 [server 1/5] FROM docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
#12 sha256:fff4e2c1b189bf87d63ad8bd07f7f4eb288d6f2b6a07a8bb44c60e8c075d2096 0B / 445B 0.2s
#12 sha256:b2cbbfe903b0821005780971ddc5892edcc4ce74c5a48d82e1d2b382edac3122 0B / 1.26MB 0.2s
#12 sha256:6a0ac1617861a677b045b7ff88545213ec31c0ff08763195a70a4a5adda577bb 0B / 3.86MB 0.2s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 0B / 43.23MB 0.2s
#12 sha256:fff4e2c1b189bf87d63ad8bd07f7f4eb288d6f2b6a07a8bb44c60e8c075d2096 445B / 445B 0.7s done
#12 sha256:b2cbbfe903b0821005780971ddc5892edcc4ce74c5a48d82e1d2b382edac3122 1.26MB / 1.26MB 1.4s
#12 sha256:b2cbbfe903b0821005780971ddc5892edcc4ce74c5a48d82e1d2b382edac3122 1.26MB / 1.26MB 1.4s done
#12 sha256:6a0ac1617861a677b045b7ff88545213ec31c0ff08763195a70a4a5adda577bb 1.05MB / 3.86MB 1.5s
#12 sha256:6a0ac1617861a677b045b7ff88545213ec31c0ff08763195a70a4a5adda577bb 2.10MB / 3.86MB 1.7s
#12 sha256:6a0ac1617861a677b045b7ff88545213ec31c0ff08763195a70a4a5adda577bb 3.15MB / 3.86MB 2.0s
#12 sha256:6a0ac1617861a677b045b7ff88545213ec31c0ff08763195a70a4a5adda577bb 3.86MB / 3.86MB 2.1s
#12 sha256:6a0ac1617861a677b045b7ff88545213ec31c0ff08763195a70a4a5adda577bb 3.86MB / 3.86MB 2.3s done
#12 extracting sha256:6a0ac1617861a677b045b7ff88545213ec31c0ff08763195a70a4a5adda577bb
#12 extracting sha256:6a0ac1617861a677b045b7ff88545213ec31c0ff08763195a70a4a5adda577bb 0.8s done
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 3.15MB / 43.23MB 3.3s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 6.29MB / 43.23MB 6.2s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 9.44MB / 43.23MB 7.7s
#12 ...

#14 [ml-service 1/5] FROM docker.io/library/python:3.10-slim@sha256:26fc00cf5fd6f57ded62e50e27cd3fec9843a3d0f31243c04debb3aba952d9c6
#14 resolve docker.io/library/python:3.10-slim@sha256:26fc00cf5fd6f57ded62e50e27cd3fec9843a3d0f31243c04debb3aba952d9c6 0.3s done
#14 sha256:ddf3b231f5678d6154e60baa71a2e9a1f947d326b31945f7675c36c64fb7c328 249B / 249B 0.8s done
#14 sha256:bed04db721b4ee2f43a7fc743a2fd7ec6181f9444d36d4960988e5fb99a1217b 12.58MB / 13.82MB 7.2s
#14 sha256:935d60c8480a502328adefa7698ca61261c8dc0872361135cd176ac488135649 1.29MB / 1.29MB 6.5s
#14 sha256:5435b2dcdf5cb7faa0d5b1d4d54be2c72a776fab9a605336f5067d6e9ecb5976 6.29MB / 29.78MB 6.3s
#14 ...

#15 [server internal] load build context
#15 transferring context: 5.36MB 9.7s
#15 ...

#16 [client internal] load build context
#16 ...

#12 [client 1/5] FROM docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 12.58MB / 43.23MB 9.6s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 15.73MB / 43.23MB 10.5s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 18.87MB / 43.23MB 11.2s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 22.02MB / 43.23MB 12.4s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 25.17MB / 43.23MB 13.0s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 28.31MB / 43.23MB 13.9s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 33.55MB / 43.23MB 15.6s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 36.70MB / 43.23MB 16.6s
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 39.85MB / 43.23MB 17.4s
#12 ...

#14 [ml-service 1/5] FROM docker.io/library/python:3.10-slim@sha256:26fc00cf5fd6f57ded62e50e27cd3fec9843a3d0f31243c04debb3aba952d9c6
#14 sha256:bed04db721b4ee2f43a7fc743a2fd7ec6181f9444d36d4960988e5fb99a1217b 13.82MB / 13.82MB 16.5s
#14 sha256:935d60c8480a502328adefa7698ca61261c8dc0872361135cd176ac488135649 1.29MB / 1.29MB 11.0s done
#14 sha256:5435b2dcdf5cb7faa0d5b1d4d54be2c72a776fab9a605336f5067d6e9ecb5976 26.21MB / 29.78MB 15.6s
#14 sha256:5435b2dcdf5cb7faa0d5b1d4d54be2c72a776fab9a605336f5067d6e9ecb5976 28.31MB / 29.78MB 16.8s
#14 ...

#15 [server internal] load build context
#15 transferring context: 6.25MB 20.3s
#15 ...

#16 [client internal] load build context
#16 ...

#14 [ml-service 1/5] FROM docker.io/library/python:3.10-slim@sha256:26fc00cf5fd6f57ded62e50e27cd3fec9843a3d0f31243c04debb3aba952d9c6
#14 sha256:bed04db721b4ee2f43a7fc743a2fd7ec6181f9444d36d4960988e5fb99a1217b 13.82MB / 13.82MB 21.6s
#14 ...

#12 [client 1/5] FROM docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 43.23MB / 43.23MB 24.0s
#12 ...

#15 [server internal] load build context
#15 ...

#16 [client internal] load build context
#16 transferring context: 6.70MB 25.4s
#16 ...

#15 [server internal] load build context
#15 transferring context: 6.27MB 36.9s
#15 ...

#14 [ml-service 1/5] FROM docker.io/library/python:3.10-slim@sha256:26fc00cf5fd6f57ded62e50e27cd3fec9843a3d0f31243c04debb3aba952d9c6
#14 sha256:bed04db721b4ee2f43a7fc743a2fd7ec6181f9444d36d4960988e5fb99a1217b 13.82MB / 13.82MB 34.6s done
#14 sha256:5435b2dcdf5cb7faa0d5b1d4d54be2c72a776fab9a605336f5067d6e9ecb5976 29.78MB / 29.78MB 33.6s done
#14 DONE 37.3s

#15 [server internal] load build context
#15 transferring context: 7.88MB 41.9s
#15 ...

#12 [client 1/5] FROM docker.io/library/node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
#12 sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 43.23MB / 43.23MB 35.8s done
#12 extracting sha256:4feea04c154301db6f4a496efa397b3db96603b1c009c797cfdde77bea8b3287 5.3s done
#12 extracting sha256:b2cbbfe903b0821005780971ddc5892edcc4ce74c5a48d82e1d2b382edac3122 0.3s done
#12 extracting sha256:fff4e2c1b189bf87d63ad8bd07f7f4eb288d6f2b6a07a8bb44c60e8c075d2096 0.1s done
#12 DONE 42.9s

#15 [server internal] load build context
#15 ...

#17 [client 2/5] WORKDIR /app
#17 DONE 1.8s

#16 [client internal] load build context
#16 ...

#14 [ml-service 1/5] FROM docker.io/library/python:3.10-slim@sha256:26fc00cf5fd6f57ded62e50e27cd3fec9843a3d0f31243c04debb3aba952d9c6
#14 extracting sha256:5435b2dcdf5cb7faa0d5b1d4d54be2c72a776fab9a605336f5067d6e9ecb5976 4.1s done
#14 extracting sha256:935d60c8480a502328adefa7698ca61261c8dc0872361135cd176ac488135649 0.7s done
#14 extracting sha256:bed04db721b4ee2f43a7fc743a2fd7ec6181f9444d36d4960988e5fb99a1217b 3.2s done
#14 extracting sha256:ddf3b231f5678d6154e60baa71a2e9a1f947d326b31945f7675c36c64fb7c328 0.1s done
#14 DONE 45.4s

#16 [client internal] load build context
#16 ...

#18 [ml-service 2/5] WORKDIR /app
#18 DONE 0.3s

#16 [client internal] load build context
#16 ...

#19 [ml-service 3/5] COPY requirements.txt ./
#19 DONE 0.2s

#16 [client internal] load build context
#16 transferring context: 29.44MB 47.0s
#16 transferring context: 31.28MB 52.0s
#16 ...

#15 [server internal] load build context
#15 ...

#16 [client internal] load build context
#16 ...

#20 [ml-service 4/5] RUN pip install --no-cache-dir -r requirements.txt
#20 7.549 Collecting fastapi==0.110.0
#20 7.769   Downloading fastapi-0.110.0-py3-none-any.whl (92 kB)
#20 7.814      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 92.1/92.1 kB 2.7 MB/s eta 0:00:00
#20 8.092 Collecting uvicorn==0.29.0
#20 8.117   Downloading uvicorn-0.29.0-py3-none-any.whl (60 kB)
#20 8.139      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60.8/60.8 kB 3.6 MB/s eta 0:00:00
#20 8.517 Collecting xgboost==2.0.3
#20 8.575   Downloading xgboost-2.0.3-py3-none-manylinux2014_x86_64.whl (297.1 MB)
#20 ...

#16 [client internal] load build context
#16 transferring context: 37.37MB 57.1s
#16 ...

#15 [server internal] load build context
#15 transferring context: 26.37MB 59.8s done
#15 DONE 60.0s

#16 [client internal] load build context
#16 ...

#21 [server 3/5] COPY package*.json ./
#21 DONE 0.5s

#16 [client internal] load build context
#16 transferring context: 47.28MB 61.4s done
#16 DONE 61.5s

#22 [client 3/5] COPY package*.json ./
#22 DONE 0.1s

#23 [server 4/5] RUN npm install
#23 6.162 npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
#23 ...

#24 [client 4/5] RUN npm install
#24 6.230 npm warn ERESOLVE overriding peer dependency
#24 6.231 npm warn While resolving: @react-leaflet/core@3.0.0
#24 6.231 npm warn Found: react@18.3.1
#24 6.231 npm warn node_modules/react
#24 6.231 npm warn   react@"^18.3.1" from the root project
#24 6.231 npm warn   1 more (react-dom)
#24 6.231 npm warn
#24 6.231 npm warn Could not resolve dependency:
#24 6.231 npm warn peer react@"^19.0.0" from @react-leaflet/core@3.0.0
#24 6.231 npm warn node_modules/@react-leaflet/core
#24 6.231 npm warn   @react-leaflet/core@"^3.0.0" from react-leaflet@5.0.0
#24 6.231 npm warn   node_modules/react-leaflet
#24 6.231 npm warn
#24 6.231 npm warn Conflicting peer dependency: react@19.2.5
#24 6.231 npm warn node_modules/react
#24 6.231 npm warn   peer react@"^19.0.0" from @react-leaflet/core@3.0.0
#24 6.231 npm warn   node_modules/@react-leaflet/core
#24 6.231 npm warn     @react-leaflet/core@"^3.0.0" from react-leaflet@5.0.0
#24 6.231 npm warn     node_modules/react-leaflet
#24 6.238 npm warn ERESOLVE overriding peer dependency
#24 6.238 npm warn While resolving: @react-leaflet/core@3.0.0
#24 6.238 npm warn Found: react-dom@18.3.1
#24 6.238 npm warn node_modules/react-dom
#24 6.238 npm warn   react-dom@"^18.3.1" from the root project
#24 6.238 npm warn
#24 6.238 npm warn Could not resolve dependency:
#24 6.238 npm warn peer react-dom@"^19.0.0" from @react-leaflet/core@3.0.0
#24 6.238 npm warn node_modules/@react-leaflet/core
#24 6.238 npm warn   @react-leaflet/core@"^3.0.0" from react-leaflet@5.0.0
#24 6.238 npm warn   node_modules/react-leaflet
#24 6.238 npm warn
#24 6.238 npm warn Conflicting peer dependency: react-dom@19.2.5
#24 6.238 npm warn node_modules/react-dom
#24 6.238 npm warn   peer react-dom@"^19.0.0" from @react-leaflet/core@3.0.0
#24 6.238 npm warn   node_modules/@react-leaflet/core
#24 6.238 npm warn     @react-leaflet/core@"^3.0.0" from react-leaflet@5.0.0
#24 6.238 npm warn     node_modules/react-leaflet
#24 6.292 npm error code ERESOLVE
#24 6.292 npm error ERESOLVE could not resolve
#24 6.293 npm error
#24 6.293 npm error While resolving: react-leaflet@5.0.0
#24 6.293 npm error Found: react@18.3.1
#24 6.293 npm error node_modules/react
#24 6.293 npm error   react@"^18.3.1" from the root project
#24 6.293 npm error   peer react@"^18.3.1" from react-dom@18.3.1
#24 6.293 npm error   node_modules/react-dom
#24 6.293 npm error     react-dom@"^18.3.1" from the root project
#24 6.293 npm error
#24 6.293 npm error Could not resolve dependency:
#24 6.293 npm error peer react@"^19.0.0" from react-leaflet@5.0.0
#24 6.293 npm error node_modules/react-leaflet
#24 6.293 npm error   react-leaflet@"^5.0.0" from the root project
#24 6.293 npm error
#24 6.293 npm error Conflicting peer dependency: react@19.2.5
#24 6.293 npm error node_modules/react
#24 6.293 npm error   peer react@"^19.0.0" from react-leaflet@5.0.0
#24 6.293 npm error   node_modules/react-leaflet
#24 6.293 npm error     react-leaflet@"^5.0.0" from the root project
#24 6.293 npm error
#24 6.293 npm error Fix the upstream dependency conflict, or retry
#24 6.293 npm error this command with --force or --legacy-peer-deps
#24 6.293 npm error to accept an incorrect (and potentially broken) dependency resolution.
#24 6.294 npm error
#24 6.294 npm error
#24 6.294 npm error For a full report see:
#24 6.294 npm error /root/.npm/_logs/2026-04-17T11_12_36_252Z-eresolve-report.txt
#24 6.298 npm notice
#24 6.298 npm notice New major version of npm available! 10.8.2 -> 11.12.1
#24 6.298 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1
#24 6.298 npm notice To update run: npm install -g npm@11.12.1
#24 6.298 npm notice
#24 6.299 npm error A complete log of this run can be found in: /root/.npm/_logs/2026-04-17T11_12_36_252Z-debug-0.log   
#24 ERROR: process "/bin/sh -c npm install" did not complete successfully: exit code: 1

#23 [server 4/5] RUN npm install
#23 8.024 
#23 8.024 added 122 packages, and audited 123 packages in 7s
#23 8.024
#23 8.024 24 packages are looking for funding
#23 8.024   run `npm fund` for details
#23 8.040 
#23 8.040 3 vulnerabilities (2 moderate, 1 high)
#23 8.040
#23 8.040 To address all issues, run:
#23 8.040   npm audit fix
#23 8.040
#23 8.040 Run `npm audit` for details.
#23 8.052 npm notice
#23 8.052 npm notice New major version of npm available! 10.8.2 -> 11.12.1
#23 8.052 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1
#23 8.052 npm notice To update run: npm install -g npm@11.12.1
#23 8.052 npm notice
#23 ...

#20 [ml-service 4/5] RUN pip install --no-cache-dir -r requirements.txt
#20 CANCELED

#23 [server 4/5] RUN npm install
#23 DONE 8.3s
------
 > [client 4/5] RUN npm install:
6.294 npm error
6.294 npm error
6.294 npm error For a full report see:
6.294 npm error /root/.npm/_logs/2026-04-17T11_12_36_252Z-eresolve-report.txt
6.298 npm notice
6.298 npm notice New major version of npm available! 10.8.2 -> 11.12.1
6.298 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.12.1
6.298 npm notice To update run: npm install -g npm@11.12.1
6.298 npm notice
[+] up 11/14ror A complete log of this run can be found in: /root/.npm/_logs/2026-04-17T11_12_36_252Z-debug-0.log       
 ✔ Image mongo:latest           Pulled                                                                             72.7s
 - Image stridergate-server     Building                                                                           75.9s
 - Image stridergate-ml-service Building                                                                           75.9s
 - Image stridergate-client     Building                                                                           75.9s
Dockerfile:5

--------------------

   3 |     WORKDIR /app

   4 |     COPY package*.json ./

   5 | >>> RUN npm install

   6 |     COPY . .

   7 |

--------------------

target client: failed to solve: process "/bin/sh -c npm install" did not complete successfully: exit code: 1



View build details: docker-desktop://dashboard/build/default/default/plgdvqgu8xnoos7ctsd8vjf65ss