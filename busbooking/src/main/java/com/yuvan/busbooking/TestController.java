package com.yuvan.busbooking;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController 
@RequestMapping("/api/v1")
public class TestController {
    
    @GetMapping("/health")
    public ResponseEntity<String> systemHealth() {
        return ResponseEntity.ok().body("SPRING-BOOT RUNNING ON PORT 8080");
    }

}
