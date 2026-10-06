#!/usr/bin/env python3
import argparse, base64, json, os, sys, urllib.error, urllib.request, uuid

SITE = "https://datntdev.atlassian.net"
PROJECT = "PNS"
API = f"{SITE}/rest/api/3"
ISSUE_FIELDS = ["summary", "status", "issuetype", "parent", "fixVersions"]
DOCS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
MODULE_DOCS = ["0.requirements.html", "0.solution.html"]


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def auth_header():
    email, token = os.environ.get("JIRA_EMAIL"), os.environ.get("JIRA_API_TOKEN")
    if not email or not token:
        fail("Set JIRA_EMAIL and JIRA_API_TOKEN environment variables.")
    return "Basic " + base64.b64encode(f"{email}:{token}".encode()).decode()


def send(method, url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", auth_header())
    for name, value in (headers or {}).items():
        req.add_header(name, value)
    try:
        with urllib.request.urlopen(req) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        fail(f"{method} {url} failed: {error.code} {error.read().decode('utf-8', 'replace')}")
    except urllib.error.URLError as error:
        fail(f"{method} {url} failed: {error.reason}")


def request(method, path, body=None, data=None, headers=None):
    if body is not None:
        data = json.dumps(body).encode()
    raw = send(method, API + path, data, {"Accept": "application/json", **(headers or {"Content-Type": "application/json"})})
    return json.loads(raw) if raw else {}


def issue_line(issue):
    fields = issue["fields"]
    parent = fields.get("parent", {}).get("key", "-")
    versions = ", ".join(v["name"] for v in fields.get("fixVersions", [])) or "-"
    return f"{issue['key']} | {fields['issuetype']['name']} | {fields['status']['name']} | {parent} | {versions} | {fields['summary']}"


def adf_lines(node):
    kind = node.get("type")
    if kind == "text":
        return [node["text"]]
    if kind == "hardBreak":
        return ["\n"]
    children = node.get("content", [])
    if kind in ("paragraph", "heading", "codeBlock"):
        return ["".join(part for child in children for part in adf_lines(child)) + "\n"]
    if kind == "listItem":
        text = "".join(part for child in children for part in adf_lines(child)).strip("\n")
        return ["- " + text.replace("\n", "\n  ") + "\n"]
    return [part for child in children for part in adf_lines(child)]


def cmd_search(args):
    token = None
    while True:
        body = {"jql": args.jql, "maxResults": 100, "fields": ISSUE_FIELDS}
        if token:
            body["nextPageToken"] = token
        result = request("POST", "/search/jql", body)
        for issue in result.get("issues", []):
            print(issue_line(issue))
        token = result.get("nextPageToken")
        if not token:
            break


def cmd_get(args):
    issue = request("GET", f"/issue/{args.key}?fields={','.join(ISSUE_FIELDS + ['description'])}")
    print(issue_line(issue))
    description = issue["fields"].get("description")
    if description:
        print()
        print("".join(adf_lines(description)).rstrip())


def transition_issue(key, status):
    issue = request("GET", f"/issue/{key}?fields=status")
    old = issue["fields"]["status"]["name"]
    if old.lower() == status.lower():
        print(f"{key}: already {old}, skipped")
        return True
    transitions = request("GET", f"/issue/{key}/transitions")["transitions"]
    match = next((t for t in transitions if t["to"]["name"].lower() == status.lower()), None)
    if not match:
        print(f"{key}: no transition to '{status}' from {old}")
        return False
    request("POST", f"/issue/{key}/transitions", {"transition": {"id": match["id"]}})
    print(f"{key}: {old} -> {match['to']['name']}")
    return True


def cmd_transition(args):
    results = [transition_issue(key, args.status) for key in args.keys]
    if not all(results):
        sys.exit(1)


def project_versions():
    return request("GET", f"/project/{PROJECT}/versions")


def find_version(name):
    return next((v for v in project_versions() if v["name"].lower() == name.lower()), None)


def cmd_versions(args):
    for v in project_versions():
        released = "yes" if v.get("released") else "no"
        print(f"{v['name']} | {v.get('startDate', '-')} | {v.get('releaseDate', '-')} | {released} | {v.get('description', '')}")


def cmd_version(args):
    fields = {"startDate": args.start, "releaseDate": args.release, "description": args.description}
    fields = {k: v for k, v in fields.items() if v is not None}
    existing = find_version(args.name)
    if existing:
        request("PUT", f"/version/{existing['id']}", fields)
        print(f"updated {existing['name']}")
        return
    project_id = request("GET", f"/project/{PROJECT}")["id"]
    request("POST", "/version", {"name": args.name, "projectId": int(project_id), **fields})
    print(f"created {args.name}")


def cmd_fix_version(args):
    version = find_version(args.name)
    if not version:
        fail(f"Version '{args.name}' not found in project {PROJECT}.")
    for key in args.keys:
        request("PUT", f"/issue/{key}", {"update": {"fixVersions": [{"add": {"id": version["id"]}}]}})
        print(f"{key}: {version['name']}")


def upload_attachment(key, path, name):
    boundary = uuid.uuid4().hex
    with open(path, "rb") as file:
        content = file.read()
    head = f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\nContent-Type: application/octet-stream\r\n\r\n'
    data = head.encode() + content + f"\r\n--{boundary}--\r\n".encode()
    headers = {"Content-Type": f"multipart/form-data; boundary={boundary}", "X-Atlassian-Token": "no-check"}
    request("POST", f"/issue/{key}/attachments", data=data, headers=headers)


def epic_key(module):
    jql = f'project = {PROJECT} AND issuetype = Epic AND summary ~ "\\"{module}\\""'
    issues = request("POST", "/search/jql", {"jql": jql, "fields": ["summary"]}).get("issues", [])
    key = next((i["key"] for i in issues if i["fields"]["summary"].startswith(module + " ")), None)
    if not key:
        fail(f"Epic of module {module} not found.")
    return key


def attachments(key):
    return request("GET", f"/issue/{key}?fields=attachment")["fields"]["attachment"]


def attach_files(key, paths, prefix=""):
    existing = attachments(key)
    for path in paths:
        name = prefix + os.path.basename(path)
        for old in (a for a in existing if a["filename"] == name):
            request("DELETE", f"/attachment/{old['id']}")
        upload_attachment(key, path, name)
        print(f"{key}: {name}")


def cmd_attach(args):
    attach_files(args.key, args.files, args.prefix)


def cmd_push_docs(args):
    folder = os.path.join(DOCS, args.module)
    attach_files(epic_key(args.module), [os.path.join(folder, name) for name in args.files or MODULE_DOCS], f"{args.module}-")


def cmd_pull_docs(args):
    key, prefix, folder = epic_key(args.module), f"{args.module}-", os.path.join(DOCS, args.module)
    os.makedirs(folder, exist_ok=True)
    for attachment in (a for a in attachments(key) if a["filename"].startswith(prefix)):
        path = os.path.join(folder, attachment["filename"][len(prefix):])
        if os.path.exists(path) and not args.force:
            print(f"skip {path}: exists, use --force to overwrite")
            continue
        with open(path, "wb") as file:
            file.write(send("GET", attachment["content"]))
        print(f"{key}: {attachment['filename']} -> {path}")


def build_parser():
    parser = argparse.ArgumentParser(description="Jira Cloud helper for project " + PROJECT)
    sub = parser.add_subparsers(dest="command", required=True)
    search = sub.add_parser("search", help="search issues by JQL")
    search.add_argument("jql")
    search.set_defaults(func=cmd_search)
    get = sub.add_parser("get", help="show one issue with description")
    get.add_argument("key")
    get.set_defaults(func=cmd_get)
    transition = sub.add_parser("transition", help="move issues to a status")
    transition.add_argument("status")
    transition.add_argument("keys", nargs="+")
    transition.set_defaults(func=cmd_transition)
    sub.add_parser("versions", help="list project versions").set_defaults(func=cmd_versions)
    version = sub.add_parser("version", help="create or update a version")
    version.add_argument("name")
    version.add_argument("--start")
    version.add_argument("--release")
    version.add_argument("--description")
    version.set_defaults(func=cmd_version)
    fix_version = sub.add_parser("fix-version", help="add a fix version to issues")
    fix_version.add_argument("name")
    fix_version.add_argument("keys", nargs="+")
    fix_version.set_defaults(func=cmd_fix_version)
    attach = sub.add_parser("attach", help="upload files to an issue, replacing attachments with the same name")
    attach.add_argument("key")
    attach.add_argument("files", nargs="+")
    attach.add_argument("--prefix", default="")
    attach.set_defaults(func=cmd_attach)
    push_docs = sub.add_parser("push-docs", help="upload module docs to the module Epic as <Mxx>-<file>")
    push_docs.add_argument("module")
    push_docs.add_argument("files", nargs="*", choices=MODULE_DOCS)
    push_docs.set_defaults(func=cmd_push_docs)
    pull_docs = sub.add_parser("pull-docs", help="download module docs from the module Epic into .claude/docs/<Mxx>/")
    pull_docs.add_argument("module")
    pull_docs.add_argument("--force", action="store_true")
    pull_docs.set_defaults(func=cmd_pull_docs)
    return parser


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
