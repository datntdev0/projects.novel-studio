import { doc } from 'prettier';
import { parsers as babelParsers } from 'prettier/plugins/babel';
import { parsers as typescriptParsers } from 'prettier/plugins/typescript';
import { printers as estreePrinters } from 'prettier/plugins/estree';

const astFormat = 'estree-single-line-import';
const estree = estreePrinters.estree;

const flatten = (printed) =>
  doc.utils.mapDoc(printed, (part) => {
    if (part.type === 'line' && !part.hard) return part.soft ? '' : ' ';
    if (part.type === 'if-break') return part.flatContents ?? '';
    return part;
  });

const printer = {
  ...estree,
  print(path, options, print, args) {
    const printed = estree.print(path, options, print, args);
    return path.node.type === 'ImportDeclaration' ? flatten(printed) : printed;
  },
};

const withAstFormat = (parsers) => Object.fromEntries(Object.entries(parsers).map(([name, parser]) => [name, { ...parser, astFormat }]));

export const parsers = withAstFormat({ babel: babelParsers.babel, typescript: typescriptParsers.typescript });

export const printers = { [astFormat]: printer };
