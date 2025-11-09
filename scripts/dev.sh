# set DIR as the current scripts directory
DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
source <(grep -v '^#' $DIR/../.env.local | grep -v '^$' | sed 's/^/export /')

cd $DIR/..

pnpm dev