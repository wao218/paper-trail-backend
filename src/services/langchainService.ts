import { createClient } from '@supabase/supabase-js';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { combineDocuments } from '../utils/combineDocuments';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { formatConvHistory } from '../utils/formatConvHistory';

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
});

const supabaseClient = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_KEY as string
);

const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: 'documents',
  queryName: 'match_documents',
});

const llm = new ChatOpenAI({
  model: 'gpt-4.1-nano-2025-04-14',
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
