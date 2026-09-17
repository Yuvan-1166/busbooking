# Backend Dependency Documentation — Bus Booking

## 1. Document purpose

This document analyzes the Maven `pom.xml` supplied for the **Bus Booking** backend and documents:

- the project/build baseline;
- every declared dependency;
- dependency scope and runtime/test behavior;
- the functional role of each library;
- the likely relationship between dependencies;
- security-sensitive dependencies;
- build and annotation-processing configuration;
- version-management strategy;
- recommendations for dependency maintenance and verification.

> **Analysis basis:** the supplied `pom.xml`.
>
> **Important:** Maven resolves additional transitive dependencies from the Spring Boot parent/BOM and from each library. The exact resolved dependency tree cannot be determined from the POM alone. Run `mvn dependency:tree` and `mvn help:effective-pom` in the project to obtain the exact resolved graph.

---

# 2. Project overview

| Property | Value |
|---|---|
| Group ID | `com.yuvan` |
| Artifact ID | `busbooking` |
| Version | `0.0.1-SNAPSHOT` |
| Packaging | Not explicitly specified; Maven defaults to `jar` |
| Java | 21 |
| Spring Boot parent | `4.1.1` |
| Build tool | Maven |
| Database | MySQL |
| Persistence | Spring Data JPA |
| Web stack | Spring MVC |
| Security | Spring Security + JWT libraries |
| Validation | Spring Validation |
| Email | Spring Boot Mail |
| 2FA | TOTP |
| QR generation | ZXing |
| Caching | Spring Cache + Caffeine |
| Environment configuration | dotenv-java |
| Google integration | Google API Client |
| Code generation | Lombok |

Spring Boot 4.1.1 requires at least Java 17 and supports Java versions through 26, so the project's Java 21 baseline is compatible with the declared Spring Boot version. Spring Boot 4.1.1 also uses Spring Framework 7.0.9 or later.  
Source: Spring Boot System Requirements.

---

# 3. Dependency inventory

The POM contains **21 direct dependencies**:

### Production/runtime dependencies

1. `spring-boot-starter-data-jpa`
2. `spring-boot-starter-security`
3. `spring-boot-starter-validation`
4. `spring-boot-starter-webmvc`
5. `mysql-connector-j`
6. `lombok`
7. `jjwt-api`
8. `jjwt-impl`
9. `jjwt-jackson`
10. `dotenv-java`
11. `spring-boot-starter-mail`
12. `google-api-client`
13. `totp`
14. `zxing-core`
15. `zxing-javase`
16. `caffeine`
17. `spring-boot-starter-cache`

### Test-only dependencies

18. `spring-boot-starter-data-jpa-test`
19. `spring-boot-starter-security-test`
20. `spring-boot-starter-validation-test`
21. `spring-boot-starter-webmvc-test`

The Spring Boot starters intentionally hide much of the transitive dependency complexity. Spring describes starters as convenient dependency descriptors that provide a consistent, supported set of managed transitive dependencies.

---

# 4. Dependency summary matrix

| # | Dependency | Version in POM | Scope | Primary purpose | Category |
|---:|---|---|---|---|---|
| 1 | `spring-boot-starter-data-jpa` | Managed | Compile | JPA/database persistence | Core |
| 2 | `spring-boot-starter-security` | Managed | Compile | Authentication/authorization | Security |
| 3 | `spring-boot-starter-validation` | Managed | Compile | Bean/request validation | Validation |
| 4 | `spring-boot-starter-webmvc` | Managed | Compile | REST/Web MVC application | Web |
| 5 | `mysql-connector-j` | Managed | Runtime | MySQL JDBC driver | Database |
| 6 | `lombok` | Managed | Compile + optional | Boilerplate reduction/annotation processing | Developer tooling |
| 7 | `jjwt-api` | 0.12.6 | Compile | JWT API | Security |
| 8 | `jjwt-impl` | 0.12.6 | Runtime | JJWT implementation | Security |
| 9 | `jjwt-jackson` | 0.12.6 | Runtime | Jackson integration for JJWT | Security |
| 10 | `dotenv-java` | 3.2.0 | Compile | `.env` configuration loading | Configuration |
| 11 | `spring-boot-starter-mail` | Managed | Compile | Email sending | Integration |
| 12 | `google-api-client` | 2.7.0 | Compile | Google API client functionality | External API |
| 13 | `totp` | 1.7.1 | Compile | Time-based one-time passwords | Security/2FA |
| 14 | `zxing-core` | 3.5.3 | Compile | QR/barcode encoding/decoding core | 2FA/QR |
| 15 | `zxing-javase` | 3.5.3 | Compile | Java SE ZXing integration | 2FA/QR |
| 16 | `caffeine` | Managed | Compile | In-memory caching implementation | Performance |
| 17 | `spring-boot-starter-cache` | Managed | Compile | Spring cache abstraction/integration | Performance |
| 18 | `spring-boot-starter-data-jpa-test` | Managed | Test | JPA test support | Testing |
| 19 | `spring-boot-starter-security-test` | Managed | Test | Security test support | Testing |
| 20 | `spring-boot-starter-validation-test` | Managed | Test | Validation test support | Testing |
| 21 | `spring-boot-starter-webmvc-test` | Managed | Test | Spring MVC test support | Testing |

