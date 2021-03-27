FROM adoptopenjdk/openjdk11:latest
VOLUME /tmp
ADD target/vhr-web-0.0.1-SNAPSHOT.jar app-vhr-web.jar
ENTRYPOINT ["java","-jar","/app-vhr-web.jar"]