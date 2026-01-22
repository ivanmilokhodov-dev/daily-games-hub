# Build stage - v2 forcing fresh build
FROM eclipse-temurin:17-jdk-alpine AS build
ARG CACHEBUST=1
WORKDIR /app
COPY pom.xml .
RUN apk add --no-cache maven
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/hub-0.0.1-SNAPSHOT.jar app.jar
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
