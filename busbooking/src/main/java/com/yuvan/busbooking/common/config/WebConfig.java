package com.yuvan.busbooking.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.yuvan.busbooking.common.util.PreAuthorizeInterceptor;

@Configuration 
public class WebConfig implements WebMvcConfigurer{
    
    private final PreAuthorizeInterceptor preAuthorizeInterceptor;

    public WebConfig(PreAuthorizeInterceptor preAuthorizeInterceptor) {
        this.preAuthorizeInterceptor = preAuthorizeInterceptor;
    }

    @Override 
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(preAuthorizeInterceptor);
    }

}
