FROM adoptopenjdk/openjdk11:latest
VOLUME /tmp
ADD target/mailserver-0.0.1-SNAPSHOT.jar app-mailserver.jar
ENTRYPOINT ["java","-jar","/app-mailserver.jar"]