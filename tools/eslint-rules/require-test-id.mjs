const TAGS = ['button', 'a', 'input', 'select', 'textarea'];
const TEST_ID = 'data-testid';

const hasTestId = (element) => [...element.attributes, ...element.inputs].some((attribute) => attribute.name === TEST_ID);
const isButtonRole = (element) => element.attributes.some((attribute) => attribute.name === 'role' && attribute.value === 'button');

export default {
  meta: { type: 'problem', messages: { missing: '<{{name}}> needs a data-testid attribute (CLAUDE.md)' }, schema: [] },
  create(context) {
    const { parserServices } = context.sourceCode;
    return {
      Element(element) {
        const name = element.name.toLowerCase();
        if ((TAGS.includes(name) || isButtonRole(element)) && !hasTestId(element)) {
          context.report({ loc: parserServices.convertNodeSourceSpanToLoc(element.sourceSpan), messageId: 'missing', data: { name } });
        }
      },
    };
  },
};
