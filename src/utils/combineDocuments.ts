import { Document } from 'langchain/document';

export function combineDocuments(docs: Document[]): string {
  return docs.map((doc) => doc.pageContent).join('\n\n');
}
