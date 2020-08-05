package com.ujjaval.ecommerce.authenticationservice.entity;

import lombok.*;

import javax.persistence.*;

@Getter
@Setter
@NoArgsConstructor
@ToString
@Entity
public class UserInfo {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private int userId;

    private String firstName;

    private String lastName;

    private String username;

    private String password;

    private String email;

    public UserInfo(String firstName, String lastName, String username, String password, String email) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        this.password = password;
        this.email = email;
    }
}
