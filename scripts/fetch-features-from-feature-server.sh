#!/bin/bash -e

if ! which jq >/dev/null; then
  echo "jq must be installed" >&2
  exit 2
fi

SERVER_URL=$1
OUTPUT_FILE=$2
if [ -z "$SERVER_URL" ] || [ -z "$OUTPUT_FILE" ]; then
  echo "Usage:$0 <server_url> <output_file> ">&2
  echo " e.g.: $0 https://my-server.local/server/.../FeatureServer/0/query layer.geojson ">&2
  exit 1
fi

OFFSET_INCREASE=2000
OFFSET=0
LIMITED=true
TMP_FILE="$(mktemp)"

fetch_features() {
  local offset=$1
  echo "fetch offset $offset" >&2
  local response=$(curl -s "$SERVER_URL?where=1=1&outFields=*&resultOffset=$offset&f=geojson")
  echo "$response" | jq '.features[]' >> "$TMP_FILE"
  LIMITED=$(echo "$response" | jq -r '.properties.exceededTransferLimit')
}

fetch_features "$OFFSET"

while [ "$LIMITED" = true ]; do
  OFFSET=$((OFFSET + OFFSET_INCREASE))
  fetch_features "$OFFSET"
done

cat "$TMP_FILE" | jq -s '{
  "type": "FeatureCollection",
  "features": [.[]]
}' > $OUTPUT_FILE
nbFeatures=$(cat "$OUTPUT_FILE" | jq '.features | length')
rm "$TMP_FILE"
echo "$nbFeatures features ont été récupérées."
