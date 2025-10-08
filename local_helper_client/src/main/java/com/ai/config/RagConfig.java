package com.ai.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.reader.TextReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

@Configuration
public class RagConfig {

    /**
     * 向量存储
     */
    @Bean
    public VectorStore getVectorStore(EmbeddingModel embeddingModel) {
        return SimpleVectorStore.builder(embeddingModel).build();
    }

    /**
     * 预加载
     */
    @Bean
    public CommandLineRunner preload(EmbeddingModel embeddingModel, VectorStore vectorStore) {
        System.out.println("开始预加载");
        Resource resource1 = new ClassPathResource("rag/preload.txt");
        return args -> vectorStore.write(new TokenTextSplitter().transform(new TextReader(resource1).read()));
    }
}
