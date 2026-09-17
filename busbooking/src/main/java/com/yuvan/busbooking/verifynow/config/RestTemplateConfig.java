package com.yuvan.busbooking.verifynow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration for RestTemplate for Message Central API calls
 */
@Configuration
public class RestTemplateConfig {
    
    /**
     * Create a RestTemplate bean with custom timeout settings for Message Central API
     */
    @Bean(name = "messageCentralRestTemplate")
    public RestTemplate messageCentralRestTemplate() {
        RestTemplate restTemplate = new RestTemplate(clientHttpRequestFactory());
        return restTemplate;
    }
    
    private ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);  // 10 seconds
        factory.setReadTimeout(30000);     // 30 seconds
        return factory;
    }
}
