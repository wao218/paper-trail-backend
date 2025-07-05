import { OllamaEmbeddings, ChatOllama } from '@langchain/ollama';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { combineDocuments } from '../utils/combineDocuments';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { formatConvHistory } from '../utils/formatConvHistory';

const embeddings = new OllamaEmbeddings({
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434',
});

const vectorStore = new Chroma(embeddings, {
  collectionName: 'documents',
});

const llm = new ChatOllama({
  model: 'llama3.2',
});

const retriever = vectorStore.asRetriever();

const standaloneQuestionTemplate = `Given a question and some conversation history (if any), convert the question into a standalone question. Just give the question by itself.
  question: {question}
  history: {history}
  standalone question:`;

const standaloneQuestionPrompt = PromptTemplate.fromTemplate(
  standaloneQuestionTemplate
);

const answerTemplate = `You are an experience, helpful and enthusiastic researcher and an expert at interpretting and answering questions based on the PDF documents a user provides as context and the conversation history. Try to find the answer in the context provided. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say in a friendly nice way "I'm sorry, I don't know the answer to that." Don't try to make up an answer. Always speak as if you were chatting with a good friend.
context: {context}
history: {history}
question: {question}
answer:
`;

const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

const standaloneQuestionChain = RunnableSequence.from([
  standaloneQuestionPrompt,
  llm,
  new StringOutputParser(),
]);
const retrieverChain = RunnableSequence.from([
  (prevResult) => prevResult.standalone_question,
  retriever,
  combineDocuments,
]);
const answerChain = RunnableSequence.from([
  answerPrompt,
  llm,
  new StringOutputParser(),
]);

const chain = RunnableSequence.from([
  {
    standalone_question: standaloneQuestionChain,
    original_input: new RunnablePassthrough(),
  },
  {
    context: retrieverChain,
    question: ({ original_input }) => original_input.question,
    history: ({ original_input }) => original_input.history,
  },
  answerChain,
]);

const convHistory: string[] = [];

export async function chatWithPDF(question: string) {
  const response = await chain.invoke({
    question,
    history: formatConvHistory(convHistory),
  });
  convHistory.push(question);
  convHistory.push(response);
  console.log(response);
  return response;
}
