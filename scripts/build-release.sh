#!/bin/sh

set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_root"

runtime_files="manifest.json content.js content.css"

for file in $runtime_files; do
  if [ ! -f "$file" ]; then
    printf 'Missing required extension file: %s\n' "$file" >&2
    exit 1
  fi

  if [ -L "$file" ]; then
    printf 'Refusing to package symbolic link: %s\n' "$file" >&2
    exit 1
  fi
done

command -v node >/dev/null 2>&1 || {
  printf 'Node.js is required to validate and package the extension.\n' >&2
  exit 1
}

command -v zip >/dev/null 2>&1 || {
  printf 'The zip command is required to package the extension.\n' >&2
  exit 1
}

command -v unzip >/dev/null 2>&1 || {
  printf 'The unzip command is required to verify the extension package.\n' >&2
  exit 1
}

node --check content.js
node --test content.test.js

version=$(node -p "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')).version")
case "$version" in
  ""|*[!0-9.]*|.*|*..*|*.)
    printf 'Invalid manifest version: %s\n' "$version" >&2
    exit 1
    ;;
esac

artifact_name="atlas-index-exporter-v${version}.zip"

mkdir -p dist
rm -f "dist/$artifact_name"
zip -X -j -q "dist/$artifact_name" $runtime_files

expected_entries=$(printf '%s\n' $runtime_files)
actual_entries=$(unzip -Z1 "dist/$artifact_name")
if [ "$actual_entries" != "$expected_entries" ]; then
  printf 'Release archive contains unexpected entries.\n' >&2
  rm -f "dist/$artifact_name"
  exit 1
fi

unzip -tq "dist/$artifact_name" >/dev/null

printf 'Created %s\n' "dist/$artifact_name"