---

# 5. Spring Boot dependency management

## 5.1 Spring Boot parent

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.1.1</version>
    <relativePath/>
</parent>
```

The parent provides Maven defaults and dependency management for the Spring Boot ecosystem.

A major consequence is that many dependencies in this POM intentionally do not specify versions. For example:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

This is normal for Spring Boot-managed dependencies.

The actual resolved versions should be treated as the versions supplied by Spring Boot's dependency-management configuration rather than manually adding arbitrary versions.

### Why this matters

Without the parent/BOM, every Spring component would need explicit version coordination. With Boot dependency management, compatible versions are selected together.

Useful commands:

```bash
mvn help:effective-pom
mvn dependency:tree
mvn dependency:tree -Dscope=runtime
mvn dependency:tree -Dscope=test
```

---

# 6. Core application dependencies

## 6.1 Spring Data JPA

### Maven coordinates

```text
org.springframework.boot:spring-boot-starter-data-jpa
```

### Purpose

Provides the persistence layer used to interact with the relational database through Jakarta Persistence/JPA and Spring Data.

Typical backend responsibilities include:

- entity mapping;
- repository interfaces;
- CRUD operations;
- transaction management;
- ORM integration;
- database query execution.

### Typical application usage

```java
@Entity
public class Bus {
    // fields
}

public interface BusRepository extends JpaRepository<Bus, Long> {
}
```

### Relationship to MySQL

The JPA starter supplies the persistence abstraction and ORM infrastructure. It does not itself provide the MySQL database server or JDBC driver.

The `mysql-connector-j` dependency supplies the JDBC driver needed for the application to communicate with MySQL.

### Operational dependency chain

```text
Application service
       |
Spring Data JPA
       |
JPA / Hibernate infrastructure
       |
JDBC
       |
MySQL Connector/J
       |
MySQL Server
```

Spring Boot provides auto-configuration around Data JPA.

---

# 7. Web/API layer

## 7.1 Spring MVC

### Maven coordinates

```text
org.springframework.boot:spring-boot-starter-webmvc
```

### Purpose

Provides Spring MVC and the servlet-based web stack used for HTTP endpoints.

This is the dependency responsible for the backend's REST/API layer.

Typical responsibilities:

- HTTP request routing;
- REST controllers;
- request/response serialization;
- JSON processing through the Spring Boot web stack;
- servlet-based request handling;
- embedded servlet container integration.

Spring Boot documentation describes `spring-boot-starter-webmvc` as the starter for Spring MVC and Tomcat.

### Typical usage

```java
@RestController
@RequestMapping("/api/buses")
public class BusController {

    @GetMapping
    public List<BusDto> getBuses() {
        // ...
    }
}
```

### Architectural role

```text
HTTP Client
    |
Controller
    |
Service
    |
Repository
    |
Database
```

---

# 8. Security dependencies

Security is one of the most important dependency groups in this project because the POM contains both Spring Security and a complete JWT implementation stack, plus TOTP for two-factor authentication.

## 8.1 Spring Security

### Maven coordinates

```text
org.springframework.boot:spring-boot-starter-security
```

### Purpose

Provides authentication and authorization infrastructure.

Potential responsibilities:

- login/authentication;
- endpoint authorization;
- password handling;
- security filters;
- session/security context management;
- method-level authorization;
- protection of HTTP endpoints.

Spring Boot documents that adding Spring Security to a web application causes web applications to be secured by default until the application's security configuration is customized.

### Important implementation consideration

The dependency alone does not define the application's final authentication model.

The project must configure:

- permitted endpoints;
- authenticated endpoints;
- authentication mechanism;
- password hashing;
- JWT filters if JWT is used;
- authorization rules;
- CORS/CSRF behavior where applicable;
- session policy.

---

# 9. JWT dependencies

The POM explicitly defines three JJWT modules:

```text
io.jsonwebtoken:jjwt-api:0.12.6
io.jsonwebtoken:jjwt-impl:0.12.6
io.jsonwebtoken:jjwt-jackson:0.12.6
```

This is a deliberate modular setup.

## 9.1 `jjwt-api`

```text
io.jsonwebtoken:jjwt-api:0.12.6
```

### Scope

Compile/default.

### Purpose

Provides the public JJWT API used by application code to:

- create JWTs;
- parse JWTs;
- validate signatures;
- inspect claims;
- configure token builders/parsers.

Typical usage includes:

```java
Jwts.builder()
    .subject(userId)
    // ...
    .compact();
