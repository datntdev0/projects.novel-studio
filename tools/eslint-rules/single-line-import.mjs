export default {
  meta: { type: 'problem', messages: { multiLine: 'Imports must be on a single line (CLAUDE.md)' }, schema: [] },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.loc.start.line !== node.loc.end.line) {
          context.report({ node, messageId: 'multiLine' });
        }
      },
    };
  },
};
