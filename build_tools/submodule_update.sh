#!/bin/bash
SCRIPT_PATH=$( cd "$(dirname "${BASH_SOURCE}")" ; pwd -P )
cd "$SCRIPT_PATH/../" && git submodule init && git submodule update