```

---

## 9.2 `jjwt-impl`

```text
io.jsonwebtoken:jjwt-impl:0.12.6
```

### Scope

Runtime.

### Purpose

Provides the implementation behind the JJWT API.

Keeping it runtime-scoped is consistent with JJWT's modular dependency model: application source code normally depends on the API while the implementation is supplied at runtime.

---

## 9.3 `jjwt-jackson`

```text
io.jsonwebtoken:jjwt-jackson:0.12.6
```

### Scope

Runtime.

### Purpose

Provides Jackson-based JSON serialization/deserialization support for JJWT.

### JWT dependency architecture

```text
Application
    |
    +--> jjwt-api
    |
Runtime
    |
    +--> jjwt-impl
    |
    +--> jjwt-jackson
              |
              +--> Jackson support
```

All three JJWT modules should remain on the same version.

The JJWT project currently documents the same modular pattern for JDK projects: API at compile time, implementation and JSON integration at runtime.

The supplied POM uses JJWT 0.12.6. The JJWT 0.12.6 release included security/bug fixes, including a decompression memory-leak fix and a Bouncy Castle upgrade. The project has newer releases today, so this pinned version should be reviewed as part of dependency maintenance rather than assumed to be current.

---

# 10. Environment configuration

## 10.1 dotenv-java

```text
io.github.cdimascio:dotenv-java:3.2.0
```

### Purpose

Loads configuration values from a `.env` file.

Typical examples:

```text
DB_URL=jdbc:mysql://localhost:3306/busbooking
DB_USERNAME=...
DB_PASSWORD=...
JWT_SECRET=...
MAIL_USERNAME=...
MAIL_PASSWORD=...
```

The library's documentation describes it as a pure-Java, no-dependency approach to loading environment variables from `.env`.

### Recommended usage

Use dotenv primarily for local development convenience.

For production:

- use deployment/platform environment variables;
- use a secrets manager where available;
- do not commit `.env` files containing real secrets;
- ensure `.env` is included in `.gitignore`.

### Security note

The `.env` file should be treated as sensitive if it contains:

- database passwords;
- JWT signing secrets;
- mail credentials;
- OAuth/client secrets;
- API keys.

---

# 11. Database driver

## 11.1 MySQL Connector/J

```text
com.mysql:mysql-connector-j
```

### Scope

```xml
<scope>runtime</scope>
```

### Purpose

Provides JDBC connectivity to MySQL.

The runtime scope is appropriate because application source normally uses JDBC/JPA abstractions rather than directly compiling against driver implementation classes.

MySQL describes Connector/J as a JDBC Type 4 driver implemented in Java.

### Runtime flow

```text
Spring Data JPA
      |
Hibernate/JPA
      |
JDBC
      |
MySQL Connector/J
      |
MySQL
```

### Version management

The POM does not specify a version. Therefore the effective version is expected to come from Spring Boot's dependency management.

To find the exact version:

```bash
mvn dependency:tree -Dincludes=com.mysql:mysql-connector-j
```

---

# 12. Validation

## 12.1 Spring Boot validation starter

```text
org.springframework.boot:spring-boot-starter-validation
```

### Purpose

Provides Jakarta Bean Validation integration.

Typical use:

```java
public record CreateBusRequest(
    @NotBlank String registrationNumber,
    @NotNull Integer capacity
) {}
```

Controller example:

```java
@PostMapping
public ResponseEntity<?> create(
        @Valid @RequestBody CreateBusRequest request) {
    // ...
}
```

### Typical responsibilities

- request DTO validation;
- field constraints;
- method validation;
- standardized validation errors.

Validation should be used at API boundaries, while business rules should still be enforced in the service/domain layer.

---

# 13. Email

## 13.1 Spring Boot Mail

```text
org.springframework.boot:spring-boot-starter-mail
```

### Purpose

Provides Spring integration for sending email.

Potential bus-booking use cases include:

- booking confirmation;
- cancellation notification;
- password reset;
- OTP/verification email;
- account notification;
- administrative notification.

Typical configuration is placed in application configuration rather than hard-coded credentials.

Example conceptual configuration:

```properties
spring.mail.host=...
spring.mail.port=...
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
```

Credentials should come from environment/secrets rather than source control.

---

# 14. Google API integration

## 14.1 Google API Client

```text
com.google.api-client:google-api-client:2.7.0
```

### Purpose

Provides Java client infrastructure for interacting with Google APIs.

The actual APIs used by the application cannot be determined from the POM alone. For example, this dependency could be used alongside additional Google-specific API modules for services such as:

- Google Calendar;
- Google Drive;
- Google OAuth-related functionality;
- other Google APIs.

### Important distinction

`google-api-client` is a client framework/library. Its presence does not prove that a specific Google API is being used.

Inspect the Java source and additional dependencies to determine the exact integration.

### Version

The supplied POM pins version `2.7.0`.

The Google API Java Client release history records version 2.7.0 as an August 2024 release. Later releases exist, so the pinned version should be reviewed during dependency updates.

---

# 15. Two-factor authentication

## 15.1 TOTP

```text
dev.samstevens.totp:totp:1.7.1
```

### Purpose

Provides functionality for Time-based One-Time Password authentication.

The project documentation describes support for:

- generating shared secrets;
- generating/verifying one-time passwords;
- time providers;
- recovery codes;
- QR-related setup workflows.

### Typical authentication flow

```text
User enables 2FA
       |
