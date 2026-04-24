package com.myshop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class MyShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyShopApplication.class, args);
    }
}









