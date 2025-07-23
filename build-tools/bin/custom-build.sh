#!/bin/sh
set -x # echo commands executed
set -e # fail script on any individual command failing

target=$1
if [ -z "$target" ]; then
    target="build";
fi

case "$target" in
  clean)
    rm -rf build/;  
    ;;
  build|release)
    rsync -av --delete --exclude-from=.gitignore --exclude=build --exclude=.git ./ build/
    # If running locally, use git; if on build.amazon, use brazil env var.
    [[ -z "$BRAZIL_PACKAGE_CHANGE_ID" ]] && echo "$(git rev-parse HEAD)" > build/git-info || echo "$BRAZIL_PACKAGE_CHANGE_ID" > build/git-info;    
    ;;
  *)
    echo "unknown target: '$target'. Exiting...";
    exit 1;
    ;;
esac
