package com.yuvan.busbooking.common.logging;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Aspect for method-level logging in service classes.
 * Logs method entry, exit, parameters, return values, and exceptions.
 * Provides timing information for performance analysis.
 */
@Aspect
@Component
@Slf4j
public class MethodLoggingAspect {

    /**
     * Aspect for logging all methods in service and controller packages
     */
    @Around("execution(* com.yuvan.busbooking.*.service..*(..)) || execution(* com.yuvan.busbooking.*.controller..*(..))")
    public Object logMethodExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = signature.getName();
        String packageName = signature.getDeclaringType().getPackage().getName();

        // Get method parameters
        Object[] args = joinPoint.getArgs();
        String[] paramNames = signature.getParameterNames();
        
        // Log method entry with parameters
        logMethodEntry(className, methodName, packageName, paramNames, args);

        long startTime = System.currentTimeMillis();

        try {
            // Execute the actual method
            Object result = joinPoint.proceed();

            // Calculate execution time
            long executionTime = System.currentTimeMillis() - startTime;

            // Log method exit with return value
            logMethodExit(className, methodName, executionTime, result);

            return result;
        } catch (Throwable throwable) {
            // Calculate execution time until exception
            long executionTime = System.currentTimeMillis() - startTime;

            // Log method exception
            logMethodException(className, methodName, executionTime, throwable);

            throw throwable;
        }
    }

    /**
     * Logs method entry details
     */
    private void logMethodEntry(String className, String methodName, String packageName,
                               String[] paramNames, Object[] args) {
        StringBuilder sb = new StringBuilder();
        sb.append(">> ENTERING METHOD: ").append(className).append(".").append(methodName).append("()");
        
        // Add parameters if present
        if (args != null && args.length > 0) {
            sb.append("\n   Parameters:");
            for (int i = 0; i < args.length; i++) {
                String paramName = (paramNames != null && i < paramNames.length) ? paramNames[i] : "arg" + i;
                Object value = args[i];
                
                // Mask sensitive parameter values
                String maskedValue = maskSensitiveValue(paramName, value);
                sb.append("\n     - ").append(paramName).append(": ").append(maskedValue);
            }
        }

        log.debug(sb.toString());
    }

    /**
     * Logs method exit details
     */
    private void logMethodExit(String className, String methodName, long executionTime, Object result) {
        StringBuilder sb = new StringBuilder();
        sb.append("<< EXITING METHOD: ").append(className).append(".").append(methodName).append("()");
        sb.append("\n   Execution Time: ").append(executionTime).append("ms");

        // Log return value if not null and not sensitive
        if (result != null && !(result instanceof byte[] || result instanceof char[])) {
            String resultStr = result.toString();
            if (resultStr.length() > 1000) {
                resultStr = resultStr.substring(0, 1000) + "... [truncated]";
            }
            sb.append("\n   Return Value: ").append(resultStr);
        }

        log.debug(sb.toString());
    }

    /**
     * Logs method exception details
     */
    private void logMethodException(String className, String methodName, long executionTime, Throwable throwable) {
        StringBuilder sb = new StringBuilder();
        sb.append("!!! EXCEPTION IN METHOD: ").append(className).append(".").append(methodName).append("()");
        sb.append("\n   Execution Time: ").append(executionTime).append("ms");
        sb.append("\n   Exception: ").append(throwable.getClass().getSimpleName());
        sb.append("\n   Message: ").append(throwable.getMessage());

        log.error(sb.toString(), throwable);
    }

    /**
     * Masks sensitive parameter values
     */
    private String maskSensitiveValue(String paramName, Object value) {
        if (value == null) {
            return "null";
        }

        String lowerParamName = paramName.toLowerCase();
        
        // Check if parameter name suggests it's sensitive
        if (lowerParamName.contains("password") || 
            lowerParamName.contains("token") ||
            lowerParamName.contains("secret") ||
            lowerParamName.contains("key") ||
            lowerParamName.contains("credential") ||
            lowerParamName.contains("otp") ||
            lowerParamName.contains("pin") ||
            lowerParamName.contains("cvv") ||
            lowerParamName.contains("cardnumber")) {
            return "***MASKED***";
        }

        // If it's a request object, don't log full details
        if (value.getClass().getSimpleName().contains("Request")) {
            return value.getClass().getSimpleName() + "[object]";
        }

        String valueStr = value.toString();
        return valueStr.length() > 500 ? valueStr.substring(0, 500) + "... [truncated]" : valueStr;
    }
}
