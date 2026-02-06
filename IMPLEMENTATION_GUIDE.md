# Implementation Guide
## Handwritten Form Extraction System (Java Spring Boot)

---

## Project Structure

```
form-extraction-app/
├── backend/
│   ├── src/main/java/com/app/
│   │   ├── Application.java
│   │   ├── config/
│   │   ├── controller/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── service/
│   │   └── dto/
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── credentials.json
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 1. Backend Setup (Java Spring Boot)

### Step 1.1: pom.xml Dependencies

```xml
<dependencies>
    <!-- Web & Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>

    <!-- Data -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- AI (LangChain4j) -->
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
        <version>0.27.1</version>
    </dependency>
    <dependency>
        <groupId>dev.langchain4j</groupId>
        <artifactId>langchain4j</artifactId>
        <version>0.27.1</version>
    </dependency>

    <!-- Cloud SDKs -->
    <dependency>
        <groupId>com.google.cloud</groupId>
        <artifactId>google-cloud-vision</artifactId>
        <version>3.22.0</version>
    </dependency>
    
    <!-- Utils -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

### Step 1.2: application.properties

```properties
spring.datasource.url=jdbc:mysql://db:3306/form_extraction
spring.datasource.username=formapp
spring.datasource.password=securepassword123
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# Security
app.jwt.secret=your-secret-key-change-in-production
app.jwt.expiration=86400000

# Storage
app.upload.dir=uploads/
```

### Step 1.3: Core Controller Example

```java
@RestController
@RequestMapping("/api/forms")
public class FormController {

    @Autowired
    private FormService formService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadForm(@RequestParam("file") MultipartFile file) {
        // Implementation details
        return ResponseEntity.ok("File uploaded successfully");
    }
}
```

---

## 2. Frontend Setup (React)

(Remains same as previous version)

---

## 3. Docker Setup

### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: form_extraction
      MYSQL_USER: formapp
      MYSQL_PASSWORD: securepassword123
      MYSQL_ROOT_PASSWORD: rootpassword
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/form_extraction
    ports:
      - "8080:8080"
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
```

---

## 4. Timeline

- Design Review: Tomorrow 12:30 PM
- Implementation: 3-5 days
- Testing: 2 days
