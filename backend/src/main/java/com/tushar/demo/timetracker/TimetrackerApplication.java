package com.tushar.demo.timetracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TimetrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TimetrackerApplication.class, args);
	}

}
