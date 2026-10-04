#!/usr/bin/env python3
import argparse, base64, json, os, sys, urllib.error, urllib.request

SITE = "https://datntdev.atlassian.net"
PROJECT = "PNS"
API = f"{SITE}/rest/api/3"
ISSUE_FIELDS = ["summary", "status", "issuetype", "parent", "fixVersions"]


def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)


def auth_header():
    email, token = os.environ.get("JIRA_EMAIL"), os.environ.get("JIRA_API_TOKEN")
    if not email or not token:
        fail("Set JIRA_EMAIL and JIRA_API_TOKEN environment variables.")
    return "Basic " + base64.b64encode(f"{email}:{token}".encode()).decode()


def request(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header("Authorization", auth_header())
    req.add_header("Accept", "application/json")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as response:
            raw = response.read()
    except urllib.error.HTTPError as error:
        fail(f"{method} {path} failed: {error.code} {error.read().decode('utf-8', 'replace')}")
    except urllib.error.URLError as error:
        fail(f"{method} {path} failed: {error.reason}")
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
    return parser


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
