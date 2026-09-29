package com.yuvan.busbooking.common.util;

import java.nio.file.AccessDeniedException;
import java.util.*;
import java.util.stream.Collectors;

import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect 
@Component
public class PreAuthorizeAspect {

    @Before("@annotation(preAuthorize)")
    public void authorize(PreAuthorize preAuthorize) throws AccessDeniedException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if(!preAuthorize.value().isEmpty()) {
            List<String> methodArgs = parseExpression(preAuthorize.value());
            switch (methodArgs.getFirst()) {
                case "isAuthenticated":
                    isAuthenticated(authentication);
                    break;
                case "hasRole":
                    if(methodArgs.size() != 2)
                        throw new IllegalArgumentException();
                    hasRole(authentication, methodArgs.getLast());
                    break;
                case "hasAnyRole":
                    if(methodArgs.size() < 2)
                        throw new IllegalArgumentException();
                    hasAnyRole(
                        authentication, 
                        methodArgs
                        .stream()
                        .skip(1)
                        .toArray(String[]::new)
                    );
                    break;
                default:
                    throw new IllegalArgumentException();
            }
        }
    }

    private void isAuthenticated(Authentication authentication) throws AccessDeniedException {
        if(authentication == null || !authentication.isAuthenticated())
            throw new AccessDeniedException("User not Authenticated");
    }

    private void hasRole(Authentication authentication, String role) throws AccessDeniedException{
        hasAnyRole(authentication, role);
    }

    private void hasAnyRole(Authentication authentication, String... roles) throws AccessDeniedException{
        isAuthenticated(authentication);
        Set<String> roleSet = Arrays.stream(roles).collect(Collectors.toSet());
        boolean authorized = authentication.getAuthorities()
                                .stream()
                                .map(authority -> authority.getAuthority())
                                .anyMatch(authority -> roleSet.contains(authority));
        if(!authorized)
            throw new AccessDeniedException("User not Authenticated");
    }

    private List<String> parseExpression(String exp) {
        List<String> methodArgs = new ArrayList<>();
        if(
            exp.startsWith("isAuthenticated")
            || exp.startsWith("hasRole")
            || exp.startsWith("hasAnyRole")
        
        ) {
            methodArgs.add(exp.substring(0, exp.indexOf('(')));
            String[] args = exp.replace(" ", "").substring(exp.indexOf('(')+1, exp.indexOf(')')).split(",");
            if(args.length > 0 && !args[0].isEmpty()) {
                methodArgs.addAll(
                    Arrays.stream(args)
                    .map(s -> s.substring(1, s.length()-1))
                    .toList() 
                );
            }
        }
        else {
            throw new IllegalArgumentException();
        }
        return methodArgs;
    }

}
