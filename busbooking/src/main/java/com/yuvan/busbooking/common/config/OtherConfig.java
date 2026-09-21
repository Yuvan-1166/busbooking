package com.yuvan.busbooking.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration 
public class OtherConfig {
    
    @Bean 
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

}
