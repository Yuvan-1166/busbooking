package com.yuvan.busbooking.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.yuvan.busbooking.common.logging.RequestResponseLoggingInterceptor;
import com.yuvan.busbooking.common.util.PreAuthorizeInterceptor;

@Configuration 
public class WebConfig implements WebMvcConfigurer{
    
    private final PreAuthorizeInterceptor preAuthorizeInterceptor;
    private final RequestResponseLoggingInterceptor requestResponseLoggingInterceptor;

    public WebConfig(
            PreAuthorizeInterceptor preAuthorizeInterceptor,
            RequestResponseLoggingInterceptor requestResponseLoggingInterceptor
    ) {
        this.preAuthorizeInterceptor = preAuthorizeInterceptor;
        this.requestResponseLoggingInterceptor = requestResponseLoggingInterceptor;
    }

    @Override 
    public void addInterceptors(InterceptorRegistry registry) {
        // Add logging interceptor first to capture all requests/responses
        registry.addInterceptor(requestResponseLoggingInterceptor);
        
        // Add authorization interceptor
        registry.addInterceptor(preAuthorizeInterceptor);
    }

}
