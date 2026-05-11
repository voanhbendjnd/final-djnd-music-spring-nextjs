# Stage 1: Build stage
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy các file cấu hình gradle trước để cache dependencies
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Cấp quyền thực thi cho gradlew (quan trọng nếu bạn build trên Linux/Docker)
RUN chmod +x gradlew

# Download dependencies
RUN ./gradlew dependencies --no-daemon

# Copy source code và build file jar
COPY src ./src
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Run stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Cài đặt audiowaveform
RUN apt-get update && apt-get install -y \
    software-properties-common \
    && add-apt-repository ppa:chris-needham/ppa \
    && apt-get update && apt-get install -y audiowaveform \
    && rm -rf /var/lib/apt/lists/*

# Fix lỗi copy: Gradle xuất file vào build/libs/, bỏ dòng COPY target/ dư thừa đi
COPY --from=build /app/build/libs/*.jar app.jar

# Tạo thư mục tạm để xử lý nhạc (khớp với VOLUME trong docker-compose)
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]