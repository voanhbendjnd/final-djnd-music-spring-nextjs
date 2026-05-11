# Stage 1: Build
FROM gradle:8.5-jdk21 AS build
WORKDIR /app
COPY . .
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Run
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Install audiowaveform for waveform generation
RUN apt-get update && apt-get install -y \
    wget \
    libmad0 \
    libid3tag0 \
    libgd3 \
    libpng-dev \
    && wget https://github.com/bbc/audiowaveform/releases/download/1.0.1/audiowaveform-1.0.1-ubuntu-x86_64.tar.gz \
    && tar -xzf audiowaveform-1.0.1-ubuntu-x86_64.tar.gz \
    && mv audiowaveform /usr/local/bin/ \
    && rm audiowaveform-1.0.1-ubuntu-x86_64.tar.gz \
    && apt-get clean

COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]