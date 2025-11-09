#!/bin/bash

DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source <(grep -v '^#' $DIR/../.env.local | grep -v '^$' | sed 's/^/export /')

cd $DIR/..

npx prisma $@