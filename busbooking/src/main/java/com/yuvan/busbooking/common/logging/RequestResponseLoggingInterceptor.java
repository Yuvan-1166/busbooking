package com.yuvan.busbooking.common.logging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Interceptor for logging HTTP request and response details.
 * Provides comprehensive logging for debugging and auditing purposes.
 * No terminal output - all logs go to files via Logback configuration.
 */
@Component
@Slf4j
public class RequestResponseLoggingInterceptor implements HandlerInterceptor {

    private static final String START_TIME_ATTRIBUTE = "startTime";
    private static final int BUFFER_SIZE = 8192; // 8KB buffer for request/response body

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute(START_TIME_ATTRIBUTE, System.currentTimeMillis());

        // Wrap request to capture body for logging
        HttpServletRequest wrappedRequest = new ContentCachingRequestWrapper(request, BUFFER_SIZE);

        try {
            // Log incoming request details
            logRequestDetails(wrappedRequest);
        } catch (Exception e) {
            log.warn("Error logging request details", e);
        }

        // Replace request with wrapped version if caching is needed
        request.setAttribute(ContentCachingRequestWrapper.class.getName(), wrappedRequest);
        
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        try {
            // Wrap response to capture body for logging
            ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

            // Calculate request duration
            long startTime = (Long) request.getAttribute(START_TIME_ATTRIBUTE);
            long duration = System.currentTimeMillis() - startTime;

            // Log response details
            logResponseDetails(request, wrappedResponse, duration, ex);

            // Copy response content back to original response
            wrappedResponse.copyBodyToResponse();
        } catch (Exception e) {
            log.warn("Error logging response details", e);
        }
    }

    /**
     * Logs detailed HTTP request information
     */
    private void logRequestDetails(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n========== HTTP REQUEST ==========\n");
        sb.append("Method: ").append(request.getMethod()).append("\n");
        sb.append("URI: ").append(request.getRequestURI()).append("\n");
        
        // Add query parameters if present
        if (request.getQueryString() != null) {
            sb.append("Query: ").append(request.getQueryString()).append("\n");
        }
        
        // Log headers (exclude sensitive headers)
        sb.append("Headers:\n");
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            String headerValue = request.getHeader(headerName);
            // Mask sensitive headers
            if (isSensitiveHeader(headerName)) {
                sb.append("  ").append(headerName).append(": ***MASKED***\n");
            } else {
                sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
            }
        }

        // Log body if present and not binary
        String contentType = request.getContentType();
        if (contentType != null && isLogableContentType(contentType)) {
            try {
                if (request instanceof ContentCachingRequestWrapper) {
                    byte[] body = ((ContentCachingRequestWrapper) request).getContentAsByteArray();
                    if (body.length > 0) {
                        String bodyStr = new String(body, StandardCharsets.UTF_8);
                        // Mask sensitive fields in request body
                        bodyStr = maskSensitiveFields(bodyStr);
                        sb.append("Body: ").append(limitBodyLength(bodyStr)).append("\n");
                    }
                }
            } catch (Exception e) {
                log.debug("Could not read request body", e);
            }
        }

        sb.append("Remote IP: ").append(getClientIp(request)).append("\n");
        sb.append("==================================\n");

        log.info(sb.toString());
    }

    /**
     * Logs detailed HTTP response information
     */
    private void logResponseDetails(HttpServletRequest request, ContentCachingResponseWrapper response, long duration, Exception ex) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n========== HTTP RESPONSE ==========\n");
        sb.append("Status: ").append(response.getStatus()).append("\n");
        sb.append("Duration (ms): ").append(duration).append("\n");

        // Log response headers
        sb.append("Headers:\n");
        response.getHeaderNames().forEach(headerName -> {
            String headerValue = response.getHeader(headerName);
            if (isSensitiveHeader(headerName)) {
                sb.append("  ").append(headerName).append(": ***MASKED***\n");
            } else {
                sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
            }
        });

        // Log response body if present and not binary
        String contentType = response.getContentType();
        if (contentType != null && isLogableContentType(contentType)) {
            try {
                byte[] body = response.getContentAsByteArray();
                if (body.length > 0) {
                    String bodyStr = new String(body, StandardCharsets.UTF_8);
                    // Mask sensitive fields in response body
                    bodyStr = maskSensitiveFields(bodyStr);
                    sb.append("Body: ").append(limitBodyLength(bodyStr)).append("\n");
                }
            } catch (Exception e) {
                log.debug("Could not read response body", e);
            }
        }

        // Log exception if present
        if (ex != null) {
            sb.append("Exception: ").append(ex.getClass().getSimpleName()).append(" - ").append(ex.getMessage()).append("\n");
        }

        sb.append("==================================\n");

        // Log at appropriate level based on status code
        if (response.getStatus() >= 500) {
            log.error(sb.toString());
        } else if (response.getStatus() >= 400) {
            log.warn(sb.toString());
        } else {
            log.info(sb.toString());
        }
    }

    /**
     * Checks if a header is sensitive and should be masked
     */
    private boolean isSensitiveHeader(String headerName) {
        String lowerName = headerName.toLowerCase();
        return lowerName.contains("authorization") || 
               lowerName.contains("cookie") || 
               lowerName.contains("token") ||
               lowerName.contains("password") ||
               lowerName.contains("secret") ||
               lowerName.contains("credential");
    }

    /**
     * Checks if content type is loggable (excludes binary types)
     */
    private boolean isLogableContentType(String contentType) {
        return contentType.contains("application/json") ||
               contentType.contains("application/xml") ||
               contentType.contains("text/plain") ||
               contentType.contains("application/x-www-form-urlencoded");
    }

    /**
     * Masks sensitive fields in request/response bodies
     */
    private String maskSensitiveFields(String body) {
        // Mask common sensitive fields in JSON
        body = body.replaceAll("\"password\"\\s*:\\s*\"[^\"]*\"", "\"password\":\"***MASKED***\"");
        body = body.replaceAll("\"token\"\\s*:\\s*\"[^\"]*\"", "\"token\":\"***MASKED***\"");
        body = body.replaceAll("\"authorization\"\\s*:\\s*\"[^\"]*\"", "\"authorization\":\"***MASKED***\"");
        body = body.replaceAll("\"cvv\"\\s*:\\s*\"[^\"]*\"", "\"cvv\":\"***MASKED***\"");
        body = body.replaceAll("\"cardNumber\"\\s*:\\s*\"[^\"]*\"", "\"cardNumber\":\"***MASKED***\"");
        body = body.replaceAll("\"secret\"\\s*:\\s*\"[^\"]*\"", "\"secret\":\"***MASKED***\"");
        body = body.replaceAll("\"otp\"\\s*:\\s*\"[^\"]*\"", "\"otp\":\"***MASKED***\"");
        body = body.replaceAll("\"pin\"\\s*:\\s*\"[^\"]*\"", "\"pin\":\"***MASKED***\"");
        
        return body;
    }

    /**
     * Limits body length for logging
     */
    private String limitBodyLength(String body) {
        int maxLength = 2000;
        if (body.length() > maxLength) {
            return body.substring(0, maxLength) + "... [truncated]";
        }
        return body;
    }

    /**
     * Gets client IP address
     */
    private String getClientIp(HttpServletRequest request) {
        String[] headers = {
            "X-Forwarded-For",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_X_FORWARDED_FOR",
            "HTTP_X_FORWARDED",
            "HTTP_X_PROXY_AUTHORIZATION_FORWARDED",
            "HTTP_CLIENT_IP",
            "HTTP_X_CLUSTER_CLIENT_IP",
            "X-Real-IP"
        };

        for (String header : headers) {
            String value = request.getHeader(header);
            if (value != null && value.length() > 0 && !"unknown".equalsIgnoreCase(value)) {
                // X-Forwarded-For can contain multiple IPs, return the first one
                return value.split(",")[0];
            }
        }

        return request.getRemoteAddr();
    }
}