Generate TOTP secret
       |
Store secret securely
       |
Generate provisioning URI / QR
       |
User scans QR with authenticator app
       |
Authenticator generates 6-digit code
       |
Backend verifies code
       |
2FA enabled
```

### Security considerations

The TOTP secret is sensitive authentication material.

Do not:

- log the secret;
- expose it in normal API responses;
- store it unencrypted if your threat model requires stronger protection;
- place it in source code.

The TOTP verification window should be chosen carefully to balance clock drift and replay risk.

---

# 16. QR code generation

The project uses two ZXing modules.

## 16.1 ZXing Core

```text
com.google.zxing:core:3.5.3
```

### Purpose

Provides core barcode/QR functionality.

It is commonly used for:

- QR encoding;
- QR decoding;
- barcode processing;
- matrix generation.

## 16.2 ZXing JavaSE

```text
com.google.zxing:javase:3.5.3
```

### Purpose

Provides Java SE-specific functionality on top of ZXing core.

### Relationship

```text
TOTP
  |
Provisioning information
  |
ZXing
  |
QR code image/data
  |
Authenticator application
```

The two ZXing dependencies should normally remain on the same version.

---

# 17. Caching

The project uses both Spring Cache and Caffeine.

## 17.1 Spring Cache

```text
org.springframework.boot:spring-boot-starter-cache
```

### Purpose

Provides Spring's cache abstraction.

It allows application code to use annotations such as:

```java
@Cacheable("tokens")
public TokenData getToken(String token) {
    // ...
}
```

The abstraction separates business code from the underlying cache implementation.

---

## 17.2 Caffeine

```text
com.github.ben-manes.caffeine:caffeine
```

### Purpose

Provides the actual in-memory cache implementation.

Caffeine supports features including:

- automatic loading;
- maximum-size eviction;
- time-based expiration;
- weak/soft references;
- eviction notifications;
- cache statistics.

Spring Framework provides dedicated Caffeine integration through its cache abstraction.

### Relationship

```text
Application
    |
Spring Cache abstraction
    |
CacheManager
    |
Caffeine
    |
In-memory cache
```

### Token caching

The POM comment says:

```text
Caffeine Cache for token caching
```

Therefore the intended use appears to include token-related caching.

The POM alone does not establish:

- which tokens are cached;
- cache TTL;
- maximum size;
- eviction policy;
- whether refresh tokens are cached;
- whether the cache is authoritative;
- whether multiple backend instances share the cache.

Those details must be documented from the Java configuration and service classes.

### Distributed-system consideration

Caffeine is an in-process cache. If the backend is deployed as multiple application instances, each instance has its own cache.

Therefore, if cached authentication/token state must be shared between multiple instances, a distributed cache such as Redis may need to be considered depending on the application's design.

---

# 18. Lombok

## 18.1 Lombok

```text
org.projectlombok:lombok
```

### Configuration

```xml
<optional>true</optional>
```

The compiler plugin also explicitly configures Lombok as an annotation processor.

### Purpose

Reduces Java boilerplate through annotations.

Common examples:

```java
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
```

### Annotation processing

The POM configures Lombok for both:

- main compilation;
- test compilation.

This means Lombok annotations are processed during both compile phases.

### Why `optional=true`?

The optional flag tells Maven consumers that Lombok is not intended to become a required transitive dependency of projects consuming this artifact.

This is generally appropriate for a compile-time developer tool rather than a runtime library.

---

# 19. Test dependencies

Spring Boot 4 provides focused test modules.

## 19.1 JPA test

```text
org.springframework.boot:spring-boot-starter-data-jpa-test
```

Scope:

```text
test
```

Purpose:

- repository/JPA tests;
- JPA test slices;
- persistence-related test infrastructure.

Spring Boot documents `spring-boot-data-jpa-test` as providing the `@DataJpaTest` test slice.

---

## 19.2 Security test

```text
org.springframework.boot:spring-boot-starter-security-test
```

Scope:

```text
test
```

Purpose:

- testing security configuration;
- testing authenticated requests;
- testing authorization behavior;
- security-focused MVC tests.

---

## 19.3 Validation test

```text
org.springframework.boot:spring-boot-starter-validation-test
```

Scope:

```text
test
```

Purpose:

- testing validation behavior;
- validation-related test slices/support.

---

## 19.4 Web MVC test

```text
org.springframework.boot:spring-boot-starter-webmvc-test
```

Scope:

```text
test
```

Purpose:

- controller tests;
- MVC request/response tests;
- serialization/deserialization tests;
- web-layer testing.

### Recommended test structure

```text
                    Backend Tests
                         |
        +----------------+----------------+
        |                |                |
     Web/MVC            JPA            Security
        |                |                |
 webmvc-test          data-jpa-test   security-test
        |
 validation-test
