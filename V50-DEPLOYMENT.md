# v50 downstream maintenance

This fork tracks upstream main with two downstream commits: deployment integration and reference-image fixes. Keep them separate so an upstream fix can replace only the relevant patch. Never commit runtime configuration, credentials, uploads or database files.

Build the exact Git revision (a source build is required; the official image does not contain downstream patches):

```sh
export BUILD_COMMIT="$(git rev-parse HEAD)"
export BUILD_BRANCH=main
export BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
export LIBRECHAT_IMAGE="librechat-v50:${BUILD_COMMIT}"
docker compose build api
# After the existing off-host backup and configuration validation succeed:
docker compose up -d --no-deps --no-build api
```

Persist the selected image and BUILD_COMMIT in the deployment environment. Existing site overrides must select the same image, not the official release. OCI revision labels and Settings/About build metadata identify the running source. The source stage retains development dependencies for isolated tests; production builds and prunes them.

All persistent paths are bind mounts. Preserve site overrides, environment, ownership, registration restrictions and the original rollback image. Updating this fork does not authorize changing other services or runtime credentials.
