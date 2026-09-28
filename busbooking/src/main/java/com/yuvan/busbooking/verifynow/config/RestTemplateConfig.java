package com.yuvan.busbooking.verifynow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;


@Configuration
public class RestTemplateConfig {
    
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