```

---

# 20. Dependency scopes

The POM uses Maven scopes in a sensible way.

| Scope | Dependencies | Meaning |
|---|---|---|
| Compile/default | Most application libraries | Available to main application code |
| Runtime | MySQL driver, JJWT implementation, JJWT Jackson | Needed when the application runs |
| Test | Spring Boot test starters | Available only to tests |
| Optional | Lombok | Not intended to be required transitively by consumers |

## Runtime-only JJWT modules

The following are correctly runtime-scoped:

```text
jjwt-impl
jjwt-jackson
```

while:

```text
jjwt-api
```

remains available at compile time.

This separates the public API from the implementation/runtime modules.

---

# 21. Build plugins

Although they are not dependencies used by application code, the POM contains two important build plugins.

## 21.1 Spring Boot Maven Plugin

```text
org.springframework.boot:spring-boot-maven-plugin
```

### Purpose

Supports Spring Boot Maven build and packaging operations.

It is normally responsible for producing an executable Spring Boot application artifact suitable for:

```bash
java -jar ...
```

---

# 22. Maven Compiler Plugin

```text
org.apache.maven.plugins:maven-compiler-plugin
```

The POM explicitly configures two executions:

```text
default-compile
default-testCompile
```

Both configure Lombok as an annotation processor.

### Main compilation

```text
compile
  |
Lombok annotation processing
  |
compiled application classes
```

### Test compilation

```text
testCompile
  |
Lombok annotation processing
  |
compiled test classes
```

This explicit setup makes the annotation-processing requirement visible in the build.

---

# 23. Dependency architecture

The overall dependency architecture can be represented as follows:

```text
                         Bus Booking Backend
                                |
       +------------------------+-------------------------+
       |                        |                         |
       v                        v                         v
   Web/API                  Security                  Persistence
       |                        |                         |
 Spring MVC              Spring Security              Spring Data JPA
       |                        |                         |
       |                  JWT + TOTP + QR               JPA/ORM
       |                        |                         |
       |                  +-----+-----+                  |
       |                  |           |                  |
       |                JJWT        TOTP               JDBC
       |                              |                  |
       |                            ZXing                |
       |                                                 |
       +---------------------------+---------------------+
                                   |
                                 MySQL
                                   |
                         MySQL Connector/J

       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
   Validation            Email             Google API
       |                   |                   |
 Spring Validation   Spring Boot Mail     Google Client

       +-------------------+
       |
       v
    Caching
       |
 Spring Cache
       |
   Caffeine

       +-------------------+
       |
       v
 Configuration
       |
 dotenv-java
