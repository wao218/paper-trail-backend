import { SupabaseVectorStore } from '@llamaindex/supabase';
import { OpenAIEmbedding } from '@llamaindex/openai';
import { PDFReader } from '@llamaindex/readers/pdf';
import {
  Settings,
  storageContextFromDefaults,
  VectorStoreIndex,
} from 'llamaindex';

Settings.embedModel = new OpenAIEmbedding({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'text-embedding-3-small',
});

export async function handleUpload(filePath) {
  // 1. Read and Parse Documents and wrap text into LlamaIndex Document
  const reader = new PDFReader();
  const documents = await reader.loadData(filePath);

  // 2. Embed and index documents into chroma

  const vectorStore = new SupabaseVectorStore({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    table: 'documents',
  });

  const storageContext = await storageContextFromDefaults({ vectorStore });
  await VectorStoreIndex.fromDocuments(documents, {
    storageContext,
  });
}
