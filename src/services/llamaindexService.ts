import { ChromaVectorStore } from '@llamaindex/chroma';
import { OllamaEmbedding } from '@llamaindex/ollama';
import { PDFReader } from '@llamaindex/readers/pdf';
import {
  Settings,
  storageContextFromDefaults,
  VectorStoreIndex,
} from 'llamaindex';

Settings.embedModel = new OllamaEmbedding({ model: 'nomic-embed-text' });

export async function handleUpload(filePath) {
  // 1. Read and Parse Documents and wrap text into LlamaIndex Document
  const reader = new PDFReader();
  const documents = await reader.loadData(filePath);

  // 2. Embed and index documents into chroma
  const vectorStore = new ChromaVectorStore({
    collectionName: 'documents',
    chromaClientParams: {
      path: 'http://localhost:8000',
    },
  });

  const storageContext = await storageContextFromDefaults({ vectorStore });
  await VectorStoreIndex.fromDocuments(documents, {
    storageContext,
  });
}