```

---

# 24. Functional dependency groups

## Group A — Web/API

- `spring-boot-starter-webmvc`

Responsible for HTTP/REST endpoints and the web layer.

## Group B — Persistence

- `spring-boot-starter-data-jpa`
- `mysql-connector-j`

Responsible for relational persistence.

## Group C — Security

- `spring-boot-starter-security`
- `jjwt-api`
- `jjwt-impl`
- `jjwt-jackson`
- `totp`

Responsible for authentication, authorization, JWT handling and 2FA.

## Group D — Validation

- `spring-boot-starter-validation`

Responsible for DTO/request validation.

## Group E — Email

- `spring-boot-starter-mail`

Responsible for outbound email.

## Group F — External API

- `google-api-client`

Responsible for Google API client functionality.

## Group G — QR/2FA

- `totp`
- `zxing-core`
- `zxing-javase`

Responsible for TOTP and QR-code setup.

## Group H — Caching

- `spring-boot-starter-cache`
- `caffeine`

Responsible for in-memory caching.

## Group I — Configuration

- `dotenv-java`

Responsible for local `.env` configuration loading.

## Group J — Developer tooling

- `lombok`

Responsible for compile-time code generation.

## Group K — Testing

- `spring-boot-starter-data-jpa-test`
- `spring-boot-starter-security-test`
- `spring-boot-starter-validation-test`
- `spring-boot-starter-webmvc-test`

Responsible for automated testing.

---

# 25. Version-management analysis

There are two version-management patterns in the POM.

## 25.1 Spring Boot-managed versions

These dependencies omit explicit versions:

```text
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-validation
spring-boot-starter-webmvc
mysql-connector-j
lombok
spring-boot-starter-data-jpa-test
spring-boot-starter-security-test
spring-boot-starter-validation-test
spring-boot-starter-webmvc-test
spring-boot-starter-mail
caffeine
spring-boot-starter-cache
```

Their exact versions should be taken from the effective Maven dependency management.

## 25.2 Explicitly pinned versions

These are explicitly specified:

| Dependency | Version |
|---|---:|
| JJWT | `0.12.6` |
| dotenv-java | `3.2.0` |
| Google API Client | `2.7.0` |
| TOTP | `1.7.1` |
| ZXing | `3.5.3` |

### Maintenance implication

Pinned third-party versions need a periodic update process.

Do not update only one component of a tightly coupled family without checking compatibility. This especially applies to:

- JJWT modules;
- ZXing modules.

---

# 26. Dependency/security observations

## 26.1 JWT

JWT is security-sensitive because it controls authentication state.

The implementation should document:

- signing algorithm;
- key source;
- key rotation policy;
- token expiration;
- issuer/audience validation;
- refresh-token strategy;
- revocation strategy;
- clock-skew handling;
- required claims.

Do not store a JWT signing secret directly in Java source.

---

## 26.2 TOTP secrets

TOTP shared secrets are authentication credentials.

Recommended controls:

- encrypt secrets at rest where appropriate;
- never log them;
- never expose them after initial provisioning;
- invalidate/re-provision when 2FA is reset;
- protect recovery codes;
- implement replay/rate-limit controls.

---

## 26.3 Database credentials

Database credentials should not be embedded in:

```text
application.properties
application.yml
Java source
Git history
Docker images
```

Prefer environment variables or a secrets-management mechanism.

---

## 26.4 Email credentials

SMTP credentials should be externalized in the same manner.

---

## 26.5 Google credentials

If Google OAuth/service-account credentials are used, they should also be stored outside source control.

---

# 27. Caching/security interaction

Because the POM specifically mentions token caching, cache design deserves explicit documentation.

Questions that should be answered in the application design:

1. What exact object is cached?
2. Is it a JWT, refresh token, token metadata, user record, or authentication result?
3. What is the TTL?
4. What happens after logout?
5. What happens when a token is revoked?
6. Is cache eviction synchronized with authentication state?
7. Does the system run on one server or multiple instances?
8. Is stale authentication state acceptable?
9. What happens after application restart?
10. Can sensitive token data appear in cache dumps or diagnostics?

Caffeine is an in-process cache, so application instances do not automatically share entries.

---

# 28. Potential dependency redundancy / review points

## 28.1 `google-api-client`

The POM tells us that the generic Google API client is included, but it does not identify the Google API actually being consumed.

Review the Java imports and determine whether a narrower Google API dependency can be used.

This is not necessarily a problem; it is a documentation and dependency-minimization checkpoint.

---

## 28.2 dotenv in production

`dotenv-java` is useful for local development, but production environments commonly provide environment variables directly.

Document whether the application expects:

```text
development -> .env
production  -> environment/secrets manager
```

This avoids accidentally treating `.env` as the production secret-management system.

---

## 28.3 Caffeine token cache

If token state must be shared across multiple backend nodes, Caffeine alone does not provide distributed cache consistency.

This should be explicitly documented in the deployment architecture.

---

## 28.4 Explicit compiler configuration

The Maven compiler plugin is configured explicitly for Lombok annotation processing.

Confirm that this configuration is intentional and remains compatible with the selected Maven Compiler Plugin version managed by the parent/build environment.

---

# 29. Exact dependency tree verification

The POM is only the direct declaration layer.

Run:

```bash
mvn dependency:tree
```

For a compact dependency report:

```bash
mvn dependency:tree -Dverbose
```

For runtime dependencies:

```bash
mvn dependency:tree -Dscope=runtime
```

For test dependencies:

```bash
mvn dependency:tree -Dscope=test
```

For a specific library:

```bash
mvn dependency:tree -Dincludes=io.jsonwebtoken:*
```

or:

```bash
mvn dependency:tree -Dincludes=com.mysql:mysql-connector-j
```

For the final Maven model:

```bash
mvn help:effective-pom
```

For dependency updates:

```bash
mvn versions:display-dependency-updates
```

For dependency convergence:

```bash
mvn dependency:tree -Dverbose
```

Then inspect duplicate versions and conflicting transitive dependencies.

---

# 30. Recommended CI dependency checks

A production backend should automate dependency maintenance.

Recommended checks include:

### Build

```bash
mvn clean verify
```

### Dependency tree

```bash
mvn dependency:tree
```

### Dependency updates

Use a dependency-update mechanism such as Maven Versions Plugin or an automated dependency update service.

### Vulnerability scanning

Integrate an approved SCA/dependency scanner into CI.

The scanner should inspect both:

- direct dependencies;
- transitive dependencies.

This matters because Spring Boot starters pull in substantial transitive dependency graphs.

---

# 31. Suggested dependency ownership matrix

| Area | Main dependencies | Suggested owner |
|---|---|---|
| API/Web | Spring MVC | Backend/API |
| Database | Spring Data JPA + MySQL | Persistence |
| Authentication | Spring Security + JJWT | Security |
| 2FA | TOTP + ZXing | Security |
| Validation | Spring Validation | API |
| Email | Spring Mail | Integration |
| Google | Google API Client | Integration |
| Cache | Spring Cache + Caffeine | Performance |
| Configuration | dotenv | Platform/Backend |
| Build | Maven + Spring Boot plugin | Build/DevOps |
| Testing | Spring Boot test starters | QA/Backend |
| Boilerplate | Lombok | Development |

---

# 32. Recommended documentation for each application-level integration

The POM documents libraries, but a complete backend dependency document should also record how each library is actually used.

For each integration, add the following application-specific details:

```text
Dependency
    |
    +-- Purpose
    +-- Application classes using it
    +-- Configuration keys
    +-- Environment variables
    +-- Security considerations
    +-- Failure behavior
    +-- Timeout/retry policy
    +-- Monitoring
    +-- Tests
    +-- Upgrade notes
