#!/bin/sh

set -e

BASE_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
WRAPPER_PROPERTIES="$BASE_DIR/.mvn/wrapper/maven-wrapper.properties"
MAVEN_VERSION="3.9.9"
MAVEN_ROOT="${HOME}/.m2/wrapper/dists"
MAVEN_HOME="${MAVEN_ROOT}/apache-maven-${MAVEN_VERSION}"
MAVEN_ARCHIVE="${MAVEN_ROOT}/apache-maven-${MAVEN_VERSION}-bin.zip"

if [ ! -x "${MAVEN_HOME}/bin/mvn" ]; then
  DISTRIBUTION_URL=$(sed -n 's/^distributionUrl=//p' "$WRAPPER_PROPERTIES")
  mkdir -p "$MAVEN_ROOT"

  if [ ! -f "$MAVEN_ARCHIVE" ]; then
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL "$DISTRIBUTION_URL" -o "$MAVEN_ARCHIVE"
    elif command -v wget >/dev/null 2>&1; then
      wget -q "$DISTRIBUTION_URL" -O "$MAVEN_ARCHIVE"
    else
      echo "Could not download Maven: curl or wget is required." >&2
      exit 1
    fi
  fi

  if command -v unzip >/dev/null 2>&1; then
    unzip -q -o "$MAVEN_ARCHIVE" -d "$MAVEN_ROOT"
  else
    echo "Could not extract Maven: unzip is required." >&2
    exit 1
  fi
fi

exec "${MAVEN_HOME}/bin/mvn" "$@"
