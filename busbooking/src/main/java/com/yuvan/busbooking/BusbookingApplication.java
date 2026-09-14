package com.yuvan.busbooking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BusbookingApplication {

	public static void main(String[] args) {
		SpringApplication.run(BusbookingApplication.class, args);
	}

}
