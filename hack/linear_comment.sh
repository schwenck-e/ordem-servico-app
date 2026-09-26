#!/bin/bash
# hack/linear_comment.sh - Comment, attach PR, and update status of Linear ticket
# Usage: ./hack/linear_comment.sh <TICKET_IDENTIFIER> <PR_URL> [COMMENT_BODY] [TARGET_STATUS]

set -e

TICKET="${1}"
PR_URL="${2}"
COMMENT_BODY="${3}"
TARGET_STATUS="${4:-In Review}"

if [ -z "$TICKET" ] || [ -z "$PR_URL" ]; then
    echo "Usage: $0 <TICKET> <PR_URL> [COMMENT_BODY] [TARGET_STATUS]"
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

if [ -z "$COMMENT_BODY" ]; then
    COMMENT_BODY="🚀 **Pull Request Aberto para Revisão**: ${PR_URL}"
fi

# Use Python to reliably execute GraphQL operations with correct JSON serialization
python3 -c "
import urllib.request, json, sys, os, re

api_key = sys.argv[1]
ticket = sys.argv[2]
pr_url = sys.argv[3]
comment_body = sys.argv[4]
target_status = sys.argv[5]

# If comment_body is a file path, read it and format if it is a PR description
if os.path.isfile(comment_body):
    try:
        with open(comment_body, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        lines = content.splitlines()
        sections = {}
        curr_sec = 'header'
        sections[curr_sec] = []

        for line in lines:
            if line.startswith('## ') or line.startswith('### '):
                curr_sec = line.lstrip('#').strip().lower()
                sections[curr_sec] = []
            else:
                sections[curr_sec].append(line)

        def find_section(keywords):
            for sec_name, sec_lines in sections.items():
                if any(k in sec_name for k in keywords):
                    text = '\n'.join(sec_lines).strip()
                    cleaned = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL).strip()
                    if cleaned:
                        return cleaned
            return None

        problem = find_section(['problem', 'resumo'])
        impl = find_section(['implemented', 'o que foi feito', 'implementation'])
        user_facing = find_section(['user-facing', 'mudanças'])
        changelog = find_section(['changelog'])

        if problem or impl or user_facing or changelog:
            comment_parts = [f'🚀 **Pull Request Aberto para Revisão**: {pr_url}\n']
            if problem:
                prob_lines = [l for l in problem.splitlines() if l.strip()][:4]
                comment_parts.append('**Context & Objective:**\n' + '\n'.join(prob_lines) + '\n')
            if impl:
                impl_lines = [l for l in impl.splitlines() if l.strip()][:6]
                comment_parts.append('**Implementation & Key Decisions:**\n' + '\n'.join(impl_lines) + '\n')
            if user_facing:
                uf_lines = [l for l in user_facing.splitlines() if l.strip()][:4]
                comment_parts.append('**User-Facing Changes:**\n' + '\n'.join(uf_lines) + '\n')
            elif changelog:
                comment_parts.append(f'**Summary:**\n{changelog}\n')
            comment_body = '\n'.join(comment_parts).strip()
        else:
            comment_body = content
    except Exception as e:
        print(f'⚠️ Warning: Could not read comment file {comment_body}: {e}')

def graphql(query, variables=None):
    payload = {'query': query}
    if variables:
        payload['variables'] = variables
    req = urllib.request.Request(
        'https://api.linear.app/graphql',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': api_key}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

print(f'🔍 Searching Linear issue: {ticket}...')
q_issue = '''
query GetIssue(\$id: String!) {
  issue(id: \$id) {
    id
    identifier
    title
    url
    state { id name }
    team {
      states {
        nodes { id name type }
      }
    }
  }
}
'''
res = graphql(q_issue, {'id': ticket})
issue = res.get('data', {}).get('issue')
if not issue:
    print(f'❌ Error: Issue {ticket} not found in Linear. Response: {res}', file=sys.stderr)
    sys.exit(1)

issue_id = issue['id']
print(f'✅ Found issue: {issue[\"identifier\"]} ({issue_id})')

# 1. Attach PR
print(f'🔗 Attaching PR link: {pr_url}...')
q_attach = '''
mutation CreateAttachment(\$input: AttachmentCreateInput!) {
  attachmentCreate(input: \$input) {
    success
    attachment { id url }
  }
}
'''
attach_res = graphql(q_attach, {'input': {'issueId': issue_id, 'title': f'PR: {pr_url}', 'url': pr_url}})
if attach_res.get('data', {}).get('attachmentCreate', {}).get('success'):
    print('✅ Attachment created successfully.')
else:
    print(f'⚠️ Warning: Could not create attachment: {attach_res}')

# 2. Add Comment
print(f'💬 Posting comment to Linear issue {ticket}...')
q_comment = '''
mutation CreateComment(\$input: CommentCreateInput!) {
  commentCreate(input: \$input) {
    success
    comment { id url }
  }
}
'''
comment_res = graphql(q_comment, {'input': {'issueId': issue_id, 'body': comment_body}})
comment_data = comment_res.get('data', {}).get('commentCreate', {})
if comment_data.get('success'):
    comment_url = comment_data.get('comment', {}).get('url', '')
    print(f'✅ Comment created successfully: {comment_url}')
else:
    print(f'⚠️ Warning: Could not create comment: {comment_res}')

# 3. Update Status (default: In Review)
if target_status:
    states = issue.get('team', {}).get('states', {}).get('nodes', [])
    matched = [s for s in states if s['name'].lower() == target_status.lower()]
    if not matched:
        matched = [s for s in states if s.get('type', '').lower() == target_status.lower()]
    if matched:
        state_id = matched[0]['id']
        state_name = matched[0]['name']
        print(f'🔄 Updating issue status to \'{state_name}\'...')
        q_status = '''
        mutation UpdateState(\$id: String!, \$input: IssueUpdateInput!) {
          issueUpdate(id: \$id, input: \$input) {
            success
            issue { state { name } }
          }
        }
        '''
        st_res = graphql(q_status, {'id': issue_id, 'input': {'stateId': state_id}})
        if st_res.get('data', {}).get('issueUpdate', {}).get('success'):
            print(f'✅ Status updated to \'{state_name}\'!')
" "$LINEAR_API_KEY" "$TICKET" "$PR_URL" "$COMMENT_BODY" "$TARGET_STATUS"

