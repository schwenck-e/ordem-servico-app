#!/bin/bash
# hack/linear_status.sh - Update the workflow status of a Linear ticket
# Usage: ./hack/linear_status.sh <TICKET_IDENTIFIER> [STATUS_NAME]
# Example: ./hack/linear_status.sh ELI-11 Done

set -e

TICKET="${1}"
TARGET_STATUS="${2:-Done}"

if [ -z "$TICKET" ]; then
    echo "Usage: $0 <TICKET_IDENTIFIER> [STATUS_NAME (default: Done)]"
    exit 1
fi

if [ -z "$LINEAR_API_KEY" ]; then
    if [ -f "$HOME/.gemini/config/mcp_config.json" ]; then
        LINEAR_API_KEY=$(grep -o '"LINEAR_API_KEY": "[^"]*"' "$HOME/.gemini/config/mcp_config.json" | head -n 1 | cut -d'"' -f4)
    fi
fi

if [ -z "$LINEAR_API_KEY" ]; then
    echo "❌ Error: LINEAR_API_KEY is not set and could not be found in ~/.gemini/config/mcp_config.json"
    exit 1
fi

echo "🔍 Fetching issue and available states for ${TICKET}..."
ISSUE_DATA=$(curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_API_KEY}" \
  -d "{\"query\": \"query { issue(id: \\\"${TICKET}\\\") { id identifier title state { id name } team { states { nodes { id name type } } } } }\"}")

ISSUE_ID=$(python3 -c "import json, sys; d=json.loads(sys.argv[1]).get('data', {}).get('issue'); print(d['id'] if d else '')" "$ISSUE_DATA")

if [ -z "$ISSUE_ID" ]; then
    echo "❌ Error: Issue ${TICKET} not found in Linear."
    echo "Response: $ISSUE_DATA"
    exit 1
fi

CURRENT_STATUS=$(python3 -c "import json, sys; d=json.loads(sys.argv[1]).get('data', {}).get('issue'); print(d['state']['name'] if d and d.get('state') else '')" "$ISSUE_DATA")
TARGET_STATE_ID=$(python3 -c "
import json, sys
data = json.loads(sys.argv[1]).get('data', {}).get('issue', {})
target = sys.argv[2].lower()
states = data.get('team', {}).get('states', {}).get('nodes', [])
# First match exact or lowercase name
matched = [s for s in states if s['name'].lower() == target]
if not matched:
    # Match type (e.g. completed -> Done, started -> In Progress)
    matched = [s for s in states if s.get('type', '').lower() == target]
print(matched[0]['id'] if matched else '')
" "$ISSUE_DATA" "$TARGET_STATUS")

if [ -z "$TARGET_STATE_ID" ]; then
    echo "❌ Error: State '${TARGET_STATUS}' not found in team workflow states."
    echo "Available states:"
    python3 -c "
import json, sys
data = json.loads(sys.argv[1]).get('data', {}).get('issue', {})
states = data.get('team', {}).get('states', {}).get('nodes', [])
for s in states:
    print(f\"  - {s['name']} (type: {s.get('type')})\")
" "$ISSUE_DATA"
    exit 1
fi

echo "🔄 Updating issue ${TICKET} from '${CURRENT_STATUS}' to '${TARGET_STATUS}'..."
UPDATE_RESP=$(curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: ${LINEAR_API_KEY}" \
  -d "{\"query\": \"mutation UpdateState { issueUpdate(id: \\\"${ISSUE_ID}\\\", input: { stateId: \\\"${TARGET_STATE_ID}\\\" }) { success issue { identifier title state { name } } } }\"}")

SUCCESS=$(python3 -c "import json, sys; d=json.loads(sys.argv[1]).get('data', {}).get('issueUpdate'); print(d.get('success', False) if d else False)" "$UPDATE_RESP")

if [ "$SUCCESS" = "True" ]; then
    FINAL_STATUS=$(python3 -c "import json, sys; d=json.loads(sys.argv[1]).get('data', {}).get('issueUpdate', {}).get('issue', {}); print(d.get('state', {}).get('name', ''))" "$UPDATE_RESP")
    echo "✅ Successfully updated issue ${TICKET} to '${FINAL_STATUS}'!"
else
    echo "❌ Failed to update issue status."
    echo "Response: $UPDATE_RESP"
    exit 1
fi