```

For example, for JWT:

```text
JJWT
 |
 +-- JwtService
 +-- JwtAuthenticationFilter
 +-- SecurityConfig
 +-- LoginService
 +-- TokenRepository/Cache
 +-- JWT_SECRET
 +-- access-token TTL
 +-- refresh-token TTL
 +-- signing algorithm
 +-- key rotation
```

The exact class names above are examples; they must be replaced by the actual project classes.

---

# 33. Recommended package-to-dependency mapping

A clean backend can document dependency usage approximately as:

```text
controller/
    Spring MVC
    Validation

service/
    Business logic
    Security
    Email
    Google API
    TOTP

repository/
    Spring Data JPA

entity/
    JPA

security/
    Spring Security
    JJWT
    TOTP

cache/
    Spring Cache
    Caffeine

config/
    Spring configuration
    dotenv integration
    Mail configuration
    Security configuration

util/
    ZXing
    JWT helpers
```

This is a documentation target, not an assertion about the current source tree.

---

# 34. Dependency lifecycle

A recommended dependency lifecycle is:

```text
Select dependency
      |
Document purpose
      |
Pin/manage version
      |
Build
      |
Run unit/integration tests
      |
Security scan
      |
Deploy
      |
Monitor
      |
Review updates
      |
Upgrade
      |
Regression test
```

For security-sensitive libraries, updates should be reviewed sooner when a security advisory affects the dependency.

---

# 35. Upgrade strategy

## Spring Boot

Because Spring Boot controls a large dependency graph, upgrade the Boot parent as a coordinated unit rather than independently overriding Spring Framework/Hibernate/etc. unless there is a specific documented reason.

Before upgrading:

```bash
mvn clean verify
```

Then review:

- Spring Security behavior;
- Hibernate/JPA behavior;
- servlet/container compatibility;
- validation changes;
- test module changes;
- configuration property changes.

---

## JJWT

Keep these versions aligned:

```text
jjwt-api
jjwt-impl
jjwt-jackson
```

Do not mix arbitrary JJWT module versions.

After an upgrade, test:

- token creation;
- token parsing;
- signature validation;
- expiration;
- invalid signature behavior;
- malformed-token behavior;
- authentication filter behavior.

---

## ZXing

Keep:

```text
core
javase
```

on compatible versions and test QR generation/decoding.

---

## TOTP

After updates, test:

- secret generation;
- provisioning;
- QR scanning;
- valid-code verification;
- invalid-code rejection;
- time drift handling;
- recovery-code flows.

---

# 36. Dependency risk classification

This section describes areas that deserve additional engineering attention; it is not a security audit.

| Area | Why it matters |
|---|---|
| Spring Security | Controls access to application resources |
| JJWT | Handles authentication tokens |
| TOTP | Handles second-factor authentication secrets |
| MySQL Connector/J | Database connectivity |
| Google API Client | External-service credentials and network calls |
| Mail | External SMTP credentials and outbound communication |
| dotenv | Can expose application secrets if `.env` is mishandled |
| Caffeine | Can affect token/cache consistency |
| Lombok | Compile-time code generation |
| Spring Boot parent | Controls a large transitive dependency graph |

---

# 37. Important limitation of this POM analysis

The supplied POM is sufficient to document **declared direct dependencies**, but not the complete resolved dependency graph.

For example:

```text
spring-boot-starter-data-jpa
        |
        +--> multiple transitive libraries
