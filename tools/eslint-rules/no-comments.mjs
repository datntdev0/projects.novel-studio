const directive = /^\s*(eslint-disable|eslint-enable|@ts-expect-error)/;

export default {
  meta: { type: 'problem', messages: { noComment: 'Comments are not allowed (CLAUDE.md)' }, schema: [] },
  create(context) {
    const sourceCode = context.sourceCode;

    function findTemplateComments() {
      return [...sourceCode.text.matchAll(/<!--([\s\S]*?)-->/g)].map((match) => ({
        value: match[1],
        loc: { start: sourceCode.getLocFromIndex(match.index), end: sourceCode.getLocFromIndex(match.index + match[0].length) },
      }));
    }

    return {
      'Program:exit'() {
        const comments = context.filename.endsWith('.html') ? findTemplateComments() : sourceCode.getAllComments();
        for (const comment of comments) {
          if (!directive.test(comment.value)) {
            context.report({ loc: comment.loc, messageId: 'noComment' });
          }
        }
      },
    };
  },
};