```

The exact transitive graph depends on the effective dependency-management configuration.

Therefore, for an official Software Bill of Materials (SBOM) or security inventory, generate the dependency tree from the actual build.

Recommended command:

```bash
mvn dependency:tree -DoutputFile=dependency-tree.txt
```

For an SBOM, use a Maven-compatible SBOM generator such as CycloneDX and commit the generated artifact to the build/release process where appropriate.

---

# 38. Final dependency checklist

Before releasing the backend, verify:

- [ ] Java 21 is installed in CI and production.
- [ ] Maven version is compatible with Spring Boot 4.1.1.
- [ ] Spring Boot-managed versions are resolved through dependency management.
- [ ] JJWT modules use the same version.
- [ ] ZXing modules use the same version.
- [ ] MySQL driver is runtime-scoped.
- [ ] Test dependencies remain test-scoped.
- [ ] Lombok is not unnecessarily exposed to consumers.
- [ ] JWT signing secrets are externalized.
- [ ] TOTP secrets are protected.
- [ ] Database credentials are externalized.
- [ ] Mail credentials are externalized.
- [ ] Google credentials are externalized.
- [ ] `.env` files containing secrets are excluded from source control.
- [ ] Caffeine cache behavior is documented.
- [ ] Token cache TTL and invalidation behavior are documented.
- [ ] Multi-instance deployment implications are documented.
- [ ] `mvn dependency:tree` has been reviewed.
- [ ] Transitive dependencies have been vulnerability-scanned.
- [ ] Dependency updates are periodically reviewed.
- [ ] Integration tests cover authentication, 2FA, persistence, mail, and external APIs.

---

# 39. Reference documentation

The following official/project documentation was used to validate the library roles and version-related observations:

- Spring Boot Reference Documentation
- Spring Boot System Requirements
- Spring Boot Build Systems / Starters
- Spring Boot Test Modules
- Spring Security documentation
- JJWT project documentation and release history
- dotenv-java project documentation
- MySQL Connector/J project documentation
- Google API Java Client release history
- Java TOTP project documentation
- ZXing project documentation
- Spring Framework Cache documentation
- Caffeine documentation

---

# 40. Executive summary

The backend POM describes a **Spring Boot 4.1.1 / Java 21** application with a conventional layered backend stack.

The major dependency areas are:

```text
Spring MVC             -> HTTP/API layer
Spring Security        -> authentication/authorization
JJWT                   -> JWT tokens
TOTP + ZXing           -> 2FA + QR setup
Spring Data JPA        -> persistence
MySQL Connector/J      -> MySQL connectivity
Spring Validation      -> request validation
Spring Mail            -> email
Google API Client      -> Google integrations
Spring Cache+Caffeine  -> in-memory caching
dotenv-java            -> local/environment configuration
Lombok                 -> compile-time boilerplate reduction
Spring Boot test       -> automated testing
```

The POM uses Spring Boot dependency management for the majority of dependencies and explicitly pins several third-party libraries.

The most important areas to document further from the actual source code are:

1. **JWT architecture** — signing algorithm, key management, expiry, refresh and revocation.
2. **2FA architecture** — TOTP secret storage, provisioning and recovery.
3. **Token cache behavior** — TTL, eviction and multi-instance behavior.
4. **Google integration** — which Google APIs are actually consumed.
5. **Environment/secrets management** — production handling of credentials.
6. **Resolved dependency graph** — exact transitive versions and vulnerabilities.

For the authoritative build-level dependency inventory, generate and retain the output of:

```bash
mvn help:effective-pom
mvn dependency:tree
mvn clean verify
```

This document should be updated whenever the POM, Spring Boot parent, authentication architecture, or major integration dependencies change.
